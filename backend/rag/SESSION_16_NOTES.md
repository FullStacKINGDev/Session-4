# Session 16 — AI / RAG: ChromaDB Hands-On

Install ChromaDB → Create Collection → Add Documents → Query → Retrieve

This lives at `backend/rag/` - inside the existing backend, not a sibling
project next to it. That placement matches Slide 4's architecture exactly:
ChromaDB sits alongside MongoDB, both reachable from the **Node/API
layer** - which is `backend/`, the one we already built in Sessions 5-14.
(First pass put this at the repo root as `rag/`, a sibling of `backend/`
and `frontend/`; corrected to nest it inside `backend/` instead, per the
user: "This should not be a sibling project... it should be in already
built backend.")

It's still a separate Python environment from the rest of the Node
backend (its own `.venv`, no package.json involvement) - "lives inside
backend/" is about where it sits in the architecture and the repo, not
about sharing a runtime with Express.

## Setup

```bash
cd backend/rag
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt   # chromadb, requests
.venv/Scripts/python.exe -c "import chromadb; print(chromadb.__version__)"   # Slide 5's verify step
```

Installed: ChromaDB 1.5.9 on Python 3.12.6. The default embedding model
downloaded automatically on first `ingest.py` run — no extra setup needed.

## Files

| File | Slide | Purpose |
| --- | --- | --- |
| `requirements.txt` | 5 | `chromadb`, `requests` |
| `ingest.py` | 17 | Build the `inventory_documents` collection |
| `search.py` | 18 + 19 | Query it, incl. the stretch-goal `search_inventory()` |
| `inspect_chroma.py` | 16 | The trainer's verification checklist, automated |
| `view_data.py` | 16 (follow-up) | Print every stored document, readably - see below |

## "How do I see the data?" — MongoDB has Compass, ChromaDB doesn't

Tried `chroma.exe run --path ./chroma_data` (the server mode that would
expose a REST API and, on recent versions, a browser admin UI) — it exits
immediately with no output at all, in foreground or background. Looks like
a Windows-specific issue in its `typer`/`rich` CLI layer, not something
worth chasing down for a viewer.

Built `view_data.py` instead: prints every document, grouped by `source`
and sorted by `stockValue` descending, optionally filtered
(`python view_data.py supplier`). Unlike `ingest.py`, it doesn't need the
backend running - confirmed live by stopping the backend and running it
anyway, since it only reads what's already persisted in `./chroma_data`.

For anyone who wants to look under the hood: the raw storage is a real
SQLite file at `backend/rag/chroma_data/chroma.sqlite3`, openable with any
SQLite browser (e.g. "DB Browser for SQLite") if you want to see Chroma's
internal table structure directly - not the friendliest view (embeddings
are stored as binary blobs), but proof it's not a black box.

## One deliberate adaptation: real, live documents instead of hardcoded ones

Slide 17's `ingest.py` hardcodes three example documents ("Project A has
stock value 1.12…") with numbers that don't match our actual workbook.
Our `ingest.py` instead calls the **real, running backend API**
(`GET /api/dashboard/projects` and `/suppliers` — the exact endpoints
built in Sessions 13-14) and builds one document per row from whatever is
actually in MongoDB right now. Same "never fabricate data" rule this whole
course has followed since Session 06. Run `cd backend && npm start` before
`python ingest.py`, or you'll get the same "Is the backend running?" style
error `lib/api.ts` gives the frontend.

`ingest.py --reset` clears the collection first; without the flag it
`upsert`s, so re-running after the backend's data changes (it has, see
[[session-14-charts]]) updates existing rows instead of erroring on
duplicate IDs.

## A second deliberate addition: supplier documents too

Slide 19's practical only asks for project data. We also ingested all 14
suppliers (`source: "supplier"` metadata, vs. `source: "project"`) in the
**same** collection. Reason: Slide 15 teaches metadata filtering using the
example "imagine our collection contains inventory docs, employee docs,
supplier docs…" — with only one document type, `where={"source": "..."}`
has nothing to actually filter out and the lesson falls flat. With two real
types, the filter demo in `search.py` is genuine: the same question
("which has aging inventory?") returns different, correctly-scoped results
with `source="supplier"` than without it.

28 documents total: 14 project + 14 supplier.

## Verified live

`python inspect_chroma.py` — all six of Slide 16's checklist items pass
(collection exists, documents added, IDs unique, metadata correct, query
returns results, sample row inspected).

`python search.py` ran all four of Slide 19's practical-challenge
questions against the real collection:

- *"Which project has the highest stock?"* → top result **Project M**
  (correct — M actually has the highest stock value right now)
- *"Tell me about Project C."* → top result **Project C**, by a clear
  margin (lowest distance of any query)
- *"Which project has inventory older than 365 days?"* → surfaced
  **Project N and M**, the two largest holders

Worth saying out loud in class (it's Slide 12's point, made concrete):
semantic search answers by *meaning*, not by *sorting the numbers* — for
"highest stock," Project B and N show up as runner-ups despite very
different actual values, because ChromaDB has no idea what "highest" means
numerically. It found documents that *talk about* stock similarly, not
documents with the *largest* `stockValue`. Good contrast with Session 09's
`$sort`/`$max`, which *does* know how to compare numbers — the two tools
solve different problems, which is exactly Slide 4's "MongoDB and ChromaDB
have different jobs."

## Not done (next session's territory, per Slide 20)

No LLM is wired in yet — `search.py` prints retrieved documents, it
doesn't generate an answer from them. That's Session 17 ("Building the
RAG Pipeline": chunking → embeddings → ChromaDB → retriever → LLM →
context-aware answer).
