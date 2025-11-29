import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface RequestDetail {
  id: string;
  status: string;
  delivery_region: string;
  required_by_date: string;
  notes: string | null;
  created_at: string;
  line_items: Array<{
    id: string;
    quantity: number;
    equipment_items: {
      name: string;
      sku: string;
      image_url: string | null;
    };
  }>;
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    const { data, error } = await supabase
      .from("equipment_requests")
      .select(`
        *,
        equipment_request_line_items(
          id,
          quantity,
          equipment_items(name, sku, image_url)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error loading request",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRequest(data as any);
      setStatus(data.status);
    }
  };

  const updateStatus = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("equipment_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: "Request status has been updated successfully",
      });
      loadRequest();
    }
    setSaving(false);
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
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Request Details</h1>
          <p className="text-muted-foreground">#{request.id.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requested Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.line_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    {item.equipment_items.image_url ? (
                      <img
                        src={item.equipment_items.image_url}
                        alt={item.equipment_items.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.equipment_items.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.equipment_items.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className="mt-1">
                  {request.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Region</p>
                <p className="font-medium">{request.delivery_region}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Required By</p>
                <p className="font-medium">
                  {new Date(request.required_by_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              {request.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={updateStatus}
                disabled={saving || status === request.status}
                className="w-full"
              >
                {saving ? "Saving..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
