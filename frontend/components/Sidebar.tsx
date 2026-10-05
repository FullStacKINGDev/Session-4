"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { OPEN_SIDEBAR_EVENT } from "@/lib/sidebarDrawer";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "grid_view" },
  { href: "/dashboard/projects", label: "Projects", icon: "folder_open" },
  { href: "/dashboard/metrics", label: "Metrics", icon: "analytics" },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: "local_shipping" }
];

// This is a Client Component (note "use client" above) because it needs
// usePathname() to highlight the active link, plus (below) local state for
// the mobile drawer - neither is something a Server Component can do.
//
// Below the `lg` breakpoint the sidebar is an off-canvas drawer (hidden by
// default, opened via Header's hamburger button through the tiny event bus
// in lib/sidebarDrawer.ts) instead of a permanently fixed 240px column -
// without this, anything narrower than ~1024px loses nearly two-thirds of
// its width to a sidebar it can't see past.
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener(OPEN_SIDEBAR_EVENT, onOpenEvent);
    return () => window.removeEventListener(OPEN_SIDEBAR_EVENT, onOpenEvent);
  }, []);

  // Close the drawer whenever the route changes (e.g. tapping a nav link,
  // or navigating from the Command Palette). Adjusted during render, not in
  // a useEffect - React's documented pattern for "reset state when
  // something changes" (see the matching comment in ProjectsTable.tsx).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Prevent the page behind the drawer from scrolling while it's open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop - mobile only, shown while the drawer is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-gray-200 bg-white py-6 transition-transform duration-200 lg:w-60 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-8 px-4">
          <div className="flex items-center justify-between px-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <Icon name="inventory_2" className="text-[20px]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-semibold text-gray-900">Inventory</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Dashboard
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon name={link.icon} className="text-[20px]" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Icon name="person" className="text-[18px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-medium text-gray-900">Analytics Admin</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Internal Tool
                </span>
              </div>
            </div>
            <Icon name="verified_user" className="text-[16px] text-gray-400" />
          </div>
        </div>
      </aside>
    </>
  );
}
