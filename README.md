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
```

`frontend/.env.local` (gitignored - copy from `frontend/.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Anything prefixed `NEXT_PUBLIC_` ships in client-side JS - never put a
secret there. `ADMIN_PASSWORD`/`RAG_SERVICE_URL`/`MONGODB_URI` stay
server-only in `backend/.env` for exactly that reason.

### Authentication (Session 19)

One demo admin account, no signup flow - `/login` posts to
`POST /api/auth/login`, which checks the email/password against
`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `backend/.env` and returns an opaque
token kept in memory server-side (`backend/middleware/auth.js`). Every
`/api/dashboard/*` and `/api/ai/*` route requires it. The frontend stores
the token in `localStorage` (`frontend/lib/auth.ts`) and attaches it to
every request; `/dashboard/*` redirects to `/login` if it's missing
(`frontend/components/AuthGuard.tsx`), and a mid-session 401 (e.g. the
backend restarted, which clears every session) redirects there too
instead of getting stuck on an error screen. This is intentionally
"basic" - restarting the backend signs everyone out, and there's no user
database, just one env-var account. See `SESSION_19_NOTES.md` for why.

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

## Deployment (Session 19 prep; the AI-hosting blocker is resolved, the backend host isn't picked yet)

Verified ready for Vercel: `npm run build` succeeds clean (no TypeScript
errors), `npm run start` serves every route correctly, `.gitignore` keeps
every real `.env`/`.env.local` out of git while `.env.example` files stay
committed as templates. **Slide 19's own deployment blocker - Ollama and
ChromaDB only running on `localhost` - is resolved**: `/api/ai/ask`
answers straight from MongoDB now (`backend/lib/smartSearch.js`), so
there's nothing left in this app that *requires* a GPU or a persistent
process to run. What's still not done, deliberately:

1. **No `git push`, no Vercel project created, nothing actually
   deployed.** Pushing code and creating cloud infrastructure are
   actions on shared state outside this machine - that needs you to
   actually want it done, not just "the code is ready."
2. **The backend itself isn't restructured for Vercel's serverless
   model yet.** It's still a traditional long-running Express app
   (`app.listen()`), and Session 19's auth added an in-memory token
   store that wouldn't survive across separate serverless invocations
   (no shared memory between them). Two ways forward, your call: host
   this backend as-is on any Node-friendly platform (Render/Railway/
   Fly.io - now just Node + MongoDB, no AI infra needed, meaningfully
   cheaper than when it needed Ollama) with Vercel hosting only the
   frontend; or adapt the backend to run on Vercel too, which means
   moving the session store to MongoDB or swapping to signed JWTs first.

Either way: use MongoDB Atlas instead of `localhost` for the backend's
`MONGODB_URI`, and set `NEXT_PUBLIC_API_URL` (+ the backend's own env
vars, wherever it ends up hosted) in Vercel's Project → Settings →
Environment Variables, split across Development/Preview/Production as
Slide 19 describes.
