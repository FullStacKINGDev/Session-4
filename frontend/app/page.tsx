import Link from "next/link";

// Server Component (default) - this page just renders static UI, no
// interactivity needed, so no "use client" here.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
        <span className="material-symbols-outlined text-[24px]">inventory_2</span>
      </div>

      <h1 className="text-3xl font-semibold text-gray-900">Inventory Dashboard</h1>

      <p className="max-w-md text-gray-500">
        Welcome to our dashboard. Project and supplier stock metrics, powered
        by our Node.js + MongoDB API.
      </p>

      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
