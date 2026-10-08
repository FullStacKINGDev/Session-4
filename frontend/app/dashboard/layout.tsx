import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import AuthGuard from "@/components/AuthGuard";

// Shared UI for every /dashboard/* route - the sidebar lives here so it's
// not re-rendered per page. Each page renders its own <Header title=.../>
// at the top of its content (see components/Header.tsx). CommandPalette
// lives here too (mounted once, hidden until opened) so ⌘K works from any
// /dashboard/* page. Session 19: AuthGuard wraps everything - this layout
// stays a Server Component, the redirect-if-signed-out check lives in
// AuthGuard itself.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <CommandPalette />
        <div className="lg:pl-60">
          <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
