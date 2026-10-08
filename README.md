# Full Stack AI Dashboard

Split into backend/frontend as of Session 10, connected live as of Session 13.
As of Session 16, `backend/` also has a `rag/` subfolder (Python + ChromaDB) -
it's still two projects, not three; RAG lives inside the backend, matching
the course architecture where ChromaDB sits alongside MongoDB under the
Node/API layer. As of Session 19, basic authentication protects both the
dashboard UI and its API - see Authentication below before running anything.

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
`POST /api/ai/ask` (Session 18 - proxies to `backend/rag/api.py`, see below)
- **these four now require a valid token** (`Authorization: Bearer <token>`
  from `/api/auth/login`, Session 19). CORS is enabled for the frontend's
origin. Requires MongoDB running locally (`mongodb://localhost:27017/dashboardDB`).
Details: `backend/SESSION_09_NOTES.md`, `backend/SESSION_13_NOTES.md`,
`backend/SESSION_14_NOTES.md`, `SESSION_19_NOTES.md`.

### Environment variables (Session 19)

`backend/.env` (gitignored - copy from `backend/.env.example`):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboardDB
ADMIN_EMAIL=admin@example.com      # the one demo login - change this
ADMIN_PASSWORD=change-me
RAG_SERVICE_URL=http://localhost:8001
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

### backend/rag/

```bash
cd backend/rag
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe ingest.py --reset   # requires the backend + Ollama running
.venv/Scripts/python.exe rag.py               # ask the 4 practical questions, get real LLM answers
.venv/Scripts/python.exe rag.py "your own question here"
.venv/Scripts/python.exe inspect_chroma.py    # verification checklist
.venv/Scripts/python.exe view_data.py         # browse everything stored
```

**Always invoke `.venv/Scripts/python.exe` explicitly, not bare `python`**
- a different, incompatible ChromaDB version installed globally on this
machine will crash trying to open this project's database otherwise.

A local ChromaDB collection (`inventory_documents`) built from live
backend data, embedded with Ollama's `nomic-embed-text`, queried and
answered by a local `llama3.1:8b` via `rag.py` - the full RAG pipeline,
retrieval through to a real generated answer, no cloud LLM. Requires
[Ollama](https://ollama.com) running locally with both models pulled
(`ollama pull nomic-embed-text`, `ollama pull llama3.1:8b`).
Details: `backend/rag/SESSION_16_NOTES.md`, `backend/rag/SESSION_17_NOTES.md`.

**Session 18: `rag.py` is now also reachable over HTTP**, so the Node
backend (and the dashboard's AI search bar) can call it without going
through Python directly:

```bash
.venv/Scripts/python.exe api.py   # RAG service - http://localhost:8001
```

Keep this running alongside `backend`'s `npm start` and `frontend`'s
`npm run dev`. Node's `POST /api/ai/ask` (see below) proxies to this
service's `POST /ask`; if it isn't running, the dashboard's AI search bar
shows a real error instead of hanging. Details: `backend/rag/SESSION_18_NOTES.md`.

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

**Run the backend first** (`cd backend && npm start`), **and the RAG
service** (`cd backend/rag && .venv/Scripts/python.exe api.py`) if you
want the AI search bar to work - the dashboard fetches live data from
`NEXT_PUBLIC_API_URL` (`frontend/.env.local`, `http://localhost:5000` by
default) with real loading/error/empty states. If the backend is down,
each page shows an error with a Retry button rather than hanging or going
blank; if only the RAG service is down, the rest of the dashboard still
works and only the AI search bar shows an error.

## Deployment (Session 19 prep, Session 20 goes live)

Verified ready for Vercel: `npm run build` succeeds clean (no TypeScript
errors), `npm run start` serves every route correctly, `.gitignore` keeps
every real `.env`/`.env.local` out of git while `.env.example` files stay
committed as templates. Not done - **deliberately, not an oversight**:
no `git push`, no Vercel project created, nothing actually deployed. Two
real reasons, not just caution:

1. Pushing code and creating cloud infrastructure are actions on shared
   state outside this machine - that needs you to actually want it done,
   not just "the slides reached that point."
2. Session 19 Slide 19 says this outright: Ollama and ChromaDB only run
   on `localhost` right now. A Vercel deployment could serve the
   dashboard and its charts fine, but `POST /api/ai/ask` would have
   nothing reachable to proxy to - the slide's own words are "this is
   something we should address in Session 20." Deploying the AI feature
   before that's solved would just ship a guaranteed-broken button.

When you're ready to actually deploy: push to GitHub, import the repo in
Vercel, and set `NEXT_PUBLIC_API_URL` (+ the backend's own env vars, on
wherever it ends up hosted - Vercel serverless functions aren't a fit for
a long-running Express app with an in-memory session store) in Vercel's
Project → Settings → Environment Variables, split across Development/
Preview/Production as Slide 19 describes.
