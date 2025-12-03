import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X } from "lucide-react";

interface LineItem {
  id: string;
  equipment_id: string;
  quantity: number;
  reason: string;
  approval_status: string;
  decline_reason: string | null;
  equipment_items: {
    name: string;
    sku: string;
    category: string;
  };
}

interface RequestDetail {
  id: string;
  status: string;
  ops_area: string;
  hub: string;
  required_by_date: string;
  notes: string | null;
  created_at: string;
  user_id: string;
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [declineReasons, setDeclineReasons] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequestDetails();
    }
  }, [id]);

  const loadRequestDetails = async () => {
    const { data: requestData, error: requestError } = await supabase
      .from("equipment_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (requestError) {
      toast({
        title: "Error loading request",
        description: requestError.message,
        variant: "destructive",
      });
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("equipment_request_line_items")
      .select(`
        *,
        equipment_items (
          name,
          sku,
          category
        )
      `)
      .eq("request_id", id);

    if (itemsError) {
      toast({
        title: "Error loading items",
        description: itemsError.message,
        variant: "destructive",
      });
      return;
    }

    setRequest(requestData as any);
    setLineItems(itemsData || []);
  };

  const handleApprove = async (itemId: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("equipment_request_line_items")
        .update({
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          decline_reason: null,
        })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Item approved",
        description: "The item has been approved successfully",
      });

      loadRequestDetails();
    } catch (error: any) {
      toast({
        title: "Error approving item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async (itemId: string) => {
    const reason = declineReasons[itemId];
    if (!reason || !reason.trim()) {
      toast({
        title: "Decline reason required",
        description: "Please provide a reason for declining this item",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("equipment_request_line_items")
        .update({
          approval_status: "declined",
          decline_reason: reason,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Item declined",
        description: "The item has been declined",
      });

      loadRequestDetails();
      setDeclineReasons({ ...declineReasons, [itemId]: "" });
    } catch (error: any) {
      toast({
        title: "Error declining item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "declined":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!request) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/requests")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Request Details</h1>
          <p className="text-muted-foreground font-mono">#{request.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Request submitted from OPS Area:</span>
              <p className="font-medium">{request.ops_area || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">HUB:</span>
              <p className="font-medium">{request.hub || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Required By:</span>
              <p className="font-medium">
                {new Date(request.required_by_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="mt-1">
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status}
                </Badge>
              </div>
            </div>
            {request.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notes:</span>
                <p className="font-medium">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Submitted:</span>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">User ID:</span>
              <p className="font-mono text-sm">{request.user_id.slice(0, 8)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requested Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.equipment_items.name}
                    </TableCell>
                    <TableCell>{item.equipment_items.sku}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.equipment_items.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm">{item.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.approval_status)}>
                        {item.approval_status}
                      </Badge>
                      {item.decline_reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.decline_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.approval_status === "pending" && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(item.id)}
                              disabled={isLoading}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDecline(item.id)}
                              disabled={isLoading || !declineReasons[item.id]?.trim()}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                          <Input
                            placeholder="Decline reason (required)"
                            value={declineReasons[item.id] || ""}
                            onChange={(e) =>
                              setDeclineReasons({
                                ...declineReasons,
                                [item.id]: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
