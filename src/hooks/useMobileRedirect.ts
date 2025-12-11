import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MOBILE_BREAKPOINT = 768;

/**
 * Redirects mobile users from desktop routes to their mobile equivalents.
 * Only redirects from specific routes that have mobile versions.
 * Uses a stable check to prevent redirect loops.
 */
export function useMobileRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only check once per mount to prevent loops
    if (hasRedirected.current) return;
    
    // Check mobile status synchronously
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) return;

    // Map of desktop routes to mobile routes
    const mobileRoutes: Record<string, string> = {
      "/": "/m/home",
      "/van-incidents/new": "/m/van-incidents/new",
      "/cart": "/m/requests/new",
      "/cycle-counts/new": "/m/cycle-counts/new",
      "/broken-items/new": "/m/broken-items/new",
      "/tps/assign-bikes": "/m/tps/assign-bikes",
    };

    const mobileRoute = mobileRoutes[location.pathname];
    if (mobileRoute) {
      hasRedirected.current = true;
      navigate(mobileRoute, { replace: true });
    }
  }, [location.pathname, navigate]);
}
