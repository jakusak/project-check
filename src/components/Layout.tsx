import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Home, Package, ClipboardList, Settings, LogOut, Truck, BoxIcon, Warehouse, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/van-module", label: "Van Module", icon: Truck },
    { to: "/unit-loads", label: "Unit Loads", icon: BoxIcon },
    { to: "/warehouses", label: "Warehouses", icon: Warehouse },
    { to: "/equipment", label: "Equipment", icon: Package },
    { to: "/my-requests", label: "My Requests", icon: ClipboardList },
  ];

  const adminNavItems = [
    { to: "/admin/requests", label: "All Requests", icon: ClipboardList },
    { to: "/admin/equipment", label: "Manage Equipment", icon: Settings },
    { to: "/admin/users", label: "Manage Users", icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Top Navigation Header - Backroads Style */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center h-14 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mr-8">
            <div className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center border border-primary-foreground/20">
              <svg 
                viewBox="0 0 24 24" 
                className="w-6 h-6 text-primary-foreground"
                fill="currentColor"
              >
                <path d="M21.5 12c0-1.5-.5-2.9-1.3-4.1l-2.6 2.6c.2.5.4 1 .4 1.5 0 2.2-1.8 4-4 4-.5 0-1-.1-1.5-.4l-2.6 2.6c1.2.8 2.6 1.3 4.1 1.3 4.1 0 7.5-3.4 7.5-7.5zM14 12c0-1.1-.9-2-2-2-.2 0-.4 0-.6.1l-2.5-2.5C9.6 7.2 10.3 7 11 7c2.8 0 5 2.2 5 5 0 .7-.2 1.4-.4 2l-2.5-2.5c.1-.2.1-.4.1-.6zM2.5 4.3l2.5 2.5c-1.4 1.4-2.4 3.2-2.8 5.2h3c.4-1.2 1-2.2 1.9-3.1l1.4 1.4c-.8.8-1.3 2-1.3 3.2 0 2.8 2.2 5 5 5 1.2 0 2.4-.5 3.2-1.3l2.6 2.6 1.4-1.4L3.9 2.9 2.5 4.3z"/>
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">Backroads Ops</span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname === item.to
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            
            {/* Admin Dropdown - simplified for now */}
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
                  <Settings className="h-4 w-4" />
                  Admin
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 bg-card rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                        location.pathname === item.to
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
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
