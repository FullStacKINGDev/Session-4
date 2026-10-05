"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/commandPalette";
import { formatValue, type StockRow } from "@/lib/data";
import { getProjects, getSuppliers } from "@/lib/api";

type Result = { kind: "project" | "supplier"; id: string; stockValue: number; href: string };

// Real ⌘K / Ctrl+K command palette - a legitimate "need interaction" Client
// Component. Lives once in app/dashboard/layout.tsx; the Header's
// Search / Filter pill opens it via the tiny event bus in lib/commandPalette.ts
// instead of prop-drilling through every page.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<StockRow[]>([]);
  const [suppliers, setSuppliers] = useState<StockRow[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Build the search index once, on mount - by the time anyone actually
  // presses ⌘K this has almost always already resolved.
  useEffect(() => {
    Promise.all([getProjects(), getSuppliers()])
      .then(([p, s]) => {
        setProjects(p.projects);
        setSuppliers(s.suppliers);
      })
      .catch(() => {
        // Silent - if this fails, the palette just shows "no matches" and
        // the page-level ApiState components are the ones responsible for
        // surfacing the real error.
      })
      .finally(() => setIndexLoading(false));
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  // Reset the query on the closed -> open transition. Adjusted during
  // render (not a useEffect) - React's recommended pattern for "reset
  // state when something changes": https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQuery("");
  }

  // Focusing the input is a real DOM side effect (not a state update), so
  // this one *does* belong in a useEffect.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results: Result[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const projectMatches: Result[] = projects.filter((p) => `project ${p.id}`.toLowerCase().includes(q)).map(
      (p) => ({ kind: "project", id: p.id, stockValue: p.stockValue, href: `/dashboard/projects?q=${p.id}` })
    );
    const supplierMatches: Result[] = suppliers.filter((s) => s.id.toLowerCase().includes(q)).map((s) => ({
      kind: "supplier",
      id: s.id,
      stockValue: s.stockValue,
      href: `/dashboard/suppliers?q=${s.id}`
    }));
    return [...projectMatches, ...supplierMatches].slice(0, 8);
  }, [query, projects, suppliers]);

  function go(result: Result) {
    router.push(result.href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-gray-900/40 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Icon name="search" className="text-[18px] text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0]);
            }}
            placeholder="Search a project or supplier (e.g. M, Sup-8)..."
            className="w-full text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">Esc</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto py-1">
          {indexLoading && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Loading projects &amp; suppliers...</p>
          )}
          {!indexLoading && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              No projects or suppliers match &ldquo;{query}&rdquo;.
            </p>
          )}
          {results.map((result) => (
            <button
              key={`${result.kind}-${result.id}`}
              type="button"
              onClick={() => go(result)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  name={result.kind === "project" ? "folder_open" : "local_shipping"}
                  className="text-[18px] text-gray-400"
                />
                <span className="font-medium text-gray-900">
                  {result.kind === "project" ? `Project ${result.id}` : result.id}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                  {result.kind}
                </span>
              </span>
              <span className="tabular-nums text-gray-500">{formatValue(result.stockValue)}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
          Enter to open the top result · Esc to close
        </div>
      </div>
    </div>
  );
}
