# Full Stack AI Dashboard

Split into backend/frontend as of Session 10, connected live as of Session 13.
As of Session 16, `backend/` also has a `rag/` subfolder (Python + ChromaDB) -
it's still two projects, not three; RAG lives inside the backend, matching
the course architecture where ChromaDB sits alongside MongoDB under the
Node/API layer.

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
npm run import:reset   # load data/inventory.xlsm into MongoDB
npm start               # http://localhost:5000
```

Endpoints: `GET /api/dashboard/metrics`, `GET /api/dashboard/projects`,
`GET /api/dashboard/suppliers`. CORS is enabled for the frontend's origin.
Requires MongoDB running locally (`mongodb://localhost:27017/dashboardDB`).
Details: `backend/SESSION_09_NOTES.md`, `backend/SESSION_13_NOTES.md`,
`backend/SESSION_14_NOTES.md`.

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

## frontend/

```bash
cd frontend
npm install
npm run dev             # http://localhost:3000
```

Routes: `/`, `/dashboard`, `/dashboard/projects`, `/dashboard/metrics`,
`/dashboard/suppliers`. Details: `frontend/SESSION_10_NOTES.md`.

**Run the backend first** (`cd backend && npm start`) - the dashboard fetches
live data from `NEXT_PUBLIC_API_URL` (`frontend/.env.local`,
`http://localhost:5000` by default) with real loading/error/empty states.
If the backend is down, each page shows an error with a Retry button rather
than hanging or going blank.
