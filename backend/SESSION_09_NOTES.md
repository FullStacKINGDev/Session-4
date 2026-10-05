# Session 09 — Aggregation for Dashboard Metrics

Data → Group → Calculate → KPI

## New source data

`data/inventory.xlsm` ("Inventory Dashboard with Export to PDF.xlsm") — **this is now our
only / main workbook.** The Session 05–08 employee API (model, controller, routes,
importer, Session 3 practice workbook) was removed on 2026-09-20 at the user's request;
everything below is what's left. Two clean sheets, proper header row, no dirty-data
problems this time:

- `Project Data` — 14 rows, Project A–N
- `Supplier Data` — 14 rows, Sup-1–Sup-14

Both have the same shape: `SL NO`, `<Project|Supplier> Name`, `Stock Value`,
`<90 Days`, `>90 Days`, `>180 Days`, `>365 Days`.

## Files

| File | Purpose |
| --- | --- |
| `models/Project.js` | `projects` collection (`projectName`, `stockValue`, `under90/over90/over180/over365`) |
| `models/Supplier.js` | `suppliers` collection, same shape, `supplierName` |
| `importInventory.js` | PARSE → TRANSFORM → LOAD (upsert by name, no dirty data to validate here) |
| `verifyInventory.js` | Reproduces slide 19's checklist — compares MongoDB aggregation output to the workbook |
| `controllers/dashboardController.js` | `getMetrics`, `getSupplierMetrics` — the actual `$match`/`$group`/`$sort`/`$project` pipelines |
| `routes/dashboardRoutes.js` | Mounted at `/api/dashboard` |

```bash
npm run import:reset   # empty projects+suppliers, then load the workbook
npm run import         # re-load / upsert on top of existing data
npm run verify          # compare aggregation results to the workbook (slide 19)
npm start               # then hit the endpoints below
```

## Endpoints

```
GET /api/dashboard/metrics
GET /api/dashboard/suppliers
```

### `GET /api/dashboard/metrics` — live result

```json
{
  "success": true,
  "data": {
    "totalStockValue": 16.3158,
    "averageStockValue": 1.1654,
    "projectCount": 14,
    "aging": { "under90": 10.7769, "over90": 1.8472, "over180": 1.0832, "over365": 1.2363 },
    "topProject": { "projectName": "M", "stockValue": 6.894366801 }
  }
}
```

Matches slide 17's shape exactly, plus `topProject` (Slide 10's `$max`, resolved back to
its document with a follow-up `findOne`) since the Slide 18 practical explicitly asks for
the largest project.

Pipeline (`Project.aggregate`):
1. `$match: { stockValue: { $gt: 0 } }` — Slide 11/13
2. `$group: { _id: null, totalStockValue: $sum, averageStockValue: $avg, projectCount: $sum:1, maxStockValue: $max, minStockValue: $min, under90/over90/over180/over365: $sum }` — one pipeline, every KPI (Slide 13)

### `GET /api/dashboard/suppliers` — live result

```json
{
  "success": true,
  "data": {
    "suppliers": [
      { "stockValue": 6.04, "supplierName": "Sup-8" },
      { "stockValue": 5.95, "supplierName": "Sup-6" },
      "... 12 more, sorted highest to lowest ...",
      { "stockValue": 3.79, "supplierName": "Sup-4" }
    ],
    "totalSupplierStock": 70.74,
    "supplierCount": 14
  }
}
```

Pipeline (`Supplier.aggregate`): `$group` by `supplierName` (Slide 8/14) → `$sort: { stockValue: -1 }`
(Slide 14) → `$project` to reshape `{ _id: "$supplierName" }` into `{ supplierName, stockValue }`
(Slide 12).

## Verified against the workbook (Slide 19 checklist)

| Metric | MongoDB | Workbook | |
| --- | --- | --- | --- |
| Project count | 14 | 14 | ✅ |
| Total stock value | 16.315843 | 16.315843 | ✅ |
| Average stock value | 1.165417 | 1.165417 | ✅ |
| `<90 Days` total | 10.776856 | 10.776856 | ✅ |
| `>90 Days` total | 1.847220 | 1.847220 | ✅ |
| `>180 Days` total | 1.083161 | 1.083161 | ✅ |
| `>365 Days` total | 1.236311 | 1.236311 | ✅ |
| Supplier stock total | 70.74 | 70.74 | ✅ |
| Highest-value project | M (6.894366801) | — | matches "which project has the highest stock?" |
| Lowest-value project | I (1e-9, effectively empty) | — | |
| Unexpected nulls | none | | |
| Numeric fields typed as Number | yes | | |

`npm run verify` reproduces this table any time the data changes.
