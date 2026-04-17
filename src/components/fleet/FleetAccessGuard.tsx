import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useFleetAccess } from "@/lib/auth/useFleetAccess";
import { Button } from "@/components/ui/button";

interface FleetAccessGuardProps {
  children: ReactNode;
}

/**
 * Restricts the Fleet Violations section to super_admins or users
 * explicitly listed in fleet_access_allowlist.
 */
export function FleetAccessGuard({ children }: FleetAccessGuardProps) {
  const { hasAccess, loading } = useFleetAccess();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Checking access…</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Restricted Section</h1>
          <p className="text-muted-foreground">
            The Fleet Violations module is limited to authorized users.
            If you need access, please contact an administrator.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
