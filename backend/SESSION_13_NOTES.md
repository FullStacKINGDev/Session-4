# Session 13 — Connecting the Frontend to the API

API → DATA → UI, with real loading/error/empty states

## Backend changes

- **CORS** (`npm install cors`, `server.js`): `app.use(cors())` before any
  routes - the Next.js dev server (`localhost:3000`) and this API
  (`localhost:5000`) are different origins, and the browser blocks
  cross-origin `fetch()` without it. Open to all origins for local dev
  (Slide 15's note: restrict this in production).
- **New endpoint** `GET /api/dashboard/projects` (`getProjects` in
  `controllers/dashboardController.js`) — every individual project row
  (`projectName`, `stockValue`, `under90/over90/over180/over365`), sorted
  highest-first, plus `totalStockValue`/`projectCount`. This didn't exist
  before; the frontend's Projects table was reading a static copy of the
  workbook. Now it's real, per-document data straight from MongoDB (Slide
  14: "one API document -> one table row").
- `GET /api/dashboard/metrics` now also returns **`bottomProject`** - the
  aggregation already computed `minStockValue` via `$min` but never
  resolved it to an actual document. Added a `Project.findOne()` for it,
  mirroring how `topProject` already worked.

## Frontend changes

- **`.env.local`**: `NEXT_PUBLIC_API_URL=http://localhost:5000` (already
  gitignored via `.env*` in `frontend/.gitignore`).
- **`lib/api.ts`** (new): the one place that calls `fetch()`. `request<T>()`
  checks `response.ok` (Slide 11 - fetch() doesn't throw on 404/500 by
  itself), then the API's `{ success, message }` envelope, then returns
  `data`. Three typed functions: `getDashboardMetrics()`, `getProjects()`,
  `getSuppliers()` - the latter two adapt the API's `projectName`/
  `supplierName` fields into the frontend's existing `{ id, ... }`
  `StockRow` shape so `ProjectsTable`/`SuppliersTable`/`CommandPalette`
  didn't need to change their internals.
- **`lib/data.ts`**: the hardcoded `PROJECTS`/`SUPPLIERS` arrays (and every
  static stat derived from them) were removed - they were a second,
  driftable copy of the truth now that real data is one `fetch()` away.
  Only the pure display helpers (`formatValue`, `formatPct`, `pctOfTotal`,
  the `StockRow` type) remain.
- **`components/ApiState.tsx`** (new): the Slide 19 stretch goal - one
  reusable `{ loading, error, isEmpty } -> UI` component used by all four
  `/dashboard/*` pages. Loading = spinner, Error = message + Retry button,
  Empty = distinct "no data" message (Slide 13's point: empty is not an
  error).
- **All four `/dashboard/*` pages** are now Client Components
  (`"use client"`) following the session's exact pattern: `useState` for
  `data`/`loading`/`error`, a `useCallback`-wrapped `load()` that does
  `try { setLoading(true); setError(null); setData(await getX()); } catch
  { setError(...) } finally { setLoading(false) }`, triggered once by
  `useEffect(() => { load(); }, [load])`.
- **`Header`'s Refresh button is now real** (was "coming soon" in the
  previous pass) — each page passes its own `load` function in as
  `onRefresh`, so Refresh actually re-fetches that page's live data (with a
  spin animation + "Data refreshed" toast). Date range stays "coming soon"
  - still no time-series field in the data to filter by.
- **`CommandPalette`** now builds its search index from `getProjects()` +
  `getSuppliers()` on mount instead of the removed static arrays.

## A lint wrinkle worth knowing about

React Compiler's `react-hooks/set-state-in-effect` rule flagged
`useEffect(() => { load(); }, [load])` in all four pages - the exact
pattern this session's own slides teach (Slide 8). This is a different
case from the "adjust state when a prop changes" antipattern the rule is
designed to catch (which `ProjectsTable`/`SuppliersTable`/`CommandPalette`
legitimately hit in the Session 10 update, fixed there by adjusting state
during render instead of in an effect) - `load()`'s `setState` calls happen
after an `await`, not synchronously in the effect body, and "fetching data"
is React's own documented use case for a `useEffect`
(https://react.dev/learn/synchronizing-with-effects#fetching-data).
Suppressed with `// eslint-disable-next-line react-hooks/set-state-in-effect`
and a comment explaining the distinction, rather than distorting a correct
pattern to satisfy an overly-conservative experimental rule.

## Verified live (Playwright, not just build-checked)

- All 4 pages load real numbers from the live API: Dashboard KPIs
  `16.32 / 14 / 1.17`, top project `Project M (6.89)`; Projects table = 14
  real rows; Suppliers table = 14 real rows; Metrics ratio badge = `4.34`.
- Refresh button fires a real `GET /api/dashboard/metrics` network request
  and shows "Data refreshed".
- **Stopped the backend** (Slide 18's testing tip) - all four pages
  correctly showed the error state ("Could not reach the API at
  http://localhost:5000. Is the backend running?") with a working Retry
  button, instead of hanging or going blank. Restarted the backend and
  confirmed a fresh load succeeds again.
- `npm run lint` and `npm run build` clean on the frontend; backend files
  syntax-checked and all three endpoints (`/metrics`, `/projects`,
  `/suppliers`) manually verified with `curl`, including the
  `Access-Control-Allow-Origin` header from `cors()`.
