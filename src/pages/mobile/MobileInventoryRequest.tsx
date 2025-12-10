import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { useCreateRequestEvent } from "@/hooks/useRequestEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, CalendarIcon, Plus, Trash2, Loader2, Search, ScanBarcode } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MobileBarcodeScanner from "@/components/mobile/MobileBarcodeScanner";

interface EquipmentItem {
  id: string;
  name: string;
  sku: string;
  category: string;
}

interface LineItem {
  equipment: EquipmentItem;
  quantity: number;
  reason: string;
}

interface OpsArea {
  ops_area: string;
  hub: string;
}

const REASON_OPTIONS = [
  "Need more standard inventory equipment",
  "We ran out of this item",
  "Item is lost",
  "Item was not delivered to the OPS Area",
  "Item is broken/non re-usable",
];

export default function MobileInventoryRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createEvent = useCreateRequestEvent();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Step 1: Ops Area
  const [opsAreas, setOpsAreas] = useState<OpsArea[]>([]);
  const [selectedOpsArea, setSelectedOpsArea] = useState("");
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Step 2: Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);

  const handleScanResult = (scannedValue: string) => {
    setShowScanner(false);
    const equipment = equipmentList.find(
      e => e.sku.toLowerCase() === scannedValue.toLowerCase()
    );
    if (equipment) {
      addLineItem(equipment);
      toast({ title: `Found: ${equipment.name}` });
    } else {
      toast({ title: `No item found for: ${scannedValue}`, variant: "destructive" });
      setSearchQuery(scannedValue);
      setShowEquipmentPicker(true);
    }
  };

  // Scanner modal
  if (showScanner) {
    return (
      <MobileBarcodeScanner
        title="Scan Item"
        onScanSuccess={handleScanResult}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  // Step 3: Details
  const [rationale, setRationale] = useState("");
  const [requiredByDate, setRequiredByDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadAssignedAreas();
    loadEquipment();
  }, [user?.id]);

  const loadAssignedAreas = async () => {
    if (!user?.id) return;
    setLoadingAreas(true);

    try {
      const { data: assignments } = await supabase
        .from("opx_area_assignments")
        .select("ops_area")
        .eq("user_id", user.id);

      if (assignments && assignments.length > 0) {
        const assignedOpsAreas = assignments.map((a) => a.ops_area);

        const { data: areas } = await supabase
          .from("ops_area_to_hub")
          .select("ops_area, hub")
          .in("ops_area", assignedOpsAreas)
          .order("ops_area");

        if (areas) {
          setOpsAreas(areas);
          if (areas.length === 1) {
            setSelectedOpsArea(areas[0].ops_area);
          }
        }
      }
    } catch (error) {
      console.error("Error loading areas:", error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const { data } = await supabase
        .from("equipment_items")
        .select("id, name, sku, category")
        .eq("availability", true)
        .order("name");

      if (data) {
        setEquipmentList(data);
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
  };

  const filteredEquipment = equipmentList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addLineItem = (equipment: EquipmentItem) => {
    // Check if already added
    if (lineItems.some((li) => li.equipment.id === equipment.id)) {
      toast({ title: "Item already added", variant: "destructive" });
      return;
    }
    setLineItems([...lineItems, { equipment, quantity: 1, reason: "" }]);
    setShowEquipmentPicker(false);
    setSearchQuery("");
  };

  const updateLineItem = (index: number, field: "quantity" | "reason", value: number | string) => {
    const updated = [...lineItems];
    if (field === "quantity") {
      updated[index].quantity = value as number;
    } else {
      updated[index].reason = value as string;
    }
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1 && !selectedOpsArea) {
      toast({ title: "Please select an Operations Area", variant: "destructive" });
      return false;
    }
    if (stepNum === 2) {
      if (lineItems.length === 0) {
        toast({ title: "Please add at least one item", variant: "destructive" });
        return false;
      }
      const missingReason = lineItems.some((li) => !li.reason);
      if (missingReason) {
        toast({ title: "Please select a reason for each item", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!rationale.trim()) {
      toast({ title: "Please enter a rationale", variant: "destructive" });
      return;
    }
    if (!requiredByDate) {
      toast({ title: "Please select a required-by date", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedArea = opsAreas.find((a) => a.ops_area === selectedOpsArea);

      const { data: request, error: requestError } = await supabase
        .from("equipment_requests")
        .insert({
          user_id: user?.id,
          status: "pending",
          ops_area: selectedOpsArea,
          hub: selectedArea?.hub || "",
          delivery_region: selectedOpsArea,
          required_by_date: format(requiredByDate, "yyyy-MM-dd"),
          rationale,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const items = lineItems.map((li) => ({
        request_id: request.id,
        equipment_id: li.equipment.id,
        quantity: li.quantity,
        reason: li.reason,
        approval_status: "pending",
      }));

      const { error: lineItemsError } = await supabase
        .from("equipment_request_line_items")
        .insert(items);

      if (lineItemsError) throw lineItemsError;

      await createEvent.mutateAsync({
        requestId: request.id,
        eventType: "created",
        eventNotes: `Request submitted with ${lineItems.length} items. Rationale: ${rationale}`,
        newValues: {
          items: lineItems.map((li) => ({ name: li.equipment.name, quantity: li.quantity })),
          requiredByDate: format(requiredByDate, "yyyy-MM-dd"),
        },
      });

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Request Submitted</h1>
        <p className="text-muted-foreground mb-8">
          Your inventory request has been submitted for review.
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => navigate("/m/requests/my")}
          >
            View My Requests
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg"
            onClick={() => navigate("/m/home")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <h1 className="text-xl font-bold mb-2">Request Inventory</h1>
      <p className="text-sm text-muted-foreground mb-4">Step {step} of 3</p>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step 1: Select Ops Area */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <Label className="text-base font-medium">Operations Area *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select where the equipment should be delivered
              </p>
              {loadingAreas ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your assigned areas...
                </div>
              ) : opsAreas.length === 0 ? (
                <p className="text-sm text-destructive">
                  You are not assigned to any Operations Areas.
                </p>
              ) : (
                <Select value={selectedOpsArea} onValueChange={setSelectedOpsArea}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {opsAreas.map((area) => (
                      <SelectItem key={area.ops_area} value={area.ops_area} className="text-base py-3">
                        {area.ops_area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={nextStep}
            disabled={!selectedOpsArea}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Add Line Items */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Equipment picker */}
          {showEquipmentPicker ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredEquipment.slice(0, 20).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addLineItem(item)}
                      className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.sku} • {item.category}
                      </div>
                    </button>
                  ))}
                  {filteredEquipment.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No items found</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowEquipmentPicker(false);
                    setSearchQuery("");
                  }}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Added items */}
              {lineItems.map((li, index) => (
                <Card key={li.equipment.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{li.equipment.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {li.equipment.sku}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={li.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                          className="h-12 text-base mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Reason *</Label>
                        <Select
                          value={li.reason}
                          onValueChange={(v) => updateLineItem(index, "reason", v)}
                        >
                          <SelectTrigger className="h-12 text-sm mt-1">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {REASON_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-sm">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add item buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-base border-dashed"
                  onClick={() => setShowScanner(true)}
                >
                  <ScanBarcode className="h-5 w-5 mr-2" />
                  Scan Item
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-base border-dashed"
                  onClick={() => setShowEquipmentPicker(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 h-14" onClick={prevStep}>
                  Back
                </Button>
                <Button
                  className="flex-1 h-14 text-lg"
                  onClick={nextStep}
                  disabled={lineItems.length === 0}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Details & Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-base font-medium">Rationale *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Explain why this equipment is needed
                </p>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Enter your rationale..."
                  className="min-h-[100px] text-base"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Needed By *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  When do you need this equipment?
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal text-base",
                        !requiredByDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
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
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Summary</h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Area:</span> {selectedOpsArea}
                </p>
                <p>
                  <span className="font-medium text-foreground">Items:</span> {lineItems.length} item(s)
                </p>
                {lineItems.map((li) => (
                  <p key={li.equipment.id} className="pl-4">
                    • {li.equipment.name} x {li.quantity}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 h-14" onClick={prevStep}>
              Back
            </Button>
            <Button
              className="flex-1 h-14 text-lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !rationale.trim() || !requiredByDate}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
