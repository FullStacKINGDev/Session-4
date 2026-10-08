// Session 13 - the frontend's one place that knows how to talk to the
// Express API. Pages call these functions instead of calling fetch()
// directly (Slide 9: "move request logic out of the page").
import type { StockRow } from "@/lib/data";
import { getToken, notifySessionExpired } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Session 19: every protected route needs this now (backend/middleware/auth.js).
// Centralized here so request()/askAI() don't each re-implement it.
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    response = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  } catch {
    throw new Error(`Could not reach the API at ${API_URL}. Is the backend running?`);
  }

  if (response.status === 401) {
    notifySessionExpired();
    throw new Error("Your session has expired. Please log in again.");
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

export type AskAIResult = {
  answer: string;
  sources: string[];
};

// Session 18: unlike the GET helpers above, this is a POST with a body,
// so it can't reuse request<T>() as-is - same error-handling shape
// though (network failure -> one message, { success: false } -> its
// message, otherwise the payload).
export async function askAI(question: string): Promise<AskAIResult> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set (check .env.local)");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ question })
    });
  } catch {
    throw new Error(`Could not reach the API at ${API_URL}. Is the backend running?`);
  }

  if (response.status === 401) {
    notifySessionExpired();
    throw new Error("Your session has expired. Please log in again.");
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || !json.success) {
    throw new Error(json.message || "AI request failed");
  }

  return json.data as AskAIResult;
}

// Session 19: posts credentials, hands back the token. Doesn't store it -
// lib/auth.ts owns storage, this module only owns the network call, same
// separation every other function here already keeps.
export async function login(email: string, password: string): Promise<string> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set (check .env.local)");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  } catch {
    throw new Error(`Could not reach the API at ${API_URL}. Is the backend running?`);
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Login failed");
  }

  return json.data.token as string;
}

// Best-effort: invalidates the token server-side too, not just locally.
// Never blocks the caller on network failure - clearing the local token
// is what actually matters for the UI.
export async function logout(): Promise<void> {
  if (!API_URL) return;
  try {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: authHeaders() });
  } catch {
    // The token still gets cleared locally by the caller - a failed
    // network call here shouldn't block signing out of the UI.
  }
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
