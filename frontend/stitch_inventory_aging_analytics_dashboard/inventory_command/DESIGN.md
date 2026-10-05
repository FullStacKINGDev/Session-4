---
name: Inventory Command
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#464555'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  display-kpi-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.075em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an analytical, high-precision environment engineered specifically for operations leaders, warehouse supervisors, and inventory financial analysts. The experience conveys absolute operational clarity, reliability, and calm authority under high data density.

Drawing from modern corporate minimalism with refined tactile nuances, the system strips away ornamental distraction in favor of structured data presentation. Visual energy is strictly rationed: functional accents and semantic aging hues direct focus toward actionable anomalies, dead stock risks, and capital turnover velocity. Generous whitespace, razor-sharp alignment, and elevated neutral surfaces transform complex telemetry into effortless decision-making.

## Colors

The palette balances clinical precision with intuitive, at-a-glance operational status signaling.

### Core Canvas & Surfaces
- **App Canvas:** `#F9FAFB` provides a crisp, cool neutral foundation that reduces eye strain across long working sessions.
- **Card Surfaces:** `#FFFFFF` offers high-contrast separation against the canvas.
- **Structural Borders:** `#E5E7EB` delivers crisp separation without visual clutter.
- **Surface Hover / Subtle Wells:** `#F3F4F6` for table row hovers, secondary button backdrops, and active search input fields.

### Typography & Content Tone
- **Primary Text:** `#111827` (Slate 900) ensures maximum legibility for metrics, table rows, and active labels.
- **Secondary / Supporting Text:** `#6B7280` (Slate 500) sets an unobtrusive tone for table column headers, unit measures, and metadata.
- **Tertiary / Disabled:** `#9CA3AF` (Slate 400) for deactivated controls and placeholder text.

### Interactive Accents
- **Primary Accent:** `#4F46E5` (Indigo 600) drives focused interaction: primary actions, primary metrics highlights, active navigation tabs, and system focus rings (`#4F46E5` with 20% opacity).
- **Secondary Accent:** `#3B82F6` (Blue 500) supports secondary data visualizations, interactive links, and batch actions.

### Stock Aging & Operational Semantics
Inventory lifecycle status relies on an unambiguous, progressive color continuum:
- **Fresh Stock (<90 Days):** `#10B981` (Emerald 500) paired with `#ECFDF5` background. Denotes optimal rotation and healthy inventory throughput.
- **Slow Moving (>90 Days):** `#F59E0B` (Amber 500) paired with `#FFFBEB` background. Flags early turnover deceleration.
- **At-Risk Stock (>180 Days):** `#F97316` (Orange 500) paired with `#FFF7ED` background. Triggers proactive promotional discounting or rebalance workflows.
- **Critical / Aged Risk Stock (>365 Days):** `#EF4444` (Rose 500) paired with `#FEF2F2` background. Highlights write-down exposure and immediate obsolescence risk.

## Typography

The typographic hierarchy prioritizes tabular legibility, rapid scannability, and high numeral recognition. **Inter** serves as the unified typeface across all roles to ensure flawless kerning and native tabular figure support.

### Typographic Roles & Usage
- **KPI Metrics (`display-kpi`):** Designed for hero inventory indicators (e.g., Total Valuation, Inventory Turn Rate, Dead Stock Exposure). Always rendered with OpenType `tnum` (tabular figures) enabled so numbers do not jump during real-time data syncs.
- **Section & Modal Titles (`headline-*`):** Tight letter tracking and semi-bold weights maintain crispness without consuming excessive vertical screen real estate.
- **Table & Content Body (`body-*`):** Standard data rows default to `body-md` (14px). Secondary operational notes and inline help use `body-sm` (12px).
- **Metric Overlines & Column Headers (`label-caps`):** Text transform uppercase paired with expanded tracking (`0.075em`) in muted `#6B7280` creates unambiguous visual framing above prominent display metrics.

## Layout & Spacing

The layout is built upon an 8px base rhythm (`0.5rem` steps), with a 4px sub-grid for fine-grained alignment of icons, badges, and table cell padding.

### Grid Architecture
- **Desktop (1280px and above):** 12-column fluid grid with `margin: 2rem` (32px) and `gutter: 1.5rem` (24px). Primary dashboard analytics span 3 columns per top-level KPI card (4 across), 8 columns for core throughput charts, and 4 columns for stock-aging distribution lists.
- **Tablet (768px - 1279px):** 8-column layout with `gutter: 1rem` (16px) and `margin: 1.5rem` (24px). Metric cards flow in a 2x2 grid. Data tables enforce horizontal scrolling with sticky primary SKU columns.
- **Mobile (< 768px):** 4-column layout with `gutter-sm: 1rem` and `margin-sm: 1rem`. Cards stack vertically into single-column modules.

### Component Internal Density
All cards maintain `space-lg` (1.5rem / 24px) internal padding (`p-6`) to prevent dense metrics from feeling claustrophobic. Compact interface zones (slide-over inventory sheets, filter toolbars) drop to `space-md` (1rem / 16px).

## Elevation & Depth

Depth is established via subtle, low-contrast ambient shadows layered on clean 1px structural outlines. Pure flat surfaces risk blending into the light canvas, while heavy shadows undermine analytical rigor.

### Elevation Hierarchy
- **Level 0 (Canvas Base):** Flat `#F9FAFB` without shadow. Houses page backgrounds and inactive segmented tabs.
- **Level 1 (Card Resting State):** Solid `#FFFFFF` enclosed by a 1px border of `#E5E7EB` supported by a soft ambient shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)`.
- **Level 2 (Hover & Active Cards):** Lifted interactive cards (e.g., selectable SKU batches or interactive alerts) transition subtly to: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.04)`.
- **Level 3 (Dropdowns & Action Popovers):** Elevated overlays receive: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)` with a 1px `#E5E7EB` border.
- **Level 4 (Slide-over Drawers & Modals):** High-priority detail sheets feature a prominent scrim (`rgba(17, 24, 39, 0.4)`) and `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`.

## Shapes

The design system adopts a calibrated `rounded-2` shape profile. It delivers a modern, approachable balance that avoids overly stark right angles without sliding into childish, overly circular forms.

### Corner Radius Mapping
- **Cards & Data Panels (`rounded-xl` / 12px):** Primary content boundaries use 12px radius, framing data tables and charting spaces softly.
- **Inputs, Buttons, & Dropdowns (`rounded-md` / 6px - 8px):** Interactive form controls use crisp, ergonomic bounds for precise targeting.
- **Status Badges, Filter Chips, & Avatars (`rounded-full` / 9999px):** Status badges (<90d, >365d) and count pills utilize fully rounded pill silhouettes to instantly distinguish categorical indicators from actionable buttons.

## Components

### Buttons
- **Primary:** Background `#4F46E5`, text `#FFFFFF`, 8px roundedness (`rounded-lg`), height 38px, horizontal padding 16px (`px-4`). Hover: `#4338CA`. Active focus: 2px ring offset with `#4F46E5`.
- **Secondary / Outline:** Background `#FFFFFF`, 1px border `#E5E7EB`, text `#111827`. Hover: `#F9FAFB` surface, border `#D1D5DB`.
- **Destructive (Scrap / Write-off Stock):** Background `#FEF2F2`, border 1px solid `#FCA5A5`, text `#EF4444`. Hover: `#EF4444` background with `#FFFFFF` text.

### KPI Metric Cards
Structured with `padding: 1.5rem` (24px), 1px border `#E5E7EB`, and `rounded-xl` radius.
1. **Top Row:** Upper-case category overline (`label-caps`) in `#6B7280` alongside an optional trend badge (e.g., `+12.4% MoM` in Emerald).
2. **Center Metric:** `display-kpi` bold typographic treatment in `#111827`.
3. **Bottom Row:** Supporting footnote in `body-sm` (`#6B7280`) establishing context (e.g., *"1,420 items approaching >90d threshold"*).

### Status Chips & Stock Aging Badges
Compact inline chips: height 22px, `px-2.5`, `rounded-full`, font `label-sm` (`font-weight: 500`).
- **Fresh (<90d):** Background `#ECFDF5`, text `#065F46`, dot indicator `#10B981`.
- **Aging (>90d):** Background `#FFFBEB`, text `#92400E`, dot indicator `#F59E0B`.
- **At Risk (>180d):** Background `#FFF7ED`, text `#9A3412`, dot indicator `#F97316`.
- **Aged / Critical (>365d):** Background `#FEF2F2`, text `#991B1B`, dot indicator `#EF4444`.

### Tables & Data Grids
- **Header:** Background `#F9FAFB`, border-bottom 1px solid `#E5E7EB`, text `label-caps` in `#6B7280`, vertical padding `10px`, horizontal cell padding `16px`.
- **Rows:** Background `#FFFFFF`, border-bottom 1px solid `#F3F4F6`, height 52px, text `body-md` in `#111827`. Hover state transitions row background to `#F9FAFB`.
- **Numeric Alignment:** Quantities, Unit Costs, and Days-in-Stock align strictly right with monospace tabular figures (`font-variant-numeric: tabular-nums`).

### Input Fields & Search Bars
- Standard height 38px, `px-3`, background `#FFFFFF`, border 1px solid `#E5E7EB`, `rounded-lg`.
- **Focus State:** Border color shifts to `#4F46E5`, backed by a 3px ring of `rgba(79, 70, 229, 0.15)`.
- SKU search bars embed an icon prefix (`16px` search icon in `#9CA3AF`) and a trailing shortcut key pill (`⌘K` in `#E5E7EB`).

### Checkboxes & Selection Controls
- Checkbox: 16px square with 4px corner radius (`rounded`), border 1px solid `#D1D5DB`. Checked state: background `#4F46E5`, white checkmark glyph. Indeterminate states utilize a centered horizontal minus bar.