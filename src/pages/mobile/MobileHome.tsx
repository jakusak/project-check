import { useNavigate } from "react-router-dom";
import { AlertTriangle, Package, ClipboardList, Wrench, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    icon: AlertTriangle,
    label: "Report Accident",
    description: "Log a van incident",
    path: "/m/van-incidents/new",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  {
    icon: Package,
    label: "Request Inventory",
    description: "Submit equipment request",
    path: "/m/requests/new",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    icon: ClipboardList,
    label: "Cycle Count",
    description: "Record inventory count",
    path: "/m/cycle-counts/new",
    color: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20",
  },
  {
    icon: Wrench,
    label: "Report Broken Item",
    description: "Flag damaged equipment",
    path: "/m/broken-items/new",
    color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
  },
  {
    icon: Bike,
    label: "Assign Bike",
    description: "Link bike to guest",
    path: "/m/tps/assign-bikes",
    color: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20",
  },
];

export default function MobileHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quick Actions</h1>
        <p className="text-muted-foreground text-sm mt-1">What do you need to do?</p>
      </div>

      <div className="grid gap-3">
        {actions.map((action) => (
          <Button
            key={action.path}
            variant="ghost"
            onClick={() => navigate(action.path)}
            className={`w-full h-auto py-5 px-4 flex items-center justify-start gap-4 rounded-xl border border-border ${action.color}`}
          >
            <div className="p-3 rounded-full bg-background">
              <action.icon className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">{action.label}</div>
              <div className="text-xs opacity-80">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
