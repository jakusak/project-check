import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Home, Package, ClipboardList, Settings, LogOut, Truck, BoxIcon, Warehouse, Users } from "lucide-react";

export default function Layout() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
    { to: "/equipment", label: "Equipment Catalog", icon: Package },
    { to: "/my-requests", label: "My Requests", icon: ClipboardList },
  ];

  const adminNavItems = [
    { to: "/admin/requests", label: "All Requests", icon: ClipboardList },
    { to: "/admin/equipment", label: "Manage Equipment", icon: Settings },
    { to: "/admin/users", label: "Manage Users", icon: Users },
  ];

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-60 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-bold text-lg">Backroads Ops</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant={location.pathname === item.to ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 text-xs text-muted-foreground font-semibold">
                ADMIN
              </div>
              {adminNavItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname === item.to ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
