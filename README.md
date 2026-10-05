# Full Stack AI Dashboard

Two separate projects, split as of Session 10, connected as of Session 13:

```
Session 4/
├── backend/     Node.js + Express + Mongoose API (Sessions 5-9, 13)
└── frontend/    Next.js App Router dashboard UI (Session 10+, live since 13)
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
Details: `backend/SESSION_09_NOTES.md`, `backend/SESSION_13_NOTES.md`.

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
