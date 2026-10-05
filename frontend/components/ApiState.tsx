"use client";

import type { ReactNode } from "react";
import Icon from "@/components/Icon";

type ApiStateProps = {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry: () => void;
  loadingLabel: string;
  children: ReactNode;
};

// Session 13's "definition of done": no infinite loading, no blank screen
// on failure, and empty results shown honestly instead of looking broken.
// One component, reused by every fetching page (Slide 19's stretch goal).
export default function ApiState({
  loading,
  error,
  isEmpty,
  emptyMessage = "No data found.",
  onRetry,
  loadingLabel,
  children
}: ApiStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
        <p className="text-sm text-gray-500">{loadingLabel}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50 p-16 text-center">
        <Icon name="error" className="text-[28px] text-red-500" />
        <p className="text-sm font-medium text-red-700">Could not load this data.</p>
        <p className="max-w-sm text-xs text-red-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          <Icon name="refresh" className="text-[16px]" />
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm">
        <Icon name="inbox" className="text-[28px] text-gray-300" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
