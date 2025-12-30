import { Link, useLocation, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import backroadsLogo from "@/assets/backroads-logo.png";
import { useRegion, Region } from "@/contexts/RegionContext";
import NotificationBell from "@/components/NotificationBell";
import { useMobileRedirect } from "@/hooks/useMobileRedirect";

export default function Layout() {
  const { user, isAdmin, isOPX, isHubAdmin, isSuperAdmin, isTPS, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedRegion } = useRegion();

  // Auto-redirect mobile users to mobile routes - only when not loading and user exists
  const shouldRedirect = !loading && !!user;
  useMobileRedirect(shouldRedirect);

  if (loading) {
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
    return <Navigate to="/auth" replace />;
  }

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    navigate("/equipment");
  };

  const regions: { key: Region; label: string }[] = [
    { key: "usa_lappa", label: "USA & Lappa" },
    { key: "canada", label: "Canada" },
    { key: "europe", label: "Europe" },
  ];

  const futureProjectItems = [
    { to: "/unit-schedule", label: "Unit Schedule" },
    { to: "/van-module", label: "Van Module" },
    { to: "/unit-loads", label: "Unit Loads" },
    { to: "/warehouses", label: "Warehouses" },
  ];

  const tpsItems = [
    { to: "/tps/assign-bikes", label: "Assign Bikes" },
    { to: "/tps/bike-history", label: "Bike History Search" },
  ];

  const adminNavItems = [
    { to: "/admin/requests", label: "All Requests" },
    { to: "/admin/equipment", label: "Manage Equipment" },
    { to: "/admin/users", label: "Manage Users" },
    { to: "/admin/assignments", label: "Manage Assignments" },
    { to: "/admin/bulk-opx", label: "Bulk OPX Onboarding" },
  ];

  // Check if current path is in Equipment & Inventory section
  const isEquipmentInventoryActive = 
    location.pathname === "/equipment" || 
    location.pathname === "/my-requests" || 
    location.pathname === "/cart" ||
    location.pathname.startsWith("/cycle-counts") ||
    location.pathname.startsWith("/broken-items") ||
    location.pathname.startsWith("/maintenance") ||
    location.pathname.startsWith("/inventory");

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
            {/* Analytics - OPX/Admin only */}
            {(isOPX || isAdmin || isSuperAdmin) && (
              <Link
                to="/analytics/ops"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === "/analytics/ops"
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                Analytics
              </Link>
            )}

            {/* Van Incidents */}
            <Link
              to="/van-incidents"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith("/van-incidents")
                  ? "bg-sidebar-accent text-primary-foreground"
                  : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
              )}
            >
              Van Incidents
            </Link>

            {/* Fleet Violations */}
            <Link
              to="/fleet"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith("/fleet")
                  ? "bg-sidebar-accent text-primary-foreground"
                  : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
              )}
            >
              Fleet Violations
            </Link>

            {/* Equipment & Inventory Mega-Dropdown */}
            <div className="relative group">
              <button
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  isEquipmentInventoryActive
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                Equipment & Inventory
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-72 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {/* Equipment Requests Section */}
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Equipment Requests
                </div>
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
                  My Request History
                </Link>
                {(isOPX || isAdmin) && (
                  <Link
                    to="/opx/dashboard"
                    className={cn(
                      "flex items-center px-4 py-2.5 text-sm transition-colors",
                      location.pathname === "/opx/dashboard"
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    OPX Review Queue
                  </Link>
                )}

                {/* Cycle Counts Section */}
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-b border-border mt-1">
                  Cycle Counts
                </div>
                <Link
                  to="/cycle-counts/new"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/cycle-counts/new"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  New Cycle Count
                </Link>
                <Link
                  to="/cycle-counts/my"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/cycle-counts/my"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  My Cycle Counts
                </Link>
                {(isOPX || isAdmin) && (
                  <Link
                    to="/cycle-counts/review"
                    className={cn(
                      "flex items-center px-4 py-2.5 text-sm transition-colors",
                      location.pathname.startsWith("/cycle-counts/review")
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    Review Cycle Counts
                  </Link>
                )}

                {/* Equipment Health Section */}
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-b border-border mt-1">
                  Equipment Health
                </div>
                <Link
                  to="/broken-items"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/broken-items"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  Broken Item Reports
                </Link>
                <Link
                  to="/broken-items/new"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/broken-items/new"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  Report Broken Item
                </Link>
                <Link
                  to="/maintenance"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/maintenance"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  Maintenance Records
                </Link>
                <Link
                  to="/maintenance/new"
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm transition-colors",
                    location.pathname === "/maintenance/new"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  New Maintenance Record
                </Link>

                {/* Inventory Moves Section - OPX/Admin only */}
                {(isOPX || isAdmin) && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-b border-border mt-1">
                      Inventory Moves
                    </div>
                    <Link
                      to="/inventory/moves"
                      className={cn(
                        "flex items-center px-4 py-2.5 text-sm transition-colors",
                        location.pathname === "/inventory/moves"
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      All Inventory Moves
                    </Link>
                    <Link
                      to="/inventory/moves/new"
                      className={cn(
                        "flex items-center px-4 py-2.5 text-sm transition-colors",
                        location.pathname === "/inventory/moves/new"
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      New Inventory Move
                    </Link>
                  </>
                )}
              </div>
            </div>

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

            {/* TPS Tools Dropdown */}
            {(isTPS || isAdmin) && (
              <div className="relative group">
                <button
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    location.pathname.startsWith("/tps")
                      ? "bg-sidebar-accent text-primary-foreground"
                      : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                  )}
                >
                  TPS Tools
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {tpsItems.map((item) => (
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

            {/* Future Projects Dropdown */}
            <div className="relative group">
              <button
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  futureProjectItems.some(item => location.pathname === item.to)
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                Future Projects
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {futureProjectItems.map((item) => (
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
