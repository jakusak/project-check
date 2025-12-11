import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MOBILE_BREAKPOINT = 768;

// Map of desktop routes to mobile routes
const MOBILE_ROUTES: Record<string, string> = {
  "/": "/m/home",
  "/van-incidents/new": "/m/van-incidents/new",
  "/cart": "/m/requests/new",
  "/cycle-counts/new": "/m/cycle-counts/new",
  "/broken-items/new": "/m/broken-items/new",
  "/tps/assign-bikes": "/m/tps/assign-bikes",
};

/**
 * Redirects mobile users from desktop routes to their mobile equivalents.
 * Only redirects from specific routes that have mobile versions.
 * Uses a stable check to prevent redirect loops.
 * 
 * @param enabled - Whether the redirect should be enabled (use false during loading)
 */
export function useMobileRedirect(enabled: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    // Skip if not enabled (e.g., during auth loading)
    if (!enabled) return;
    
    // Reset redirect flag if pathname changed (allows redirect on new route)
    if (lastPathname.current !== location.pathname) {
      hasRedirected.current = false;
      lastPathname.current = location.pathname;
    }
    
    // Only redirect once per route
    if (hasRedirected.current) return;
    
    // Check mobile status synchronously
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) return;

    const mobileRoute = MOBILE_ROUTES[location.pathname];
    if (mobileRoute) {
      hasRedirected.current = true;
      navigate(mobileRoute, { replace: true });
    }
  }, [enabled, location.pathname, navigate]);
}
