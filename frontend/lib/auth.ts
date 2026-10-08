// Session 19: the dashboard's one piece of client-side auth state - a
// token issued by POST /api/auth/login (backend/controllers/authController.js),
// held in localStorage so it survives a page refresh. Wrapped in try/catch
// per this project's established localStorage convention (Sidebar.tsx's
// drawer state does the same) - a private window or blocked storage should
// degrade to "not logged in," not throw.
const TOKEN_KEY = "dashboard_auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable - the user will just need to log in again next
    // visit instead of staying signed in, not a hard failure.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clean up if storage was never reachable in the first place.
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Same tiny CustomEvent-bus pattern as lib/commandPalette.ts / lib/sidebarDrawer.ts
// - api.ts's request()/askAI() fire this the moment any call gets a 401
// (token invalid or expired, e.g. the backend restarted), and AuthGuard
// listens for it to redirect immediately. Without this, a 401 mid-session
// only cleared the token silently - the user stayed on a broken dashboard
// screen showing "session expired" until they manually refreshed; found
// live by actually invalidating a token mid-session rather than assuming
// clearToken() alone was enough.
export const SESSION_EXPIRED_EVENT = "dashboard-session-expired";

export function notifySessionExpired() {
  clearToken();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
