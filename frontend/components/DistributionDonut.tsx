import Link from "next/link";
import DonutChart from "@/components/DonutChart";
import { formatPct, formatValue, pctOfTotal } from "@/lib/data";

type Item = { id: string; label: string; value: number };

// Sequential palette (dark -> light) for ranked, unordered categories like
// "which project/supplier" - distinct from the fixed semantic colors in
// lib/aging.ts (emerald/amber/orange/red), which mean something specific
// (fresher vs. more at-risk) and must never be reused for an unrelated chart.
const RANK_COLORS = ["#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"];
const OTHER_COLOR = "#cbd5e1"; // slate-300 - neutral, not "bad"

// A donut + legend for "how concentrated is this across categories?" -
// a different question from BarChart's "which is bigger?" (Session 14
// Slide 3/4: different questions need different visuals). Groups everything
// past `topN` into a single "Other" slice so 14 categories don't collapse
// into unreadable slivers - every slice stays big enough to read and label.
export default function DistributionDonut({
  items,
  topN = 5,
  linkBase,
  unitLabel = "items"
}: {
  items: Item[];
  topN?: number;
  linkBase?: string;
  unitLabel?: string;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const restTotal = rest.reduce((sum, item) => sum + item.value, 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  const legend = top.map((item, i) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    color: RANK_COLORS[i] ?? RANK_COLORS[RANK_COLORS.length - 1],
    href: linkBase ? `${linkBase}?q=${item.id}` : undefined
  }));
  if (rest.length > 0) {
    legend.push({
      id: "__other__",
      label: `Other (${rest.length} ${unitLabel})`,
      value: restTotal,
      color: OTHER_COLOR,
      href: undefined
    });
  }

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
      <DonutChart segments={legend.map((l) => ({ value: l.value, color: l.color }))} size={172} strokeWidth={15}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total</span>
        <span className="text-lg font-bold leading-tight text-gray-900">{formatValue(total)}</span>
        <span className="mt-0.5 text-[11px] text-gray-400">
          {items.length} {unitLabel}
        </span>
      </DonutChart>

      <div className="flex w-full flex-1 flex-col gap-1">
        {legend.map((l) => {
          const row = (
            <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-50">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="truncate font-medium text-gray-700">{l.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-xs text-gray-400">{formatPct(pctOfTotal(l.value, total))}</span>
                <span className="w-14 text-right font-semibold tabular-nums text-gray-900">{formatValue(l.value)}</span>
              </span>
            </div>
          );
          return l.href ? (
            <Link key={l.id} href={l.href}>
              {row}
            </Link>
          ) : (
            <div key={l.id}>{row}</div>
          );
        })}
      </div>
    </div>
  );
}
