import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Warehouse, CheckCircle, XCircle, Eye, Package } from "lucide-react";
import { format } from "date-fns";

interface LineItem {
  id: string;
  equipment_id: string;
  quantity: number;
  original_quantity: number | null;
  reason: string | null;
  approval_status: string;
  equipment_items: {
    name: string;
    sku: string;
    category: string;
  };
}

interface Request {
  id: string;
  created_at: string;
  status: string;
  opx_status: string;
  opx_notes: string | null;
  opx_reviewed_at: string | null;
  ops_area: string;
  hub: string;
  notes: string | null;
  required_by_date: string;
  delivery_region: string;
  user_id: string;
  line_items: LineItem[];
}

export default function HubDashboard() {
  const { user, isHubAdmin, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Fetch assigned Hubs for this Hub Admin user
  const { data: assignedHubs } = useQuery({
    queryKey: ["hub-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hub_admin_assignments")
        .select("hub")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data.map(a => a.hub);
    },
    enabled: !!user && (isHubAdmin || isAdmin),
  });

  // Fetch OPX-approved requests for assigned hubs
  const { data: requests, isLoading } = useQuery({
    queryKey: ["hub-requests", assignedHubs],
    queryFn: async () => {
      if (!assignedHubs || assignedHubs.length === 0) return [];
      
      const { data, error } = await supabase
        .from("equipment_requests")
        .select(`
          *,
          line_items:equipment_request_line_items(
            *,
            equipment_items(name, sku, category)
          )
        `)
        .in("hub", assignedHubs)
        .eq("opx_status", "opx_approved")
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Request[];
    },
    enabled: !!assignedHubs && assignedHubs.length > 0,
  });

  const fulfillMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      action,
      reason
    }: { 
      requestId: string; 
      action: 'fulfill' | 'decline';
      reason?: string;
    }) => {
      // Update request status
      const { error } = await supabase
        .from("equipment_requests")
        .update({
          status: action === 'fulfill' ? 'fulfilled' : 'declined',
        })
        .eq("id", requestId);

      if (error) throw error;

      // Update all line items
      await supabase
        .from("equipment_request_line_items")
        .update({
          approval_status: action === 'fulfill' ? 'approved' : 'declined',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          decline_reason: action === 'decline' ? reason : null,
        })
        .eq("request_id", requestId);

      // Create notification for requester using secure RPC function
      await supabase.rpc('create_notification', {
        _user_id: selectedRequest?.user_id,
        _title: action === 'fulfill' ? 'Request Fulfilled' : 'Request Declined by Hub',
        _message: action === 'fulfill' 
          ? `Your equipment request for ${selectedRequest?.ops_area} has been fulfilled and is being prepared.`
          : `Your equipment request for ${selectedRequest?.ops_area} was declined by the Hub. ${reason ? `Reason: ${reason}` : ''}`,
        _type: action === 'fulfill' ? 'success' : 'error',
        _link: '/my-requests',
      });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["hub-requests"] });
      toast.success(action === 'fulfill' ? "Request marked as fulfilled" : "Request declined");
      setSelectedRequest(null);
      setDeclineReason("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to process request: ${error.message}`);
    },
  });

  if (authLoading) {
    return <div className="p-6 flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isHubAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'approved': return <Badge variant="default">Approved</Badge>;
      case 'fulfilled': return <Badge className="bg-green-600">Fulfilled</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          Hub Fulfillment Dashboard
        </h1>
        <p className="text-muted-foreground">
          Process and fulfill OPX-approved equipment requests
        </p>
        {assignedHubs && assignedHubs.length > 0 && (
          <div className="flex gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Your hubs:</span>
            {assignedHubs.map(hub => (
              <Badge key={hub} variant="secondary">{hub}</Badge>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Requests Ready for Fulfillment
          </CardTitle>
          <CardDescription>
            OPX-approved requests waiting to be processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading requests...</p>
          ) : !requests || requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No pending requests for your assigned hubs.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>OPS Area</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OPX Approved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.ops_area}</Badge>
                    </TableCell>
                    <TableCell>{request.line_items.length} items</TableCell>
                    <TableCell>
                      <Badge variant={request.required_by_date === "Urgent" ? "destructive" : "secondary"}>
                        {request.required_by_date}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.opx_reviewed_at 
                        ? format(new Date(request.opx_reviewed_at), "MMM d") 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setSelectedRequest(request)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Review and fulfill this equipment request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">OPS Area:</span>
                  <span className="ml-2 font-medium">{selectedRequest.ops_area}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hub:</span>
                  <span className="ml-2 font-medium">{selectedRequest.hub}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Urgency:</span>
                  <Badge className="ml-2" variant={selectedRequest.required_by_date === "Urgent" ? "destructive" : "secondary"}>
                    {selectedRequest.required_by_date}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Region:</span>
                  <span className="ml-2 font-medium">{selectedRequest.delivery_region}</span>
                </div>
              </div>

              {selectedRequest.opx_notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-sm font-medium text-blue-800">OPX Notes:</span>
                  <p className="text-sm mt-1 text-blue-700">{selectedRequest.opx_notes}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Requester Notes:</span>
                  <p className="text-sm mt-1">{selectedRequest.notes}</p>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Original Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRequest.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.equipment_items.name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.equipment_items.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.equipment_items.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.reason || "-"}</TableCell>
                      <TableCell className="font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.original_quantity && item.original_quantity !== item.quantity 
                          ? item.original_quantity 
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Decline Reason (if declining)</label>
                  <Textarea
                    placeholder="Enter reason for declining..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => fulfillMutation.mutate({
                    requestId: selectedRequest.id,
                    action: 'decline',
                    reason: declineReason,
                  })}
                  disabled={fulfillMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button
                  onClick={() => fulfillMutation.mutate({
                    requestId: selectedRequest.id,
                    action: 'fulfill',
                  })}
                  disabled={fulfillMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as Fulfilled
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
