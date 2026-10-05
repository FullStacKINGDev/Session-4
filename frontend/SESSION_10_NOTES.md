# Session 10 — Next.js Fundamentals

App Router · Pages · Layouts · Components · Props

## Setup

Scaffolded with the course's recommended options:

```bash
npx create-next-app@latest frontend --ts --tailwind --eslint --app --import-alias "@/*" --use-npm
```

TypeScript ✅ · ESLint ✅ · Tailwind ✅ · App Router ✅ · **no `src/` dir** (moved
`src/app` → `app` and fixed the `@/*` alias in `tsconfig.json` to match the
slide deck's file paths exactly) · import alias `@/*`.

Next.js 16.3.5 / React 19.2.8 (whatever `create-next-app@latest` resolved to
today). `npm run lint` and `npm run build` both pass clean.

## Routes built (Slides 7–11)

```
app/
├── layout.tsx                      root layout (fonts, metadata)
├── page.tsx                        /                    - welcome + link to /dashboard
└── dashboard/
    ├── layout.tsx                  shared Sidebar + Header (Slide 12-13)
    ├── page.tsx                    /dashboard           - 3 KPI cards (Slide 19 challenge)
    ├── projects/page.tsx           /dashboard/projects   - placeholder
    ├── metrics/page.tsx            /dashboard/metrics    - placeholder
    └── suppliers/page.tsx          /dashboard/suppliers  - placeholder
```

**One deviation from the slides:** the deck's example route is `/dashboard/employees`.
Since the employee dataset/API was completely removed (Session 9), that route
is `/dashboard/projects` instead — it maps to our actual `projects` collection.
`metrics` and `suppliers` match the slides directly (and our real
`GET /api/dashboard/metrics` / `GET /api/dashboard/suppliers` endpoints).

## Components (Slides 14–16)

```
components/
├── Sidebar.tsx     nav links via next/link -> Dashboard / Projects / Metrics / Suppliers
├── Header.tsx       static header bar
└── KpiCard.tsx       { title, value } props -> reusable card
```

All three are plain Server Components (no `"use client"`) - nothing here
needs browser interactivity yet (Slide 17's rule). Highlighting the active
sidebar link with `usePathname()` would be a natural next Client Component
exercise.

## Dashboard KPI cards - live values

`/dashboard` renders three `<KpiCard>`s with the numbers verified against the
backend in Session 9 (`backend/SESSION_09_NOTES.md`):

| Card | Value |
| --- | --- |
| Total Stock | 16.31 |
| Projects | 14 |
| Average Stock | 1.16 |

These are hard-coded props for now - **not yet fetched from the API.** That's
next: `/dashboard` would `fetch("http://localhost:5000/api/dashboard/metrics")`
in a Server Component (no CORS needed - it's a server-to-server call), while
the placeholder `projects`/`metrics`/`suppliers` pages would fetch their own
data. Worth knowing ahead of time: Express has no CORS middleware yet, so a
*client-side* `fetch`/`useEffect` call from the browser to `localhost:5000`
would currently be blocked - server-side fetches inside Server Components
sidestep that, or add `cors` to the backend if client-side fetching is wanted.

## Verified (original shell)

```bash
npm run lint     # clean
npm run build    # 5/5 routes compiled + prerendered as static content
npm run dev       # all 5 routes return 200; KPI values confirmed present in rendered HTML
```

---

## Update (2026-09-23) — restyled from a Google Stitch design

Generated a design in [Google Stitch](https://stitch.withgoogle.com) from the
prompts drafted for this project, exported to
`stitch_inventory_aging_analytics_dashboard/` (one `code.html` + `screen.png`
per screen, plus `inventory_command/DESIGN.md` — the design-token brief).
That export was used as the visual reference to rebuild all four
`/dashboard` pages as real React/Tailwind components.

**Kept from the Stitch design:** the full visual language — palette
(neutral gray canvas/cards, indigo primary accent, emerald→amber→orange→red
semantic aging-risk scale), Inter font with tabular figures, card/badge/
progress-bar/donut-chart patterns, Material Symbols icons, the sidebar +
sticky per-page header layout.

**Deliberately NOT kept — fabricated content:** Stitch invented plausible
but fake numbers for every row beyond the couple of anchor values in each
prompt (e.g. its Projects table showed "Project A $1.15M" - the real value
is 0.50; its Suppliers table mislabeled which `Sup-N` had which value). It
also invented flavor text with zero basis in our schema: "Project Magellan",
"Industrial Turbine Assemblies", "Bay-04 East Hub", supplier company names,
"Tier 1/2" contract tiers, a Herfindahl index, "$94.2k daily burn rate",
etc. None of that exists in `models/Project.js` / `models/Supplier.js`, so
none of it made it into the real build — matching this whole project's
running theme (Session 06/09): never fabricate data, verify against source.

**What's real instead:**
- `lib/data.ts` holds the *exact* Project/Supplier rows straight from
  `backend/data/inventory.xlsm` (re-extracted via script, not retyped by
  hand) plus every total/average/ranking computed from those rows in code -
  nothing is a hardcoded result.
- Numbers are shown unitless (`16.32`, not `$16.32M`) - the workbook's
  "Stock Value" column never had a currency/units label, and Session 09's
  own slide 17 mock-up shows the same numbers unitless.
- Fixed a rounding bug from the original static props: total stock rounds
  to **16.32** and average to **1.17** (was 16.31 / 1.16, truncated by hand
  instead of rounded).
- Fictional narrative blocks (audit status, storage bay, supplier tiers,
  logistics KPIs) were dropped rather than replaced with different fake
  content. Where a Stitch block *was* honestly derivable (e.g. "8.4% of
  stock isn't in any aging bucket," "suppliers hold ~4.3x what projects
  have on hand"), it was kept because it's actually true of the data.
- Projects/Suppliers tables gained **real interactivity** (search + sortable
  columns) as Client Components (`ProjectsTable.tsx`, `SuppliersTable.tsx`,
  both `"use client"`) - a legitimate, in-scope use of this session's
  Client Component lesson, verified with Playwright (typed "D" into the
  search box -> table filtered to Project D only; clicked the "&lt;90 Days"
  column header -> re-sorted with Project M first).
- `Sidebar.tsx` is now genuinely a Client Component (`usePathname()` to
  highlight the active nav link) instead of the placeholder note that it
  "could" be one.

**New/changed files:**

```
lib/data.ts              real PROJECTS/SUPPLIERS rows + computed stats
lib/aging.ts              shared aging-bucket colors/labels/status
components/Icon.tsx        Material Symbols wrapper
components/DonutChart.tsx  SVG ring chart (plain <circle> stroke-dasharray, no chart lib)
components/AgingBar.tsx    labeled/colored bucket progress bar
components/ProjectsTable.tsx   client: search + sort, highlights the max row
components/SuppliersTable.tsx  client: search + sort, ranked list + relative bars
components/Sidebar.tsx     rebuilt, now "use client" (usePathname active state)
components/Header.tsx      rebuilt: per-page title/subtitle + decorative toolbar
components/KpiCard.tsx     rebuilt to the Stitch card style (icon + footnote)
app/globals.css            Inter + Material Symbols base styles, light-mode-only
app/layout.tsx              Inter (was Geist) + Material Symbols <link>
app/dashboard/*/page.tsx    all four rebuilt on real data
```

Still not fetching from the live API (`GET /api/dashboard/metrics` /
`/suppliers`) - that's still the next step; see the CORS note above.

**Verified:** `npm run lint` and `npm run build` clean; all 4 routes
screenshotted with Playwright at 1600px (no console errors); search/sort
interactivity exercised and confirmed working, not just decorative.

---

## Update (2026-09-23, same day) — every control now does something real

Audited every button-like element in the app (grepped for `<button`,
`href="#"`, `cursor-pointer`) and made each one either genuinely work, or
say so:

| Control | Where | Behavior |
| --- | --- | --- |
| Sidebar nav links | `Sidebar.tsx` | already real navigation |
| "View all projects" link | dashboard page | already real navigation |
| Table search boxes | `ProjectsTable`, `SuppliersTable` | already real (client-side filter) |
| Table column-header sort | `ProjectsTable`, `SuppliersTable` | already real (client-side sort) |
| **Export** | `Header.tsx`, all 4 pages | **real** - downloads a CSV (`lib/csv.ts`) of that page's actual data (dashboard summary / all 14 projects / aging buckets / all 14 suppliers) |
| **Search / Filter (⌘K)** | `Header.tsx` | **real** - opens `CommandPalette.tsx`, a real ⌘K/Ctrl+K command palette that searches all 14 projects + 14 suppliers by name and navigates to `/dashboard/projects?q=<id>` or `/dashboard/suppliers?q=<id>`, which pre-fills that page's own search box |
| Date range ("Last 30 Days") | `Header.tsx` | **"coming soon" toast** - there's no time-series/date field on any row in the workbook, so a real date-range filter isn't honestly buildable yet without inventing data |
| Refresh | `Header.tsx` | **"coming soon" toast** - nothing to refresh from until the frontend is wired to the live backend API (still pending, see above) |
| Avatar circles (header + sidebar) | `Header.tsx`, `Sidebar.tsx` | left as plain (no hover/cursor styling) - never presented as clickable, so left alone rather than bolted onto a fake account menu |

New files: `lib/csv.ts` (generic array-of-objects -> CSV download),
`lib/commandPalette.ts` (tiny `window.dispatchEvent` bus so the per-page
Header can open the palette that lives once in `app/dashboard/layout.tsx`,
without prop-drilling or a Context provider), `components/CommandPalette.tsx`.

`Header.tsx` is now `"use client"` (it needs `onClick` handlers and toast
state). `ProjectsTable`/`SuppliersTable` read `?q=` via `useSearchParams()`
to support the palette hand-off, which is why both pages now wrap their
table in `<Suspense>` (Next.js requirement for `useSearchParams()`).

Hit a React Compiler lint rule (`react-hooks/set-state-in-effect`) on the
`?q=` sync and the palette's open/reset logic - fixed by adjusting state
during render (guarded by a "previous value" comparison) instead of in a
`useEffect`, which is React's own documented pattern for "reset state when
something changes." Comments in the code point at the React docs page.

**Verified live** with Playwright, end to end, not just build-checked:
Export downloads a real, correctly-populated CSV on all 4 pages (content
inspected); Refresh and Date range show their toast and auto-dismiss;
clicking "Search / Filter" *and* pressing Ctrl+K both open the palette from
any page; typing "Sup" lists all matching suppliers with correct stock
values; clicking a result navigates and the destination table arrives
pre-filtered with the search box already populated; Escape closes the
palette. Zero console errors throughout.
