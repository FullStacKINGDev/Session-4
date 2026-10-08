"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { login as loginRequest } from "@/lib/api";
import { setToken, isAuthenticated } from "@/lib/auth";

// Session 19 Slide 6: the login page. Client Component - needs state for
// the form fields and a redirect on success, same "use client" line this
// whole dashboard already draws for any page with real interactivity.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Already signed in and landed back here (e.g. typed /login directly) -
  // bounce to /dashboard. Navigation is a side effect on the router, not
  // this component's own state, so - unlike AuthGuard's render-time
  // "checking" state - it has to run in an effect: calling router.replace()
  // directly in the render body threw "Cannot update a component (Router)
  // while rendering a different component," caught live via the Next.js
  // dev overlay's error count, not assumed away.
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    try {
      const token = await loginRequest(email.trim(), password);
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Icon name="inventory_2" className="text-[24px]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Inventory Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
              <Icon name="error" className="mt-0.5 text-[16px] text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
