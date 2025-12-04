import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClipboardList, CheckCircle, XCircle, Edit, Clock } from "lucide-react";
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
  ops_area: string;
  hub: string;
  notes: string | null;
  required_by_date: string;
  delivery_region: string;
  user_id: string;
  line_items: LineItem[];
}

export default function OPXDashboard() {
  const { user, isOPX, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({});
  const [opxNotes, setOpxNotes] = useState("");

  // Fetch assigned OPS Areas for this OPX user
  const { data: assignedAreas } = useQuery({
    queryKey: ["opx-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opx_area_assignments")
        .select("ops_area")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data.map(a => a.ops_area);
    },
    enabled: !!user && (isOPX || isAdmin),
  });

  // Fetch pending requests for assigned areas
  const { data: requests, isLoading } = useQuery({
    queryKey: ["opx-requests", assignedAreas],
    queryFn: async () => {
      if (!assignedAreas || assignedAreas.length === 0) return [];
      
      const { data, error } = await supabase
        .from("equipment_requests")
        .select(`
          *,
          line_items:equipment_request_line_items(
            *,
            equipment_items(name, sku, category)
          )
        `)
        .in("ops_area", assignedAreas)
        .eq("opx_status", "pending_opx")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Request[];
    },
    enabled: !!assignedAreas && assignedAreas.length > 0,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      action, 
      quantities, 
      notes 
    }: { 
      requestId: string; 
      action: 'approve' | 'reject'; 
      quantities: Record<string, number>;
      notes: string;
    }) => {
      // Update line item quantities if modified
      for (const [itemId, newQty] of Object.entries(quantities)) {
        const originalItem = selectedRequest?.line_items.find(li => li.id === itemId);
        if (originalItem && originalItem.quantity !== newQty) {
          await supabase
            .from("equipment_request_line_items")
            .update({ 
              quantity: newQty,
              original_quantity: originalItem.original_quantity || originalItem.quantity,
              modified_by_opx: user?.id
            })
            .eq("id", itemId);
        }
      }

      // Update request status
      const { error } = await supabase
        .from("equipment_requests")
        .update({
          opx_status: action === 'approve' ? 'opx_approved' : 'opx_rejected',
          opx_reviewed_by: user?.id,
          opx_reviewed_at: new Date().toISOString(),
          opx_notes: notes || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Create notification for requester
      await supabase.from("notifications").insert({
        user_id: selectedRequest?.user_id,
        title: action === 'approve' ? 'Request Approved by OPX' : 'Request Rejected by OPX',
        message: action === 'approve' 
          ? `Your equipment request for ${selectedRequest?.ops_area} has been approved and forwarded to the Hub.`
          : `Your equipment request for ${selectedRequest?.ops_area} was rejected. ${notes ? `Reason: ${notes}` : ''}`,
        type: action === 'approve' ? 'success' : 'error',
        link: '/my-requests',
      });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["opx-requests"] });
      toast.success(action === 'approve' ? "Request approved and forwarded to Hub" : "Request rejected");
      setSelectedRequest(null);
      setEditingQuantities({});
      setOpxNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to process request: ${error.message}`);
    },
  });

  const openReviewDialog = (request: Request) => {
    setSelectedRequest(request);
    const quantities: Record<string, number> = {};
    request.line_items.forEach(item => {
      quantities[item.id] = item.quantity;
    });
    setEditingQuantities(quantities);
    setOpxNotes("");
  };

  const handleQuantityChange = (itemId: string, value: number) => {
    setEditingQuantities(prev => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  if (authLoading) {
    return <div className="p-6 flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isOPX && !isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          OPX Review Dashboard
        </h1>
        <p className="text-muted-foreground">
          Review and approve equipment requests from Field Staff
        </p>
        {assignedAreas && assignedAreas.length > 0 && (
          <div className="flex gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Your areas:</span>
            {assignedAreas.map(area => (
              <Badge key={area} variant="secondary">{area}</Badge>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Review
          </CardTitle>
          <CardDescription>
            Equipment requests waiting for your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading requests...</p>
          ) : !requests || requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No pending requests for your assigned areas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>OPS Area</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Hub</TableHead>
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
                    <TableCell>{request.hub}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openReviewDialog(request)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
            <DialogDescription>
              Review items and modify quantities if needed before approving or rejecting.
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

              {selectedRequest.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Request Notes:</span>
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
                    <TableHead>Quantity</TableHead>
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
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={editingQuantities[item.id] || 0}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        {item.original_quantity && item.original_quantity !== editingQuantities[item.id] && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (was {item.original_quantity})
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-2">
                <label className="text-sm font-medium">OPX Notes (optional)</label>
                <Textarea
                  placeholder="Add notes for this decision..."
                  value={opxNotes}
                  onChange={(e) => setOpxNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && reviewMutation.mutate({
                requestId: selectedRequest.id,
                action: 'reject',
                quantities: editingQuantities,
                notes: opxNotes,
              })}
              disabled={reviewMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => selectedRequest && reviewMutation.mutate({
                requestId: selectedRequest.id,
                action: 'approve',
                quantities: editingQuantities,
                notes: opxNotes,
              })}
              disabled={reviewMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve & Forward to Hub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
