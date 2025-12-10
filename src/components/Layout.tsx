import { Link, useLocation, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import backroadsLogo from "@/assets/backroads-logo.png";
import { useRegion, Region } from "@/contexts/RegionContext";
import NotificationBell from "@/components/NotificationBell";

export default function Layout() {
  const { user, isAdmin, isOPX, isHubAdmin, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedRegion } = useRegion();

  console.log('[Layout] Render - loading:', loading, 'user:', user?.email);

  if (loading) {
    console.log('[Layout] Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[Layout] No user, redirecting to /auth');
    return <Navigate to="/auth" />;
  }
  
  console.log('[Layout] User authenticated, rendering content');

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    navigate("/equipment");
  };

  const regions: { key: Region; label: string }[] = [
    { key: "usa_lappa", label: "USA & Lappa" },
    { key: "canada", label: "Canada" },
    { key: "europe", label: "Europe" },
  ];

  const navItems = [
    { to: "/", label: "Unit Schedule" },
    { to: "/van-module", label: "Van Module" },
    { to: "/unit-loads", label: "Unit Loads" },
    { to: "/warehouses", label: "Warehouses" },
    { to: "/van-incidents", label: "Van Incidents" },
  ];

  const adminNavItems = [
    { to: "/admin/requests", label: "All Requests" },
    { to: "/admin/equipment", label: "Manage Equipment" },
    { to: "/admin/users", label: "Manage Users" },
    { to: "/admin/assignments", label: "Manage Assignments" },
    { to: "/admin/bulk-opx", label: "Bulk OPX Onboarding" },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Top Navigation Header - Backroads Style */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center h-14 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mr-8">
            <img 
              src={backroadsLogo} 
              alt="Backroads Logo" 
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="font-bold text-sm tracking-wide">BACKROADS OPS DASHBOARD</span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.to
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Equipment Request Dropdown */}
            <div className="relative group">
              <button
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname === "/equipment" || location.pathname === "/my-requests" || location.pathname === "/cart"
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                Equipment Request
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-64 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {/* Region Selection Submenu */}
                <div className="relative group/submenu">
                  <button className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                    <span>Equipment Catalog</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <div className="absolute left-full top-0 ml-1 w-48 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all z-50">
                    {regions.map((region) => (
                      <button
                        key={region.key}
                        onClick={() => handleRegionSelect(region.key)}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                      >
                        {region.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Link
                  to="/my-requests"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/my-requests"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  Equipment Request History/Status
                </Link>
              </div>
            </div>

            {/* OPX Dashboard Link */}
            {(isOPX || isAdmin) && (
              <Link
                to="/opx/dashboard"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === "/opx/dashboard"
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                OPX Review
              </Link>
            )}

            {/* Hub Fulfillment Dropdown */}
            {(isHubAdmin || isAdmin) && (
              <div className="relative group">
                <button
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    location.pathname === "/hub/dashboard" || location.pathname.startsWith("/team")
                      ? "bg-sidebar-accent text-primary-foreground"
                      : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                  )}
                >
                  Hub Fulfillment
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link
                    to="/hub/dashboard"
                    className={cn(
                      "flex items-center px-4 py-2.5 text-sm transition-colors",
                      location.pathname === "/hub/dashboard"
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    Hub Dashboard
                  </Link>
                  {/* Team Europe Submenu */}
                  <div className="relative group/europe">
                    <button className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                      <span>Team Europe</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-40 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover/europe:opacity-100 group-hover/europe:visible transition-all z-50">
                      <Link
                        to="/team/pernes"
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm transition-colors",
                          location.pathname === "/team/pernes"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        Team Pernes
                      </Link>
                      <Link
                        to="/team/tuscany"
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm transition-colors",
                          location.pathname === "/team/tuscany"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        Team Tuscany
                      </Link>
                      <Link
                        to="/team/czech"
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm transition-colors",
                          location.pathname === "/team/czech"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        Team Czech
                      </Link>
                    </div>
                  </div>
                  <Link
                    to="/team/usa"
                    className={cn(
                      "flex items-center px-4 py-2.5 text-sm transition-colors",
                      location.pathname === "/team/usa"
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    USA
                  </Link>
                  <Link
                    to="/team/canada"
                    className={cn(
                      "flex items-center px-4 py-2.5 text-sm transition-colors",
                      location.pathname === "/team/canada"
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    CAN
                  </Link>
                </div>
              </div>
            )}
            
            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative group">
                <button
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    location.pathname.startsWith("/admin")
                      ? "bg-sidebar-accent text-primary-foreground"
                      : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                  )}
                >
                  Admin
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center px-4 py-2.5 text-sm transition-colors",
                        location.pathname === item.to
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-sidebar-accent/50"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
