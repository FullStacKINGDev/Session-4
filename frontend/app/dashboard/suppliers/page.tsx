"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import ApiState from "@/components/ApiState";
import BarChart from "@/components/BarChart";
import DistributionDonut from "@/components/DistributionDonut";
import SuppliersTable from "@/components/SuppliersTable";
import { formatValue, type StockRow } from "@/lib/data";
import { getSuppliers } from "@/lib/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<StockRow[]>([]);
  const [totalSupplierStock, setTotalSupplierStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSuppliers();
      setSuppliers(data.suppliers);
      setTotalSupplierStock(data.totalSupplierStock);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data-fetching effect (React docs' pattern, not the state-adjustment
    // antipattern) - see the comment in app/dashboard/page.tsx for why this
    // is suppressed rather than restructured.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const sorted = [...suppliers].sort((a, b) => b.stockValue - a.stockValue);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const exportRows = suppliers.map((s) => ({
    Supplier: s.id,
    "Stock Value": s.stockValue
  }));

  return (
    <>
      <Header
        title="Suppliers"
        subtitle="Manage and review supplier stock allocations."
        exportRows={exportRows}
        exportFilename="suppliers.csv"
        onRefresh={load}
        lastUpdated={lastUpdated}
      />

      <ApiState
        loading={loading}
        error={error}
        onRetry={load}
        loadingLabel="Loading suppliers..."
        isEmpty={!loading && !error && suppliers.length === 0}
        emptyMessage="No suppliers found. Run the backend's import script to load the workbook."
      >
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <span className="font-medium text-gray-900">{suppliers.length} verified suppliers</span>
          <span className="text-gray-300">•</span>
          <span>
            Total committed stock <strong className="text-gray-900">{formatValue(totalSupplierStock)}</strong>
          </span>
          {top && bottom && (
            <>
              <span className="text-gray-300">•</span>
              <span>
                Range: <strong className="text-gray-900">{top.id}</strong> ({formatValue(top.stockValue)}) down to{" "}
                <strong className="text-gray-900">{bottom.id}</strong> ({formatValue(bottom.stockValue)})
              </span>
            </>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Stock by Supplier - same BarChart component as the Dashboard page,
              different API values (Session 14 Slide 5's "same component, different data"). */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stock by Supplier</h2>
                <p className="mt-1 text-sm text-gray-500">Committed stock per supplier. Click a bar to inspect it.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                {suppliers.length} suppliers
              </span>
            </div>
            <BarChart
              items={suppliers.map((s) => ({ id: s.id, label: s.id, value: s.stockValue }))}
              linkBase="/dashboard/suppliers"
            />
          </div>

          {/* Supplier Distribution - concentration, not magnitude: "how much
              of our committed stock sits with a handful of suppliers?" */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Supplier Distribution</h2>
                <p className="mt-1 text-sm text-gray-500">Share held by the top 5 suppliers, vs. everyone else.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Live from API
              </span>
            </div>
            <DistributionDonut
              items={suppliers.map((s) => ({ id: s.id, label: s.id, value: s.stockValue }))}
              linkBase="/dashboard/suppliers"
              unitLabel="suppliers"
            />
          </div>
        </div>

        {/* SuppliersTable reads ?q= via useSearchParams(), which Next.js requires a Suspense boundary for */}
        <Suspense fallback={null}>
          <SuppliersTable initialData={suppliers} />
        </Suspense>
      </ApiState>
    </>
  );
}
