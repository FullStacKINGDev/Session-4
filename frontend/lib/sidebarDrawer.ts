// Same tiny browser CustomEvent bus pattern as lib/commandPalette.ts - lets
// the per-page <Header> (mobile hamburger button) open the <Sidebar> drawer
// that lives once in the dashboard layout, without prop-drilling or a
// Context provider for one boolean.
export const OPEN_SIDEBAR_EVENT = "open-sidebar-drawer";

export function openSidebarDrawer() {
  window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT));
}
