"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import type { StockRow } from "@/lib/data";
import { formatPct, formatValue } from "@/lib/data";

type SortKey = "id" | "stockValue" | "over365";

// Client Component (search box + sortable rank list = local UI state).
export default function SuppliersTable({ initialData }: { initialData: StockRow[] }) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(urlQuery);
  const [sortKey, setSortKey] = useState<SortKey>("stockValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Picks up ?q= when the Command Palette (⌘K) sends you here. Adjusted
  // during render, not in a useEffect - see the matching comment in
  // ProjectsTable.tsx for why.
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  const total = useMemo(() => initialData.reduce((s, r) => s + r.stockValue, 0), [initialData]);
  const maxValue = useMemo(() => Math.max(...initialData.map((r) => r.stockValue)), [initialData]);

  const rows = useMemo(() => {
    const filtered = initialData.filter((row) => row.id.toLowerCase().includes(search.toLowerCase()));
    const sorted = [...filtered].sort((a, b) => {
      const diff = sortKey === "id" ? a.id.localeCompare(b.id) : a[sortKey] - b[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [initialData, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "id" ? "asc" : "desc");
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
            placeholder="Search supplier..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/15"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <button
            type="button"
            onClick={() => toggleSort("stockValue")}
            className={`rounded-full px-2.5 py-1 ${sortKey === "stockValue" ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-100"}`}
          >
            Sort: Stock Value {sortKey === "stockValue" && (sortDir === "desc" ? "↓" : "↑")}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("id")}
            className={`rounded-full px-2.5 py-1 ${sortKey === "id" ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-100"}`}
          >
            Sort: Name {sortKey === "id" && (sortDir === "desc" ? "↓" : "↑")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-4 py-2.5 text-center">Rank</th>
              <th className="px-4 py-2.5">Supplier</th>
              <th className="px-4 py-2.5 text-right">Stock Value</th>
              <th className="px-4 py-2.5 text-right">% Share</th>
              <th className="px-4 py-2.5">Relative Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => {
              const isTop = row.stockValue === maxValue;
              const share = (row.stockValue / total) * 100;
              const relative = (row.stockValue / maxValue) * 100;
              return (
                <tr key={row.id} className={isTop ? "bg-indigo-50/60" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isTop ? "bg-indigo-600 text-white" : "text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {row.id.replace("Sup-", "S")}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{row.id}</span>
                        {isTop && (
                          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Top Supplier
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                    {formatValue(row.stockValue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{formatPct(share)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${relative}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs tabular-nums text-gray-400">
                        {relative.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No suppliers match &ldquo;{search}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
              <td />
              <td className="px-4 py-3">Total ({initialData.length} suppliers)</td>
              <td className="px-4 py-3 text-right tabular-nums text-indigo-600">{formatValue(total)}</td>
              <td className="px-4 py-3 text-right tabular-nums">100.0%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
