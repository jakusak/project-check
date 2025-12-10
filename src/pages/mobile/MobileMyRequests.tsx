import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface RequestWithItems {
  id: string;
  created_at: string;
  status: string;
  opx_status: string | null;
  ops_area: string | null;
  required_by_date: string;
  rationale: string | null;
  line_items: {
    id: string;
    quantity: number;
    equipment: { name: string; sku: string } | null;
  }[];
}

export default function MobileMyRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests-mobile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_requests")
        .select(`
          id,
          created_at,
          status,
          opx_status,
          ops_area,
          required_by_date,
          rationale,
          line_items:equipment_request_line_items(
            id,
            quantity,
            equipment:equipment_items(name, sku)
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RequestWithItems[];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string, opxStatus: string | null) => {
    const displayStatus = opxStatus || status;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      pending_opx: "secondary",
      opx_approved: "default",
      opx_rejected: "destructive",
      approved: "default",
      rejected: "destructive",
      fulfilled: "default",
    };

    const labels: Record<string, string> = {
      pending: "Pending",
      pending_opx: "Pending Review",
      opx_approved: "Approved",
      opx_rejected: "Rejected",
      approved: "Approved",
      rejected: "Rejected",
      fulfilled: "Fulfilled",
    };

    return (
      <Badge variant={variants[displayStatus] || "secondary"}>
        {labels[displayStatus] || displayStatus}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Requests</h1>
        <Button size="sm" onClick={() => navigate("/m/requests/new")}>
          New Request
        </Button>
      </div>

      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No requests yet</p>
            <Button className="mt-4" onClick={() => navigate("/m/requests/new")}>
              Create Your First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/my-requests`)} // Navigate to desktop detail for now
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(request.status, request.opx_status)}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium truncate">
                      {request.ops_area || "No area"}
                    </p>
                    
                    <p className="text-sm text-muted-foreground">
                      {request.line_items.length} item(s) • Due {format(new Date(request.required_by_date), "MMM d")}
                    </p>

                    {request.line_items.slice(0, 2).map((item) => (
                      <p key={item.id} className="text-xs text-muted-foreground truncate">
                        • {item.equipment?.name || "Unknown"} x{item.quantity}
                      </p>
                    ))}
                    {request.line_items.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{request.line_items.length - 2} more
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full mt-6 h-12"
        onClick={() => navigate("/m/home")}
      >
        Back to Home
      </Button>
    </div>
  );
}
