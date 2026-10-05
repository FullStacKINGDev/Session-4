"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import ApiState from "@/components/ApiState";
import Icon from "@/components/Icon";
import DonutChart from "@/components/DonutChart";
import { AGING_BUCKETS } from "@/lib/aging";
import { formatPct, formatValue, pctOfTotal } from "@/lib/data";
import { getDashboardMetrics, getSuppliers, type DashboardMetrics } from "@/lib/api";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Two independent endpoints - fetch together (Slide 16's "clean data flow").
      const [metricsData, suppliersData] = await Promise.all([getDashboardMetrics(), getSuppliers()]);
      setMetrics(metricsData);
      setSupplierTotal(suppliersData.totalSupplierStock);
      setSupplierCount(suppliersData.supplierCount);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load metrics");
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

  const exportRows = metrics
    ? AGING_BUCKETS.map((bucket) => {
        const value = metrics.aging[bucket.key];
        return {
          "Aging Bucket": bucket.label,
          Value: value,
          "Share %": Number(pctOfTotal(value, metrics.totalStockValue).toFixed(1)),
          Status: bucket.status
        };
      })
    : undefined;

  return (
    <>
      <Header
        title="Metrics"
        subtitle="Deep dive into stock performance and allocation."
        exportRows={exportRows}
        exportFilename="aging-metrics.csv"
        onRefresh={load}
        lastUpdated={lastUpdated}
      />

      <ApiState
        loading={loading}
        error={error}
        onRetry={load}
        loadingLabel="Loading metrics..."
        isEmpty={!loading && !error && (!metrics || metrics.projectCount === 0)}
        emptyMessage="No projects found. Run the backend's import script to load the workbook."
      >
        {metrics && (
          <MetricsContent metrics={metrics} supplierTotal={supplierTotal} supplierCount={supplierCount} />
        )}
      </ApiState>
    </>
  );
}

function MetricsContent({
  metrics,
  supplierTotal,
  supplierCount
}: {
  metrics: DashboardMetrics;
  supplierTotal: number;
  supplierCount: number;
}) {
  const { totalStockValue, averageStockValue, topProject, bottomProject } = metrics;
  const topPct = topProject ? pctOfTotal(topProject.stockValue, totalStockValue) : 0;
  const bottomPct = bottomProject ? pctOfTotal(bottomProject.stockValue, totalStockValue) : 0;

  const segments = AGING_BUCKETS.map((bucket) => ({
    value: metrics.aging[bucket.key],
    color: bucket.hex
  }));

  const supplierVsProjectMax = Math.max(totalStockValue, supplierTotal);
  const projectBarWidth = pctOfTotal(totalStockValue, supplierVsProjectMax);
  const supplierBarWidth = pctOfTotal(supplierTotal, supplierVsProjectMax);
  const ratio = totalStockValue === 0 ? 0 : supplierTotal / totalStockValue;

  return (
    <>
      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Average Stock Value
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-indigo-600">
              <Icon name="functions" className="text-[20px]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
              {formatValue(averageStockValue)}
            </span>
            <p className="mt-1 text-sm text-gray-500">Mean portfolio holding</p>
          </div>
          <div className="mt-5 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <Icon name="scatter_plot" className="text-[16px] text-indigo-600" />
            <span>{metrics.projectCount} total active projects</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Highest Project Allocation
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon name="vertical_align_top" className="text-[20px]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              {topProject ? `Project ${topProject.projectName}` : "n/a"}
            </span>
            {topProject && (
              <span className="text-lg font-bold text-indigo-600 tabular-nums">{formatValue(topProject.stockValue)}</span>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <Icon name="pie_chart" className="text-[14px]" />
              {formatPct(topPct)} of total
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Lowest Project Allocation
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              <Icon name="vertical_align_bottom" className="text-[20px]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              {bottomProject ? `Project ${bottomProject.projectName}` : "n/a"}
            </span>
            {bottomProject && (
              <span className="text-lg font-bold text-gray-500 tabular-nums">{formatValue(bottomProject.stockValue)}</span>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {formatPct(bottomPct)} allocation
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Minimal risk
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Aging buckets: donut + bars + table */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Stock Aging Buckets Distribution</h2>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              Categorization of {formatValue(totalStockValue)} project inventory by warehouse dwell time.
            </p>

            <div className="mt-6 flex flex-col items-center gap-8 py-2 md:flex-row md:justify-center">
              <DonutChart segments={segments}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Stock
                </span>
                <span className="text-lg font-bold leading-tight text-gray-900">{formatValue(totalStockValue)}</span>
                <span className="mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {formatPct(pctOfTotal(metrics.aging.under90, totalStockValue))} fresh
                </span>
              </DonutChart>

              <div className="flex w-full flex-1 flex-col gap-3">
                {AGING_BUCKETS.map((bucket) => {
                  const value = metrics.aging[bucket.key];
                  const pct = pctOfTotal(value, totalStockValue);
                  return (
                    <div key={bucket.key} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-gray-900">
                          <span className={`h-2 w-2 rounded-full ${bucket.dot}`} />
                          {bucket.label}
                        </span>
                        <span className="font-semibold tabular-nums text-gray-900">
                          {formatValue(value)} <span className="font-normal text-gray-400">({formatPct(pct)})</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${bucket.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2.5">Aging Bucket</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                  <th className="px-4 py-2.5 text-right">Share</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {AGING_BUCKETS.map((bucket) => {
                  const value = metrics.aging[bucket.key];
                  const pct = pctOfTotal(value, totalStockValue);
                  return (
                    <tr key={bucket.key}>
                      <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-gray-900">
                        <span className={`h-2 w-2 rounded-full ${bucket.dot}`} />
                        {bucket.label}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{formatValue(value)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{formatPct(pct)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${bucket.chipBg} ${bucket.chipText}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${bucket.dot}`} />
                          {bucket.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project vs Supplier comparison */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Project vs. Supplier Stock</h2>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Project on-hand stock vs. supplier committed stock.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                Ratio 1 : {ratio.toFixed(2)}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-indigo-600" />
                    <span className="text-sm font-semibold text-gray-900">Projects (on-hand)</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-gray-900">{formatValue(totalStockValue)}</span>
                </div>
                <div className="flex h-8 w-full items-center rounded-lg bg-gray-100 p-1">
                  <div
                    className="flex h-full items-center justify-end rounded bg-indigo-600 px-2.5 transition-all duration-700"
                    style={{ width: `${projectBarWidth}%` }}
                  >
                    <span className="text-[11px] font-bold tabular-nums text-white">{metrics.projectCount} projects</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-blue-500" />
                    <span className="text-sm font-semibold text-gray-900">Suppliers (committed)</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-blue-600">{formatValue(supplierTotal)}</span>
                </div>
                <div className="flex h-8 w-full items-center rounded-lg bg-gray-100 p-1">
                  <div
                    className="flex h-full items-center justify-end rounded bg-blue-500 px-2.5 transition-all duration-700"
                    style={{ width: `${supplierBarWidth}%` }}
                  >
                    <span className="text-[11px] font-bold tabular-nums text-white">{supplierCount} suppliers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
            <div className="flex flex-col rounded-lg bg-gray-50 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Combined Stock
              </span>
              <span className="mt-1 text-lg font-bold text-gray-900 tabular-nums">
                {formatValue(totalStockValue + supplierTotal)}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">Projects + supplier nodes</span>
            </div>
            <div className="flex flex-col rounded-lg bg-gray-50 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Surplus Buffer
              </span>
              <span className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">
                +{formatValue(supplierTotal - totalStockValue)}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">Supplier stock over project stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Honest, computed insight strip - every number here is derived above, nothing invented */}
      <div className="mt-6 flex flex-col items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon name="speed" className="text-[26px]" />
        </div>
        <p className="text-sm text-gray-600">
          <strong className="text-gray-900">
            {formatPct(pctOfTotal(metrics.aging.under90, totalStockValue))} ({formatValue(metrics.aging.under90)})
          </strong>{" "}
          of project stock value is in the &lt;90-day (fresh) bucket. Suppliers currently hold about{" "}
          <strong className="text-gray-900">{ratio.toFixed(1)}×</strong> as much committed stock (
          {formatValue(supplierTotal)}) as projects have on hand ({formatValue(totalStockValue)}).
        </p>
      </div>
    </>
  );
}
