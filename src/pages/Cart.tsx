import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  item: {
    id: string;
    name: string;
    sku: string;
    category: string;
    image_url: string | null;
  };
  quantity: number;
  reason: string;
}

interface OpsArea {
  ops_area: string;
  hub: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [opsAreas, setOpsAreas] = useState<OpsArea[]>([]);
  const [selectedOpsArea, setSelectedOpsArea] = useState("");
  const [requiredByDate, setRequiredByDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem("equipment_cart");
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      // Ensure all items have reason field
      setCart(parsedCart.map((item: CartItem) => ({
        ...item,
        reason: item.reason || ""
      })));
    }
    loadOpsAreas();
  }, []);

  const loadOpsAreas = async () => {
    const { data, error } = await supabase
      .from("ops_area_to_hub")
      .select("*")
      .order("ops_area");
    
    if (error) {
      toast({
        title: "Error loading ops areas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOpsAreas(data || []);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = cart.map((item) =>
      item.item.id === itemId ? { ...item, quantity } : item
    );
    setCart(updated);
    localStorage.setItem("equipment_cart", JSON.stringify(updated));
  };

  const updateReason = (itemId: string, reason: string) => {
    const updated = cart.map((item) =>
      item.item.id === itemId ? { ...item, reason } : item
    );
    setCart(updated);
    localStorage.setItem("equipment_cart", JSON.stringify(updated));
  };

  const removeItem = (itemId: string) => {
    const updated = cart.filter((item) => item.item.id !== itemId);
    setCart(updated);
    localStorage.setItem("equipment_cart", JSON.stringify(updated));
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOpsArea || !requiredByDate) {
      toast({
        title: "Missing required fields",
        description: "Please select an Ops Area and required date",
        variant: "destructive",
      });
      return;
    }

    // Validate all items have reasons
    const missingReasons = cart.filter(item => !item.reason.trim());
    if (missingReasons.length > 0) {
      toast({
        title: "Missing reasons",
        description: "Please provide a reason for each item in your request",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find the hub for selected ops area
      const selectedArea = opsAreas.find(area => area.ops_area === selectedOpsArea);
      const hub = selectedArea?.hub || "";

      const { data: request, error: requestError } = await supabase
        .from("equipment_requests")
        .insert({
          user_id: user?.id,
          status: "pending",
          ops_area: selectedOpsArea,
          hub: hub,
          delivery_region: selectedOpsArea, // Keep for backward compatibility
          required_by_date: requiredByDate,
          notes,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const lineItems = cart.map((item) => ({
        request_id: request.id,
        equipment_id: item.item.id,
        quantity: item.quantity,
        reason: item.reason,
        approval_status: "pending",
      }));

      const { error: lineItemsError } = await supabase
        .from("equipment_request_line_items")
        .insert(lineItems);

      if (lineItemsError) throw lineItemsError;

      localStorage.removeItem("equipment_cart");
      toast({
        title: "Request submitted",
        description: "Your equipment request has been submitted successfully",
      });
      navigate("/my-requests");
    } catch (error: any) {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Request Cart</h1>
        <p className="text-muted-foreground">Review and submit your equipment request</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items in Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-muted-foreground">Your cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.item.id}
                    className="flex flex-col gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.item.image_url ? (
                          <img
                            src={item.item.image_url}
                            alt={item.item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.item.sku}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {item.item.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.item.id, parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                        <Button
                          variant="destructive"
                          onClick={() => removeItem(item.item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`reason-${item.item.id}`}>
                        Reason for Request *
                      </Label>
                      <Input
                        id={`reason-${item.item.id}`}
                        value={item.reason}
                        onChange={(e) => updateReason(item.item.id, e.target.value)}
                        placeholder="Why do you need this item?"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ops-area">Ops Area *</Label>
                  <Select value={selectedOpsArea} onValueChange={setSelectedOpsArea} required>
                    <SelectTrigger id="ops-area">
                      <SelectValue placeholder="Select Ops Area" />
                    </SelectTrigger>
                    <SelectContent>
                      {opsAreas.map((area) => (
                        <SelectItem key={area.ops_area} value={area.ops_area}>
                          {area.ops_area} → {area.hub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Required By Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={cart.length === 0 || loading}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
