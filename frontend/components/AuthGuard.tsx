"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, SESSION_EXPIRED_EVENT } from "@/lib/auth";

// Session 19 Slide 7: redirects to /login if there's no token. A separate
// Client Component wrapping dashboard/layout.tsx's children, rather than
// turning that whole layout into "use client", so the layout itself stays
// a Server Component - same split this app already uses for Sidebar/
// CommandPalette living inside an otherwise-server layout.
//
// The token check only makes sense client-side (localStorage doesn't
// exist on the server), so the very first render can't yet know if the
// user is authenticated - rendering children immediately would flash
// real dashboard content before the redirect fires. "checking" is a
// third state purely to avoid that flash; it leaves as soon as the
// client-side check has actually run, every time.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authenticated">("checking");
  const router = useRouter();

  useEffect(() => {
    // localStorage doesn't exist during server rendering, so this check
    // can only happen client-side, in an effect - not the "adjusting
    // state when a prop changes" antipattern react-hooks/set-state-in-effect
    // targets (see the render-time-adjustment fix in Sidebar.tsx for that
    // case); this is reading an external system React doesn't own, same
    // justification as the documented data-fetching effects in the
    // dashboard pages.
    if (isAuthenticated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("authenticated");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // A 401 from any API call (backend/middleware/auth.js rejecting a
  // missing/invalid/expired token - e.g. the Node server restarted and
  // forgot every session) fires this from lib/api.ts, at any point while
  // already inside the dashboard, not just on mount. Without this, a
  // mid-session 401 left the user stuck on a page showing "your session
  // has expired" with no way forward but a manual refresh - found live
  // by actually invalidating a token mid-session, not assumed handled.
  useEffect(() => {
    function onSessionExpired() {
      router.replace("/login");
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
