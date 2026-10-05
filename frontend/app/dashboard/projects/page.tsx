"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import ApiState from "@/components/ApiState";
import ProjectsTable from "@/components/ProjectsTable";
import { formatValue, pctOfTotal, type StockRow } from "@/lib/data";
import { getProjects } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<StockRow[]>([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data.projects);
      setTotalStockValue(data.totalStockValue);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects");
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

  const topProject = [...projects].sort((a, b) => b.stockValue - a.stockValue)[0];
  const exportRows = projects.map((p) => ({
    Project: `Project ${p.id}`,
    "Stock Value": p.stockValue,
    "< 90 Days": p.under90,
    "> 90 Days": p.over90,
    "> 180 Days": p.over180,
    "> 365 Days": p.over365
  }));

  return (
    <>
      <Header
        title="Projects"
        subtitle="Manage and review inventory stock across all active projects."
        exportRows={exportRows}
        exportFilename="projects.csv"
        onRefresh={load}
        lastUpdated={lastUpdated}
      />

      <ApiState
        loading={loading}
        error={error}
        onRetry={load}
        loadingLabel="Loading projects..."
        isEmpty={!loading && !error && projects.length === 0}
        emptyMessage="No projects found. Run the backend's import script to load the workbook."
      >
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <span className="font-medium text-gray-900">{projects.length} total projects</span>
          <span className="text-gray-300">•</span>
          <span>
            Combined stock value <strong className="text-gray-900">{formatValue(totalStockValue)}</strong>
          </span>
          {topProject && (
            <>
              <span className="text-gray-300">•</span>
              <span>
                Highest: <strong className="text-gray-900">Project {topProject.id}</strong> (
                {formatValue(topProject.stockValue)}, {pctOfTotal(topProject.stockValue, totalStockValue).toFixed(1)}%
                of total)
              </span>
            </>
          )}
        </div>

        {/* ProjectsTable reads ?q= via useSearchParams(), which Next.js requires a Suspense boundary for */}
        <Suspense fallback={null}>
          <ProjectsTable initialData={projects} />
        </Suspense>
      </ApiState>
    </>
  );
}
