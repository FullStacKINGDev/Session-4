// Shared stock-aging bucket config (colors/labels) used by the dashboard
// KPI bars, the metrics donut chart, and the projects/suppliers tables.
// Semantic color scale: fresher stock = calmer (emerald), older = riskier
// (amber -> orange -> red).
export type AgingKey = "under90" | "over90" | "over180" | "over365";

export const AGING_BUCKETS: Array<{
  key: AgingKey;
  label: string;
  status: string;
  dot: string;
  bar: string;
  chipBg: string;
  chipText: string;
  hex: string;
}> = [
  {
    key: "under90",
    label: "< 90 Days",
    status: "Fresh",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    hex: "#10b981"
  },
  {
    key: "over90",
    label: "> 90 Days",
    status: "Monitor",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    hex: "#f59e0b"
  },
  {
    key: "over180",
    label: "> 180 Days",
    status: "Aging Risk",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    chipBg: "bg-orange-50",
    chipText: "text-orange-700",
    hex: "#f97316"
  },
  {
    key: "over365",
    label: "> 365 Days",
    status: "Critical",
    dot: "bg-red-500",
    bar: "bg-red-500",
    chipBg: "bg-red-50",
    chipText: "text-red-700",
    hex: "#ef4444"
  }
];
