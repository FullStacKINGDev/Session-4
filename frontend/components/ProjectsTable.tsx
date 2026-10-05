"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import type { StockRow } from "@/lib/data";
import { formatPct, formatValue } from "@/lib/data";

type SortKey = "id" | "stockValue" | "under90" | "over90" | "over180" | "over365";

const COLUMNS: Array<{ key: SortKey; label: string; align: "left" | "right" }> = [
  { key: "id", label: "Project", align: "left" },
  { key: "stockValue", label: "Stock Value", align: "right" },
  { key: "under90", label: "< 90 Days", align: "right" },
  { key: "over90", label: "> 90 Days", align: "right" },
  { key: "over180", label: "> 180 Days", align: "right" },
  { key: "over365", label: "> 365 Days", align: "right" }
];

// Client Component: this table needs local state for the search box and
// sortable columns, which only exists in the browser - that's the "need
// interaction? -> use client" rule from this session's slides in action.
export default function ProjectsTable({ initialData }: { initialData: StockRow[] }) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(urlQuery);
  const [sortKey, setSortKey] = useState<SortKey>("stockValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Picks up ?q= when the Command Palette (⌘K) sends you here, including
  // navigating here again while already on this page (same route, so this
  // component doesn't remount - only its props/searchParams change).
  // Adjusted during render, not in a useEffect: React's recommended pattern
  // for "reset state when a prop changes" - https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  const maxValue = useMemo(() => Math.max(...initialData.map((r) => r.stockValue)), [initialData]);
  const total = useMemo(
    () => ({
      stockValue: initialData.reduce((s, r) => s + r.stockValue, 0),
      under90: initialData.reduce((s, r) => s + r.under90, 0),
      over90: initialData.reduce((s, r) => s + r.over90, 0),
      over180: initialData.reduce((s, r) => s + r.over180, 0),
      over365: initialData.reduce((s, r) => s + r.over365, 0)
    }),
    [initialData]
  );

  const rows = useMemo(() => {
    const filtered = initialData.filter((row) =>
      `Project ${row.id}`.toLowerCase().includes(search.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
      const diff =
        sortKey === "id" ? a.id.localeCompare(b.id) : a[sortKey] - b[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [initialData, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/15"
          />
        </div>
        <span className="text-xs text-gray-400">
          Showing {rows.length} of {initialData.length} projects
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {COLUMNS.map((col) => (
                <th key={col.key} className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : "text-left"}`}>
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={`inline-flex items-center gap-1 hover:text-gray-700 ${
                      col.align === "right" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {col.label}
                    <Icon
                      name={sortKey === col.key ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                      className="text-[14px]"
                    />
                  </button>
                </th>
              ))}
              <th className="px-4 py-2.5 text-center">Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => {
              const isTop = row.stockValue === maxValue;
              return (
                <tr key={row.id} className={isTop ? "bg-indigo-50/60" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      Project {row.id}
                      {isTop && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Highest
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                    {formatValue(row.stockValue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{formatValue(row.under90)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{formatValue(row.over90)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{formatValue(row.over180)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-red-600">
                    {formatValue(row.over365)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">{i + 1}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No projects match &ldquo;{search}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
              <td className="px-4 py-3">Total ({initialData.length})</td>
              <td className="px-4 py-3 text-right tabular-nums text-indigo-600">{formatValue(total.stockValue)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatValue(total.under90)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatValue(total.over90)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatValue(total.over180)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-red-600">{formatValue(total.over365)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
        {formatPct((total.under90 / total.stockValue) * 100)} of combined stock is under 90 days old.
      </p>
    </div>
  );
}
