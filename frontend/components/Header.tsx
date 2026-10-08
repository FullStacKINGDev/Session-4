"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { downloadCsv } from "@/lib/csv";
import { openCommandPalette } from "@/lib/commandPalette";
import { openSidebarDrawer } from "@/lib/sidebarDrawer";
import { logout as logoutRequest } from "@/lib/api";
import { clearToken } from "@/lib/auth";

type HeaderProps = {
  title: string;
  subtitle: string;
  /** Rows to export as CSV when "Export" is clicked. Omit to show "coming soon". */
  exportRows?: Array<Record<string, string | number>>;
  exportFilename?: string;
  /** Re-fetch this page's live data. Omit to show "coming soon" instead. */
  onRefresh?: () => void | Promise<void>;
  /** When this page's data last successfully loaded (Session 14 Slide 19's "last-updated label" stretch goal). */
  lastUpdated?: Date | null;
};

// Client Component: every control here now does something real, or - where
// there's genuinely nothing to wire up yet (no time-series data to filter by,
// in Date range's case) - tells you so instead of silently doing nothing.
export default function Header({ title, subtitle, exportRows, exportFilename, onRefresh, lastUpdated }: HeaderProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Session 19: real sign-out - invalidates the token server-side (best
  // effort) and clears it locally, then AuthGuard's own check on the next
  // /dashboard render sends them to /login. A hard navigation (not
  // router.push) so nothing from the signed-in session lingers in memory.
  async function handleLogout() {
    setMenuOpen(false);
    await logoutRequest();
    clearToken();
    router.push("/login");
  }

  function comingSoon(label: string) {
    setToast(`${label} — coming soon`);
  }

  function handleExport() {
    if (exportRows && exportRows.length > 0 && exportFilename) {
      downloadCsv(exportFilename, exportRows);
    } else {
      comingSoon("Export");
    }
  }

  async function handleRefresh() {
    if (!onRefresh) {
      comingSoon("Refresh (no live data source yet)");
      return;
    }
    setRefreshing(true);
    try {
      await onRefresh();
      setToast("Data refreshed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="sticky top-0 z-20 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/85 px-6 py-4 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={openSidebarDrawer}
          aria-label="Open menu"
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
        >
          <Icon name="menu" className="text-[20px]" />
        </button>
        <div>
          <h1 className="text-xl font-semibold leading-tight text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
          {lastUpdated && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
              <Icon name="schedule" className="text-[13px]" />
              Updated{" "}
              {lastUpdated.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => comingSoon("Date range filter")}
          className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Icon name="date_range" className="text-[16px] text-indigo-600" />
          <span>Last 30 Days</span>
        </button>

        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 sm:flex"
        >
          <Icon name="search" className="text-[16px]" />
          <span>Search / Filter</span>
          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">⌘K</span>
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Icon name="file_download" className="text-[16px]" />
          <span>Export</span>
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg bg-gray-50 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60"
        >
          <Icon name="refresh" className={`text-[18px] ${refreshing ? "animate-spin" : ""}`} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Account menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white transition-opacity hover:opacity-90"
          >
            <Icon name="person" className="text-[16px]" />
          </button>

          {menuOpen && (
            <>
              {/* Click-outside-to-close backdrop, same pattern CommandPalette
                  uses for its overlay - a full-screen invisible layer under
                  the menu, above everything else. */}
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-40 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Icon name="logout" className="text-[16px] text-gray-400" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
