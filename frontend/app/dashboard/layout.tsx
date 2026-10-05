import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";

// Shared UI for every /dashboard/* route - the sidebar lives here so it's
// not re-rendered per page. Each page renders its own <Header title=.../>
// at the top of its content (see components/Header.tsx). CommandPalette
// lives here too (mounted once, hidden until opened) so ⌘K works from any
// /dashboard/* page.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <CommandPalette />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
