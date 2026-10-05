// Session 13 - the frontend's one place that knows how to talk to the
// Express API. Pages call these functions instead of calling fetch()
// directly (Slide 9: "move request logic out of the page").
import type { StockRow } from "@/lib/data";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ProjectSummary = { projectName: string; stockValue: number };

export type DashboardMetrics = {
  totalStockValue: number;
  averageStockValue: number;
  projectCount: number;
  aging: { under90: number; over90: number; over180: number; over365: number };
  topProject: ProjectSummary | null;
  bottomProject: ProjectSummary | null;
};

export type ProjectsResult = {
  projects: StockRow[];
  totalStockValue: number;
  projectCount: number;
};

export type SuppliersResult = {
  suppliers: StockRow[];
  totalSupplierStock: number;
  supplierCount: number;
};

// Shared request logic: check the network-level status (Slide 11 - fetch()
// does NOT throw on 404/500 by itself), then the API's own
// { success, message } envelope, before handing back just the payload.
async function request<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set (check .env.local)");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`);
  } catch {
    throw new Error(`Could not reach the API at ${API_URL}. Is the backend running?`);
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || "API returned an error");
  }

  return json.data as T;
}

export function getDashboardMetrics() {
  return request<DashboardMetrics>("/api/dashboard/metrics");
}

export async function getProjects(): Promise<ProjectsResult> {
  const data = await request<{
    projects: Array<{ projectName: string; stockValue: number; under90: number; over90: number; over180: number; over365: number }>;
    totalStockValue: number;
    projectCount: number;
  }>("/api/dashboard/projects");

  return {
    ...data,
    projects: data.projects.map((p) => ({
      id: p.projectName,
      stockValue: p.stockValue,
      under90: p.under90,
      over90: p.over90,
      over180: p.over180,
      over365: p.over365
    }))
  };
}

export async function getSuppliers(): Promise<SuppliersResult> {
  const data = await request<{
    suppliers: Array<{ supplierName: string; stockValue: number }>;
    totalSupplierStock: number;
    supplierCount: number;
  }>("/api/dashboard/suppliers");

  return {
    ...data,
    // The live /suppliers endpoint only aggregates stockValue per supplier
    // (see backend/controllers/dashboardController.js) - it doesn't return
    // per-bucket aging for suppliers, so under90/over90/over180/over365 are
    // unused placeholders here. SuppliersTable never reads them.
    suppliers: data.suppliers.map((s) => ({
      id: s.supplierName,
      stockValue: s.stockValue,
      under90: 0,
      over90: 0,
      over180: 0,
      over365: 0
    }))
  };
}
