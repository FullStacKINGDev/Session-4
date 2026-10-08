# Session 18 — AI Chat Over Your Data

User Question → Next.js AI Search Bar → Node.js API → RAG Service → ChromaDB + Ollama → AI Answer

Session 17 built `ask_rag(question)` - a working pipeline, but only
reachable from a terminal. This session's job (Slide 1's "Today's Goal":
*"turn our RAG pipeline into a real dashboard feature"*) is exposing it
through the actual product: a `POST /api/ai/ask` endpoint on the Node
backend, and an AI search bar on the Next.js dashboard.

## The one real architecture decision this session

Slide 7's pseudocode shows the Node route calling `askRag(question)`
directly, as if it were a local JavaScript function:

```js
app.post("/api/ai/ask", async (req, res) => {
  const { question } = req.body;
  const answer = await askRag(question);
  res.json({ answer });
});
```

That's a simplification the slide can afford because it doesn't have to
deal with `askRag()` actually being Python. Ours does - Sessions 16-17
built the real pipeline in Python specifically for ChromaDB's and
Ollama's native clients. Slide 8 is explicit that the point of today is
*"we are not rebuilding RAG, we are exposing our existing RAG pipeline
through an API"* - so rewriting the whole thing in JavaScript would both
contradict that instruction and throw away two sessions of verified work
for no reason.

Slide 5 actually already draws the right shape for this, even if Slide 7
glosses over it - its own "✅ our architecture" diagram has a distinct
**RAG Service** box underneath the Node API, separate from ChromaDB and
Ollama. That maps exactly onto "Python process exposed over HTTP, Node
proxies to it":

```
Next.js  ->  Node.js API (:5000)  ->  RAG Service (:8001, Python/Flask)  ->  ChromaDB + Ollama
```

New file **`backend/rag/api.py`** - a small Flask app with one route,
`POST /ask`, that calls `rag.py`'s `ask_rag()` and returns its result as
JSON. It's a long-running process, not a `python rag.py` spawned per
request - Session 17 measured ~20-28s to cold-load the Ollama models vs
~0.3s once warm, and a fresh interpreter + fresh model load on every
dashboard question would make the search bar feel broken. Start it once,
leave it running.

## Files

| File | Purpose |
| --- | --- |
| `backend/rag/api.py` | **New.** Flask service, `POST /ask` -> `ask_rag()` -> JSON |
| `backend/rag/rag.py` | `retrieve()` now also returns metadata; `ask_rag()` returns `{answer, sources}`, not a bare string (Slide 6's response shape) |
| `backend/rag/requirements.txt` | Added `flask` |
| `backend/controllers/aiController.js` | **New.** Proxies to the RAG service, wraps the response in this backend's `{success, data}` convention |
| `backend/routes/aiRoutes.js` | **New.** `POST /api/ai/ask` |
| `backend/server.js` | Mounts `aiRoutes` at `/api/ai` |
| `frontend/lib/api.ts` | **New** `askAI(question)` |
| `frontend/components/AISearch.tsx` | **New.** The search bar + answer card |
| `frontend/app/dashboard/page.tsx` | Renders `<AISearch />` above the KPI cards |

## Response shape - adapted, not copied verbatim

Slide 6 shows the API returning `{ answer, sources }` directly. The rest
of this backend has used `{ success: true, data: {...} }` /
`{ success: false, message }` since Session 9
(`dashboardController.js`) - every existing frontend call site
(`lib/api.ts`'s `request<T>()`) already expects that envelope. Kept that
convention here too rather than giving this one endpoint a different
shape: `{ success: true, data: { answer, sources } }`.

`sources` itself is a real addition past what Session 17 returned -
`retrieve()` only handed back document text before; it now also returns
ChromaDB's metadata for each retrieved record (`ingest.py` already stores
`source`/`id` on every document), so `ask_rag()` can report which actual
projects/suppliers backed an answer, e.g. `["Project C", "Project B",
"Project N"]`. Verified in the UI - every answer card shows its sources.

## Bug found live: inconsistent currency symbol

First end-to-end test through the Flask service, same question asked
three times:

```
"Project C has a total stock value of $0.03..."
"Project C has a total stock value of 0.03..."
"Project C has a total stock value of $0.03..."
```

Real bug, not a one-off: `frontend/lib/data.ts` is explicit that this
workbook's stock values are unitless (no currency/millions label - a
Session 09 decision, carried through every chart and KPI card since). An
AI answer sometimes inventing a "$" breaks that consistency, and
*inconsistently* is worse than *always* - a user can't tell which answer
to trust.

Two fixes, in order:

1. Added an explicit Style rule to `prompts.py` with a concrete example
   (`write "8.89", never "$8.89"`) - abstract rules ("no currency
   symbols") weren't reliably followed, a concrete contrast example was.
2. Set `temperature: 0.1` on the `ollama.chat()` call in `rag.py`
   (previously unset, i.e. the model's default). This is grounded Q&A
   over real numbers, not creative writing - low temperature is standard
   practice for that, and it measurably helped here too: 4/4 retests
   clean after, where the example alone had still left roughly 1-in-3
   answers adding the symbol.

Retested the full regression set after both fixes (greeting, out-of-scope
refusal, correct-answer accuracy, prompt-injection resistance, empty
question) - all still correct, no new regressions from lowering the
temperature.

## Answer quality, found by reading the dashboard's own output

After the feature was wired up and working, looked at a real answer
rendered in the UI rather than just checking it was non-empty:

> "Project C has a total stock value of 0.03. Of that, 0.00 is under 90
> days old, 0.00 is 90-180 days old, 0.00 is 180-365 days old, and 0.03
> is older than 365 days."

Accurate, but it's just the retrieved document's own sentence structure
read back verbatim - zeros and all - not something anyone synthesized.
Added a Case 2 rule to `prompts.py`: summarize what's meaningful (e.g.
"entirely aged past 365 days") instead of reciting every bucket. First
retest was better but imprecise - it said *"almost all of this value...
is older than 365 days"* for a project where the >365 bucket **is** the
entire value (0.03 of 0.03), not almost all of it. Tightened the rule
further: say "entirely"/"all of it" only when one bucket truly is the
whole value, reserve "almost all"/"mostly" for when something else is
genuinely nonzero too. Retested three cases - two single-bucket projects
now correctly say "All of its stock is older than 365 days," and a
multi-bucket project (Project M: 5.32/0.57/0.44/0.29 across the four
buckets) still correctly says "almost all... with the rest aging in the
other buckets," since that one genuinely has more than one nonzero
bucket. Re-ran the full regression set (greeting, refusal, correct
answer, "older than 365 days" list question, prompt injection) after -
no regressions.

## "Make the response unique and personalized"

Follow-up ask, same session. This app has no per-user login or profile -
"Analytics Admin / Internal Tool" is the one persona everyone sees - so
there's no *individual* to personalize answers to. Read the request
pragmatically instead: give the assistant one consistent voice instead
of a fill-in-the-blank template, and stop wasting the other retrieved
records. `retrieve()` always returns 3 records, but every Case 2 answer
only ever described the single best match and listed the other two in
"Sources" without using them for anything - real, already-fetched data
going unused.

Changes to `prompts.py`:

- **Role**: added one line of character ("write like a sharp,
  approachable colleague... not a generic chatbot reciting numbers")
  instead of a purely clinical job description.
- **Case 2**: lead with whatever the question actually asked for (the
  name for "which," the number for "how much") instead of always opening
  with "X has a stock value of Y" - and use the other retrieved records
  for a grounded comparison when that's genuinely useful, never forced.
- **Case 1 (greetings)**: reply in different words each time instead of
  the same canned sentence.
- **Style**: a general "read like it was written for this question, not
  filled into a template" rule.

**Regression caught immediately by retesting**, not assumed fixed: the
precision rule from the previous fix ("entirely" vs "almost all")
broke under the longer prompt - 3/3 retests of "Tell me about Project C"
produced *"Almost all of its stock is older than 365 days, with the
entire value sitting in this aging bucket"* - contradicting itself in
one sentence. More instructions competing for an 8B model's attention
diluted an already-tuned rule. Fixed by making that rule unavoidable:
an explicit "never write both in the same sentence" ban, a "check the
numbers first" instruction, and a concrete correct example ("Project X's
entire stock, 0.03, is aging past 365 days"). Retested 3/3 clean after -
no more contradiction, and the answer no longer opens with the "X has a
stock value of Y" template on its own, satisfying the uniqueness goal
too.

Re-ran the full regression set after the fix: greeting (asked twice -
*"Good morning!..."* then *"Hi there!..."*, genuinely different wording
now), out-of-scope refusal (still correct), prompt injection (still
blocked), empty question (still 400), multi-bucket project (Project M -
still correctly says "majority," since more than one bucket really is
nonzero there), and a new case - asked for the portfolio-wide average,
which the model correctly refused rather than silently averaging just
the 3 retrieved records: *"I don't know the average project stock
value, as the Inventory Dashboard only tracks individual project stock
values, not averages or totals across multiple projects."* Confirms the
grounding discipline held even as personality/variety were added on top.

## Verified end to end, live in the browser (Playwright)

- **Happy path**: clicked the "Tell me about Project C" suggested
  question chip -> loading state ("Thinking...", inputs disabled) ->
  real answer card with sources, matching the Flask/Node responses from
  direct `curl` testing.
- **Custom question**: typed "Which project has the highest stock
  value?", submitted with Enter -> correct answer ("Project M... at
  8.89").
- **Empty-question validation**: "Ask AI" button is disabled whenever the
  input is empty/whitespace - confirmed via Playwright's `isDisabled()`,
  not just by reading the code.
- **Error state, RAG service down**: stopped `api.py` mid-session, asked
  a question -> clean error card ("Unable to get an AI response. / AI
  service is unavailable. Is backend/rag/api.py running?"), rest of the
  dashboard (KPI cards, charts) kept working normally - the AI feature
  failing doesn't take anything else down with it, matching Slide 17's
  "AI should enhance the dashboard, not replace it."
- Also checked directly with `curl` before the browser pass: Node's own
  empty-question validation (400) and RAG-service-down handling (503) -
  both independent of whatever the frontend does, per Slide 9's "test the
  API first."

## Placement (Slide 17)

`<AISearch />` renders right after the page header, above the KPI cards -
and outside the `<ApiState>` wrapper that gates the rest of the page on
the MongoDB-backed metrics fetch. It doesn't depend on `metrics`/
`projects` state at all, so it shouldn't be blocked by - or block - that
fetch; confirmed this by triggering the RAG-service-down error above and
watching the KPI cards/charts underneath keep rendering normally.

## Not done (Session 19's likely territory, per Slide 20's "Capstone Polish, Authentication & Deployment Prep")

No conversation memory carried into the dashboard either (same limitation
Session 17 noted - every question is still independent). No streaming
response - the answer card appears all at once when the request finishes.
No auth on `/api/ai/ask` - anyone who can reach the Node API can ask it
anything. `api.py` is a Flask dev server (its own startup banner says so)
- fine for this course, not how it would run in production.
