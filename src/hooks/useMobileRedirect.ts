import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Redirects mobile users from desktop routes to their mobile equivalents.
 * Only redirects from specific routes that have mobile versions.
 */
export function useMobileRedirect() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
      navigate(mobileRoute, { replace: true });
    }
  }, [isMobile, location.pathname, navigate]);
}
