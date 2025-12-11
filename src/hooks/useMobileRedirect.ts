import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MOBILE_BREAKPOINT = 768;

// Map of desktop routes to mobile routes
const MOBILE_ROUTES: Record<string, string> = {
  "/analytics/ops": "/m/home", // Default landing redirects to mobile home
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
  const hasProcessedRoute = useRef<string | null>(null);

  useEffect(() => {
    // Skip if not enabled (e.g., during auth loading)
    if (!enabled) return;
    
    // Skip if already on a mobile route
    if (location.pathname.startsWith("/m/")) return;
    
    // Skip if we already processed this exact pathname
    if (hasProcessedRoute.current === location.pathname) return;
    
    // Check mobile status synchronously
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) return;

    const mobileRoute = MOBILE_ROUTES[location.pathname];
    if (mobileRoute) {
      hasProcessedRoute.current = location.pathname;
      navigate(mobileRoute, { replace: true });
    }
  }, [enabled, location.pathname, navigate]);
}
