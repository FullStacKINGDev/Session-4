"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import AISearch from "@/components/AISearch";
import ApiState from "@/components/ApiState";
import KpiCard from "@/components/KpiCard";
import Icon from "@/components/Icon";
import AgingBar from "@/components/AgingBar";
import BarChart from "@/components/BarChart";
import DistributionDonut from "@/components/DistributionDonut";
import { AGING_BUCKETS } from "@/lib/aging";
import { formatPct, formatValue, pctOfTotal, type StockRow } from "@/lib/data";
import { getDashboardMetrics, getProjects, type DashboardMetrics } from "@/lib/api";

// Session 13: client-side fetch + loading/error/empty state, per this
// session's slides ("today, start with a client-side fetch for interactive
// UI" - Slide 7). Replaces the static lib/data.ts numbers used since Session 10.
// Session 14: also fetches the individual project rows (not just the
// aggregate) so the KPI cards AND the "Stock by Project" chart both come
// from live data - Slide 11's "one source of truth, multiple views."
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [projects, setProjects] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, projectsData] = await Promise.all([getDashboardMetrics(), getProjects()]);
      setMetrics(metricsData);
      setProjects(projectsData.projects);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This is React's own documented "Effects for fetching data" pattern
    // (https://react.dev/learn/synchronizing-with-effects#fetching-data) -
    // load()'s setState calls happen after an await, not synchronously in
    // this effect body. That's different from the "adjust state when a
    // prop changes" antipattern react-hooks/set-state-in-effect targets
    // (see the render-time-adjustment fix in ProjectsTable.tsx for that case).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const exportRows = metrics
    ? [
        { Metric: "Total Stock Value", Value: metrics.totalStockValue },
        { Metric: "Average Stock Value", Value: metrics.averageStockValue },
        { Metric: "Projects", Value: metrics.projectCount },
        { Metric: "< 90 Days", Value: metrics.aging.under90 },
        { Metric: "> 90 Days", Value: metrics.aging.over90 },
        { Metric: "> 180 Days", Value: metrics.aging.over180 },
        { Metric: "> 365 Days", Value: metrics.aging.over365 },
        {
          Metric: "Top Project",
          Value: metrics.topProject ? `${metrics.topProject.projectName} (${formatValue(metrics.topProject.stockValue)})` : "n/a"
        }
      ]
    : undefined;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="View your business metrics here."
        exportRows={exportRows}
        exportFilename="dashboard-summary.csv"
        onRefresh={load}
        lastUpdated={lastUpdated}
      />

      {/* Session 18: independent of the metrics/projects fetch below - the
          AI search bar should work (and fail gracefully) on its own, not
          be gated behind the dashboard's own loading/error state. */}
      <AISearch />

      <ApiState
        loading={loading}
        error={error}
        onRetry={load}
        loadingLabel="Loading dashboard metrics..."
        isEmpty={!loading && !error && (!metrics || metrics.projectCount === 0)}
        emptyMessage="No projects found. Run the backend's import script to load the workbook."
      >
        {metrics && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <KpiCard
                label="Total Stock Value"
                value={formatValue(metrics.totalStockValue)}
                icon="payments"
                footnoteIcon="domain"
                footnote={`Consolidated across ${metrics.projectCount} active projects`}
                accent
              />
              <KpiCard
                label="Projects"
                value={String(metrics.projectCount)}
                icon="inventory"
                footnoteIcon="folder_copy"
                footnote="Active project portfolios"
              />
              <KpiCard
                label="Average Stock Value"
                value={formatValue(metrics.averageStockValue)}
                icon="calculate"
                footnoteIcon="balance"
                footnote="Per project average allocation"
                accent
              />
            </div>

            {/* Stock by Project - Session 14 Slide 8: "one category -> one bar" */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Stock by Project</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Every active project, compared side by side. Click a bar to inspect it.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  {projects.length} projects
                </span>
              </div>
              <BarChart
                items={projects.map((p) => ({ id: p.id, label: p.id, value: p.stockValue }))}
                linkBase="/dashboard/projects"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Stock Aging Distribution */}
              <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div>
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Stock Aging Distribution</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Project inventory categorized by warehouse dwell time.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      Live from API
                    </span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {AGING_BUCKETS.map((bucket) => {
                      const value = metrics.aging[bucket.key];
                      return (
                        <AgingBar
                          key={bucket.key}
                          bucketKey={bucket.key}
                          value={value}
                          percentOfTotal={pctOfTotal(value, metrics.totalStockValue)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-lg bg-gray-50 p-3.5 text-sm text-gray-500">
                  <Icon name="info" className="text-[18px] text-gray-400" />
                  <span>
                    The four buckets add up to{" "}
                    {formatPct(
                      pctOfTotal(
                        metrics.aging.under90 + metrics.aging.over90 + metrics.aging.over180 + metrics.aging.over365,
                        metrics.totalStockValue
                      )
                    )}{" "}
                    of total stock value; the remainder isn&rsquo;t broken into an aging bucket in the source
                    workbook.
                  </span>
                </div>
              </div>

              {/* Top Project highlight */}
              <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
                {metrics.topProject ? (
                  <div>
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Top Project</h2>
                        <p className="mt-0.5 text-sm text-gray-500">Largest stock allocation</p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        Highest value
                      </span>
                    </div>

                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white shadow-md">
                        {metrics.topProject.projectName}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Project Identifier
                        </span>
                        <h3 className="text-base font-semibold text-gray-900">
                          Project {metrics.topProject.projectName}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-5 flex flex-col gap-1 rounded-xl bg-gray-50 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Stock Value
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                          {formatValue(metrics.topProject.stockValue)}
                        </span>
                        <span className="text-xs font-medium text-indigo-600">
                          {formatPct(pctOfTotal(metrics.topProject.stockValue, metrics.totalStockValue))} of total
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${pctOfTotal(metrics.topProject.stockValue, metrics.totalStockValue)}%` }}
                        />
                      </div>
                    </div>

                    {metrics.bottomProject && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Icon name="vertical_align_bottom" className="text-[16px]" />
                          Lowest: Project {metrics.bottomProject.projectName}
                        </span>
                        <span className="font-medium tabular-nums text-gray-900">
                          {formatValue(metrics.bottomProject.stockValue)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No project data yet.</p>
                )}

                <a
                  href="/dashboard/projects"
                  className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-gray-50 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <span>View all projects</span>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </a>
              </div>
            </div>

            {/* Project Distribution - a different question from the bar chart
                above ("how concentrated is our stock?" vs. "which is bigger?"). */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Project Distribution</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Share of total stock held by the top 5 projects, vs. everyone else.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  Live from API
                </span>
              </div>
              <DistributionDonut
                items={projects.map((p) => ({ id: p.id, label: `Project ${p.id}`, value: p.stockValue }))}
                linkBase="/dashboard/projects"
                unitLabel="projects"
              />
            </div>
          </>
        )}
      </ApiState>
    </>
  );
}
