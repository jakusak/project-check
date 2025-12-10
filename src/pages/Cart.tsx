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
import { useRegion, REGION_LABELS, REGION_HUBS, Region } from "@/contexts/RegionContext";
import { useCreateRequestEvent } from "@/hooks/useRequestEvents";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  region?: Region;
}

interface OpsArea {
  ops_area: string;
  hub: string;
  region: string | null;
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedRegion, clearRegion } = useRegion();
  
  const reasonOptions = [
    "Need more standard inventory equipment",
    "We ran out of this item",
    "Item is lost",
    "Item was not delivered to the OPS Area",
    "Item is broken/non re-usable",
  ];
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [assignedAreas, setAssignedAreas] = useState<OpsArea[]>([]);
  const [selectedOpsArea, setSelectedOpsArea] = useState("");
  const [urgency, setUrgency] = useState("");
  const [notes, setNotes] = useState("");
  const [rationale, setRationale] = useState("");
  const [requiredByDate, setRequiredByDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const createEvent = useCreateRequestEvent();

  useEffect(() => {
    const storedCart = localStorage.getItem("equipment_cart");
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      setCart(parsedCart.map((item: CartItem) => ({
        ...item,
        reason: item.reason || ""
      })));
    }
    loadAssignedAreas();
  }, [user?.id]);

  const loadAssignedAreas = async () => {
    if (!user?.id) return;
    
    setLoadingAreas(true);
    try {
      // Get OPX's assigned areas
      const { data: assignments, error: assignError } = await supabase
        .from("opx_area_assignments")
        .select("ops_area")
        .eq("user_id", user.id);
      
      if (assignError) throw assignError;
      
      if (!assignments || assignments.length === 0) {
        setAssignedAreas([]);
        setLoadingAreas(false);
        return;
      }
      
      const assignedOpsAreas = assignments.map(a => a.ops_area);
      
      // Get hub mappings for assigned areas, filtered by selected region
      let query = supabase
        .from("ops_area_to_hub")
        .select("*")
        .in("ops_area", assignedOpsAreas)
        .order("ops_area");
      
      if (selectedRegion) {
        query = query.eq("region", selectedRegion);
      }
      
      const { data: areas, error: areasError } = await query;
      
      if (areasError) throw areasError;
      
      setAssignedAreas(areas || []);
      
      // Auto-select if only one area
      if (areas && areas.length === 1) {
        setSelectedOpsArea(areas[0].ops_area);
      } else if (selectedOpsArea && areas && !areas.some(a => a.ops_area === selectedOpsArea)) {
        setSelectedOpsArea("");
      }
    } catch (error: any) {
      toast({
        title: "Error loading assigned areas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAreas(false);
    }
  };

  // Reload areas when region changes
  useEffect(() => {
    if (user?.id) {
      loadAssignedAreas();
    }
  }, [selectedRegion]);

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

  // Determine the hub based on region
  const getHubForRequest = (): string => {
    if (!selectedRegion) return "";
    
    // For non-Europe regions, use the fixed hub
    const fixedHub = REGION_HUBS[selectedRegion];
    if (fixedHub) {
      return fixedHub;
    }
    
    // For Europe, get hub from selected OPS Area
    const selectedArea = assignedAreas.find(area => area.ops_area === selectedOpsArea);
    return selectedArea?.hub || "";
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOpsArea || !urgency || !rationale.trim() || !requiredByDate) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields including rationale and required-by date",
        variant: "destructive",
      });
      return;
    }

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
      const hub = getHubForRequest();

      const { data: request, error: requestError } = await supabase
        .from("equipment_requests")
        .insert({
          user_id: user?.id,
          status: "pending",
          ops_area: selectedOpsArea,
          hub: hub,
          delivery_region: selectedRegion || selectedOpsArea,
          required_by_date: format(requiredByDate, "yyyy-MM-dd"),
          notes,
          rationale,
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

      // Create the initial "created" event
      await createEvent.mutateAsync({
        requestId: request.id,
        eventType: "created",
        eventNotes: `Request submitted with ${cart.length} items. Rationale: ${rationale}`,
        newValues: {
          items: cart.map(c => ({ name: c.item.name, quantity: c.quantity })),
          urgency,
          requiredByDate: format(requiredByDate, "yyyy-MM-dd"),
        },
      });

      localStorage.removeItem("equipment_cart");
      clearRegion();
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

  // Check if this region has a single hub (auto-assigned)
  const isAutoHub = selectedRegion && REGION_HUBS[selectedRegion] !== null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Request Cart</h1>
        <p className="text-muted-foreground">Review and submit your equipment request</p>
      </div>

      {/* Region Indicator */}
      {selectedRegion && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm">Requesting for region:</span>
          <Badge variant="secondary">{REGION_LABELS[selectedRegion]}</Badge>
          {isAutoHub && (
            <span className="text-sm text-muted-foreground ml-2">
              → Fulfilled by: <strong>{REGION_HUBS[selectedRegion]}</strong>
            </span>
          )}
        </div>
      )}

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
                      <Select
                        value={item.reason}
                        onValueChange={(value) => updateReason(item.item.id, value)}
                      >
                        <SelectTrigger id={`reason-${item.item.id}`} className="mt-1">
                          <SelectValue placeholder="Select a reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {reasonOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  {loadingAreas ? (
                    <p className="text-sm text-muted-foreground">Loading your assigned areas...</p>
                  ) : assignedAreas.length === 0 ? (
                    <p className="text-sm text-destructive">You are not assigned to any OPS Areas for this region.</p>
                  ) : (
                    <Select value={selectedOpsArea} onValueChange={setSelectedOpsArea} required>
                      <SelectTrigger id="ops-area">
                        <SelectValue placeholder="Select Ops Area" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedAreas.map((area) => (
                          <SelectItem key={area.ops_area} value={area.ops_area}>
                            {area.ops_area}
                            {!isAutoHub && ` → ${area.hub}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {isAutoHub && selectedOpsArea && (
                    <p className="text-xs text-muted-foreground">
                      Hub automatically assigned: {REGION_HUBS[selectedRegion!]}
                    </p>
                  )}
                  {!isAutoHub && selectedOpsArea && (
                    <p className="text-xs text-muted-foreground">
                      Hub: {assignedAreas.find(a => a.ops_area === selectedOpsArea)?.hub}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rationale">Rationale *</Label>
                  <Textarea
                    id="rationale"
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explain why this equipment is needed..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Required By Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !requiredByDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {requiredByDate ? format(requiredByDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={requiredByDate}
                        onSelect={setRequiredByDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency *</Label>
                  <Select value={urgency} onValueChange={setUrgency} required>
                    <SelectTrigger id="urgency">
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Needed soon">Needed soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={cart.length === 0 || loading || !selectedRegion || assignedAreas.length === 0 || !rationale.trim() || !requiredByDate}
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
