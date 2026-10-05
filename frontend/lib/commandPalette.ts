// A tiny browser CustomEvent bus so the per-page <Header> (Search / Filter
// pill) can open the <CommandPalette> that lives once in the dashboard
// layout, without prop-drilling or a Context provider for one boolean.
export const OPEN_COMMAND_PALETTE_EVENT = "open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}
