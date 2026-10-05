"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatValue } from "@/lib/data";

export type BarChartItem = { id: string; label: string; value: number };

type BarChartProps = {
  items: BarChartItem[];
  /** If set, each bar links to `${linkBase}?q=${id}` (reuses the Command
   *  Palette's ?q= pre-filter convention - clicking a bar jumps straight to
   *  that row in the matching table). */
  linkBase?: string;
};

// Session 14, Slide 8: "one category -> one bar." Horizontal bars (not
// vertical) so 14 labels stay readable without crowding an x-axis. Sorted
// descending so the comparison ("which is bigger?") is visible at a glance,
// not something the viewer has to hunt for.
//
// Plain SVG/CSS, no charting library - same approach as DonutChart.tsx.
export default function BarChart({ items, linkBase }: BarChartProps) {
  const [animated, setAnimated] = useState(false);
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((i) => i.value), 0.0001);

  // Replay the grow-in animation whenever the data itself changes (e.g. a
  // Refresh brings back a new array). Reset happens during render, guarded
  // by comparing against the previous items reference - React's documented
  // pattern - not inside the effect, which is reserved for the actual DOM
  // side effect (scheduling the next-frame transition).
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setAnimated(false);
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [items]);

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((item) => {
        const pct = (item.value / max) * 100;
        const isMax = item.value === max;
        const row = (
          <div className="group flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-gray-50">
            <span className="w-16 shrink-0 truncate text-xs font-medium text-gray-600" title={item.label}>
              {item.label}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                  isMax
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600"
                    : "bg-gradient-to-r from-indigo-300 to-indigo-400 group-hover:from-indigo-400 group-hover:to-indigo-500"
                }`}
                style={{ width: animated ? `${pct}%` : "0%" }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-900">
              {formatValue(item.value)}
            </span>
          </div>
        );

        return linkBase ? (
          <Link key={item.id} href={`${linkBase}?q=${item.id}`}>
            {row}
          </Link>
        ) : (
          <div key={item.id}>{row}</div>
        );
      })}
    </div>
  );
}
