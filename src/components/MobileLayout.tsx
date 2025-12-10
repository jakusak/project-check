import { Outlet, useNavigate } from "react-router-dom";
import { Home, AlertTriangle, Package, ClipboardList, Wrench, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/m/home" },
  { icon: AlertTriangle, label: "Incidents", path: "/m/van-incidents/new" },
  { icon: Package, label: "Inventory", path: "/m/requests/new" },
  { icon: ClipboardList, label: "Count", path: "/m/cycle-counts/new" },
  { icon: Wrench, label: "Broken", path: "/m/broken-items/new" },
];

export default function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">Backroads Field</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
