# Full Stack AI Dashboard

Split into backend/frontend as of Session 10, connected live as of Session 13.
As of Session 16, `backend/` also has a `rag/` subfolder (Python + ChromaDB) -
it's still two projects, not three; RAG lives inside the backend, matching
the course architecture where ChromaDB sits alongside MongoDB under the
Node/API layer. As of Session 19, basic authentication protects both the
dashboard UI and its API - see Authentication below before running anything.
**Also as of Session 19, the AI search bar no longer calls `backend/rag/`
at all** - it answers from MongoDB directly (`backend/lib/smartSearch.js`),
specifically so the whole app can run without a GPU or any persistent AI
process, which is what Vercel deployment actually requires. `backend/rag/`
is kept as real, still-runnable Sessions 16-18 teaching material, just not
part of the live app anymore - see "backend/rag/" below.

```
Session 4/
├── backend/         Node.js + Express + Mongoose API (Sessions 5-9, 13)
│   └── rag/          Python + ChromaDB semantic search (Session 16+)
└── frontend/        Next.js App Router dashboard UI (Session 10+, live since 13)
```

## backend/

```bash
cd backend
npm install
cp .env.example .env    # fill in real values - see "Environment variables" below
npm run import:reset    # load data/inventory.xlsm into MongoDB
npm start                # http://localhost:5000
```

Endpoints: `POST /api/auth/login`, `POST /api/auth/logout` (Session 19, not
auth-protected themselves), `GET /api/dashboard/metrics`,
`GET /api/dashboard/projects`, `GET /api/dashboard/suppliers`,
`POST /api/ai/ask` (Session 18 - as of a Session 19 follow-up, answers
directly from MongoDB via `backend/lib/smartSearch.js`, no Ollama/ChromaDB
involved anymore, see below) - **these four now require a valid token**
(`Authorization: Bearer <token>` from `/api/auth/login`, Session 19). CORS
is enabled for the frontend's origin. Requires MongoDB running locally
(`mongodb://localhost:27017/dashboardDB`). Details:
`backend/SESSION_09_NOTES.md`, `backend/SESSION_13_NOTES.md`,
`backend/SESSION_14_NOTES.md`, `SESSION_19_NOTES.md`.

### Environment variables (Session 19)

`backend/.env` (gitignored - copy from `backend/.env.example`):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboardDB
ADMIN_EMAIL=admin@example.com      # the one demo login - change this
ADMIN_PASSWORD=change-me
JWT_SECRET=generate-your-own-64-char-hex-secret   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`frontend/.env.local` (gitignored - copy from `frontend/.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Anything prefixed `NEXT_PUBLIC_` ships in client-side JS - never put a
secret there. `ADMIN_PASSWORD`/`JWT_SECRET`/`MONGODB_URI` stay
server-only in `backend/.env` for exactly that reason.

### Authentication (Session 19, rewritten for deployment the same session)

One demo admin account, no signup flow - `/login` posts to
`POST /api/auth/login`, which checks the email/password against
`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `backend/.env` and returns a signed
JWT (`backend/middleware/auth.js`, `JWT_SECRET`). Every `/api/dashboard/*`
and `/api/ai/*` route requires it. The frontend stores the token in
`localStorage` (`frontend/lib/auth.ts`) and attaches it to every request;
`/dashboard/*` redirects to `/login` if it's missing
(`frontend/components/AuthGuard.tsx`), and a mid-session 401 (invalid or
expired token) redirects there too instead of getting stuck on an error
screen.

**Originally an in-memory token store** - simpler, but it couldn't
survive a Vercel deployment (serverless functions don't share memory
between invocations). Switched to stateless JWTs specifically to fix
that. Real tradeoff worth knowing: logout is client-side only now -
there's no server-side session left to revoke, so a token stays valid
for its full 24-hour lifetime even after logging out, until it expires
on its own. Fine for one demo admin account; a real multi-user product
wanting to revoke a specific leaked token early would need a denylist.
See `SESSION_19_NOTES.md` for the full before/after.

### backend/rag/ (historical - no longer wired into the live dashboard)

**As of a Session 19 follow-up, the dashboard's AI search bar no longer
uses anything in this folder.** `backend/lib/smartSearch.js` answers
`POST /api/ai/ask` directly from MongoDB instead - no Ollama, no
ChromaDB, no Python process required to run the app at all now. Why:
Vercel (where this is meant to be deployed) runs serverless functions,
not persistent processes, and there's no way to host a 5GB local model
or a disk-persisted vector database there - true of Ollama's embedding
model, not just its chat model, so "keep real vector search, drop just
the chat model" wasn't actually an option either. See `SESSION_19_NOTES.md`
for the full reasoning and the live before/after comparison (89ms vs.
20-40+ second Ollama cold-starts, and - a genuine accuracy win, not just
speed - complete results instead of Session 17's documented "only the
top-3 retrieved documents" limitation).

This folder is kept exactly as-is and still fully runs standalone - it's
real, working Sessions 16-18 teaching material for actual RAG (chunking,
embeddings, vector similarity search, a generated LLM answer), just not
what powers the live app anymore:

```bash
cd backend/rag
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe ingest.py --reset   # requires the backend + Ollama running
.venv/Scripts/python.exe rag.py               # ask the 4 practical questions, get real LLM answers
.venv/Scripts/python.exe rag.py "your own question here"
.venv/Scripts/python.exe api.py               # HTTP wrapper (Session 18) - :8001, standalone only now
```

**Always invoke `.venv/Scripts/python.exe` explicitly, not bare `python`**
- a different, incompatible ChromaDB version installed globally on this
machine will crash trying to open this project's database otherwise.
Requires [Ollama](https://ollama.com) running locally with both models
pulled (`ollama pull nomic-embed-text`, `ollama pull llama3.1:8b`).
Details: `backend/rag/SESSION_16_NOTES.md`, `backend/rag/SESSION_17_NOTES.md`,
`backend/rag/SESSION_18_NOTES.md`.

## frontend/

```bash
cd frontend
npm install
cp .env.example .env.local   # if you don't already have one
npm run dev                   # http://localhost:3000
```

Routes: `/`, `/login` (Session 19), `/dashboard`, `/dashboard/projects`,
`/dashboard/metrics`, `/dashboard/suppliers`. `/dashboard/*` requires
being signed in - see Authentication above. Details:
`frontend/SESSION_10_NOTES.md`, `SESSION_19_NOTES.md`.

**Run the backend first** (`cd backend && npm start`) - the dashboard
fetches live data from `NEXT_PUBLIC_API_URL` (`frontend/.env.local`,
`http://localhost:5000` by default) with real loading/error/empty
states. If the backend is down, each page (including the AI search bar)
shows an error with a Retry button rather than hanging or going blank.
The RAG service (`backend/rag/api.py`) is no longer needed to run the
app - see "backend/rag/" above.

## Deployment - live on Vercel

**Both frontend and backend are actually deployed**, not just
deploy-ready:

- Backend: `https://backend-three-bice-67.vercel.app`
- Frontend: `https://frontend-cyan-eta-76.vercel.app`

Both on Vercel's free tier, both using MongoDB Atlas's free M0 tier -
the whole stack costs nothing to run at this scale. Deployed via the
Vercel CLI (`npx vercel link`, `npx vercel env add`, `npx vercel --prod`
from each of `backend/` and `frontend/` as separate projects linked to
the same GitHub repo).

Both of Slide 19's original blockers are resolved: **Ollama/ChromaDB**
is gone from the live path (`/api/ai/ask` answers from MongoDB directly
via `backend/lib/smartSearch.js`), and **the in-memory session store**
was replaced with signed JWTs (`backend/middleware/auth.js`), so auth
works across serverless invocations that don't share memory.
`backend/app.js` exports the Express app directly (its default export
*is* the app - Vercel's zero-config Express detection requires that
exact shape, found live when the first deploy failed with "Invalid
export found... must be a function or server"), with a cached Mongoose
connection (`ensureDbConnected()`) safe for cold starts.

**One real gotcha worth knowing if you ever redo this**: the `mongodb+srv://`
connection string format failed inside the deployed Vercel function
(and on this project's own dev machine) with MongoDB's generic
"could not connect... check your IP whitelist" error - genuinely
misleading, since the real cause both times was the SRV/TXT DNS record
lookups that format needs, not IP access. The fix was switching to the
**standard, non-SRV connection string** - all shard hosts listed
explicitly:

```
mongodb://<user>:<pass>@host-00.xxxxx.mongodb.net:27017,host-01.xxxxx.mongodb.net:27017,host-02.xxxxx.mongodb.net:27017/dashboardDB?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

Get the exact hostnames and `replicaSet` name from Atlas's connection
instructions (choose "Driver" → look for the non-SRV / standard option),
or from a working `mongodb+srv://` connection's own `hello` command
response if you have one. Only matters if `+srv` gives you the same
whitelist-sounding error after confirming Network Access is actually
correct - plain `mongodb://` connections don't need this at all.

To redeploy after a code change: `git push`, then `cd backend && npx
vercel --prod` and/or `cd frontend && npx vercel --prod` (or connect
auto-deploy on push in each project's Vercel dashboard settings). Env
vars live in each project's Vercel dashboard (Settings → Environment
Variables), not in a file - `backend/.env.example` and
`frontend/.env.example` document what's needed. `npm run build` / `npm
run start` verified clean for the frontend; `.gitignore` keeps every
real `.env`/`.env.local` out of git.

**Not done, worth doing before this is more than a demo**: CORS is still
wide open (`app.use(cors())` in `backend/app.js`, no origin
restriction) - tighten it to the real frontend domain. Rotate the
Atlas password if it was ever shared anywhere outside Atlas's own UI.
