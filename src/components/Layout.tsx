import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import backroadsLogo from "@/assets/backroads-logo.png";

export default function Layout() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/auth" />;
  }

  const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/van-module", label: "Van Module" },
    { to: "/unit-loads", label: "Unit Loads" },
    { to: "/warehouses", label: "Warehouses" },
    { to: "/equipment", label: "Equipment" },
    { to: "/my-requests", label: "Equipment Request" },
  ];

  const adminNavItems = [
    { to: "/admin/requests", label: "All Requests" },
    { to: "/admin/equipment", label: "Manage Equipment" },
    { to: "/admin/users", label: "Manage Users" },
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
