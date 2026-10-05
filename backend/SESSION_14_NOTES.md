# Session 14 — Charts & Data Visualization

KPI cards → Charts → Tables, all driven by the same live API data

This session is entirely frontend — no backend code changed. It reuses the
endpoints built in Session 13 rather than adding new ones (see the decision
below).

## What got built

| File | What |
| --- | --- |
| `frontend/components/BarChart.tsx` (new) | Reusable horizontal bar chart — plain SVG/CSS, no charting library (same approach as `DonutChart.tsx`) |
| `frontend/app/dashboard/page.tsx` | Now also fetches `getProjects()`; new **"Stock by Project"** chart, all 14 projects compared |
| `frontend/app/dashboard/suppliers/page.tsx` | New **"Stock by Supplier"** chart, all 14 suppliers compared |
| `frontend/components/Header.tsx` | New `lastUpdated` prop — a small "Updated HH:MM:SS" label (Slide 19's stretch goal), shown on all 4 pages |

## Two deliberate deviations from the slide deck

**No dedicated `/api/projects/stock` endpoint (Slide 7).** The slide's
example teaches a chart-only, minimal-shape endpoint. We already have
`GET /api/dashboard/projects` from Session 13, and Slide 11 of *this same
session* teaches something better: "one API response can drive multiple
views." So `BarChart` reads from the exact same `getProjects()` call the
Projects table already uses — one fetch, two views (chart + table), instead
of a second endpoint that would just be a subset of the first. Same for
suppliers.

**No line chart.** Slide 9 teaches line charts for trends over time
("Monthly stock value," "Revenue over time"). Our workbook has no date/time
dimension on any row — Project and Supplier documents are point-in-time
stock levels, not a time series. Slide 4 of this very session says the
quiet part out loud: *"Don't add a chart because it looks nice. Add it
because it answers a question."* Inventing monthly numbers to justify a
line chart would violate that rule and the project's running "never
fabricate data" theme (Sessions 06, 09, 10). Our data is comparison-shaped
(14 projects, 14 suppliers, right now) — bar charts are the honest answer.
This is a good thing to say out loud in class: **the visual follows the
data's actual shape, not the slide deck's example.**

## How Slide 15 ("loading/error/empty for charts") got satisfied for free

`ApiState` (built in Session 13) already wraps each page's entire content —
KPI cards, chart, and table together. Because the new bar charts live
inside that same boundary, they automatically get the loading spinner,
error + Retry, and empty state with zero new code. Worth calling out live:
this is the payoff of building `ApiState` as a reusable component instead
of copy-pasting the loading/error `if` blocks per page.

## Interaction, not just decoration

Each bar links to `${linkBase}?q=${id}` — reusing the `?q=` pre-filter
convention the Command Palette already established. Clicking "N" in the
Dashboard's project chart navigates to `/dashboard/projects?q=N` and the
table arrives already filtered to that one row. Verified live with
Playwright.

## Verified live

- Dashboard and Suppliers pages screenshotted with the backend running;
  bars render with a 700ms grow-in animation (replays on Refresh, since the
  fetched array reference changes), gradient fill, max-value bar
  highlighted, hover state, tabular-nums value labels.
- Clicking a bar navigates and pre-filters the destination table (checked:
  clicked "N" on the Dashboard chart → landed on `/dashboard/projects?q=N`
  → search box read `"N"` → table showed only Project N).
- `npm run lint` / `npm run build` clean.
- Noticed live: the underlying MongoDB data has changed since Session 13
  (total stock now ~24.54 vs. the previously-verified 16.32, project N
  jumped from ~0.01 to ~6.24). Not a bug — it's the live-fetch architecture
  doing exactly what it's supposed to: every number on every page (KPIs,
  chart, aging %, ratios) recalculated consistently from whatever is
  actually in MongoDB right now, with no stale cache anywhere.

## A repeat of the same lint gotcha, worth reinforcing

`BarChart`'s grow-in animation reset (`setAnimated(false)`, run whenever the
`items` array changes) originally lived inside a `useEffect` and hit
`react-hooks/set-state-in-effect` — but this time the rule was *right*: a
synchronous `setState` at the top of an effect body is exactly the
antipattern it's meant to catch. Fixed the same way as `ProjectsTable`'s
`?q=` sync in Session 10: compare against a `prevItems` value and adjust
state during render, not in the effect. Good side-by-side teaching moment
with Session 13's *false positive* on the same rule — one case genuinely
needed the fix, the other didn't, and the difference is whether the
`setState` call is reachable synchronously from the effect body or only
after an `await`/callback.

---

## Follow-up (same day) — "add pie charts and all"

Added `frontend/components/DistributionDonut.tsx`: a donut + legend built
on top of the existing `DonutChart` primitive, answering a genuinely
different question than the bar charts do. `BarChart` answers "which is
bigger?" (magnitude); `DistributionDonut` answers "how concentrated is
this?" (share of whole) — groups everything past the top 5 into a single
"Other" slice so 14 categories don't collapse into unreadable slivers, and
every slice is labeled in the legend (never an unlabeled pie).

Used twice:
- **Dashboard page** — "Project Distribution" card, below the existing
  Aging/Top Project row.
- **Suppliers page** — "Supplier Distribution", paired side-by-side with
  the existing "Stock by Supplier" bar chart in a 2-column grid.

**Color discipline**: a new *sequential* indigo palette (dark → light,
`RANK_COLORS` in the component) for ranked/unordered categories like
"which project," kept deliberately separate from the *semantic* aging
colors in `lib/aging.ts` (emerald/amber/orange/red mean something specific
— fresher vs. more at-risk — and must never be reused for an unrelated
chart just because a color is needed).

**A real insight the donut surfaces that the bar chart doesn't as clearly**:
project stock is highly concentrated (top 3 projects M/D/N hold ~87% of all
stock; the other 11 combined hold ~13%), while supplier stock is much more
evenly spread (top 5 suppliers hold only ~41%, "Other" is 9 suppliers at
~58%). Good discussion prompt for class: same visualization technique, two
very different concentration stories, both true, both live from MongoDB.

Legend rows are clickable (`?q=<id>`, same convention as `BarChart` and the
Command Palette) — verified live: clicking "Project D" in the donut legend
navigated to `/dashboard/projects?q=D` and the table arrived pre-filtered
to that one row.

`npm run lint` / `npm run build` clean.

---

## Follow-up (same day) — "can you improve more?" → the sidebar was broken below ~1024px

Asked to keep improving, so audited the app at phone width before guessing
at more visual polish. Found a real bug, not a style nit: `Sidebar` was
`fixed w-60` unconditionally, and the content column had `pl-60`
unconditionally - below `lg` (1024px) that's a permanent 240px sidebar
eating most of a 390px phone screen, with the page horizontally scrolling
to compensate. Confirmed with a script check
(`document.body.scrollWidth > viewport width` → true).

Fixed properly rather than just shrinking text: below `lg`, `Sidebar` is
now an off-canvas drawer (`-translate-x-full` by default, backdrop +
close button when open, closes automatically on route change), and
`Header` gained a hamburger button (`lg:hidden`) that opens it. `lg:` and
up, both revert to exactly the previous fixed-sidebar behavior
(`lg:translate-x-0`, hamburger hidden) - desktop users see zero change.

Coordinating `Header` (which needs to *open* the drawer) with `Sidebar`
(which *owns* the drawer's state, and lives in the layout, a different
part of the tree) reused the same tiny `window.dispatchEvent` bus pattern
already established for the Command Palette (`lib/commandPalette.ts`) -
new `lib/sidebarDrawer.ts`, same shape. Consistent, no new state-management
concept introduced.

Hit the *legitimate* version of the `set-state-in-effect` lint rule again
(closing the drawer on pathname change was a synchronous `setState` at the
top of an effect) - fixed with the same render-time-adjustment pattern
used everywhere else in this codebase for that exact antipattern.

**Verified live**, not just by eye: `document.body.scrollWidth` at 390px
viewport now equals the viewport width (no overflow); opening the drawer,
tapping "Suppliers," confirmed it both navigated *and* closed itself
(screenshot showed the hamburger button back, not the open panel); 820px
tablet width still shows the 3-column KPI grid and a working hamburger;
1440px desktop confirmed the hamburger stays hidden and nothing changed
from before. `npm run lint` / `npm run build` clean.
