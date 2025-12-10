import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { useCreateCycleCount, uploadCycleCountPhoto } from "@/hooks/useCycleCounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Camera, CheckCircle2, Loader2, Search, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileBarcodeScanner from "@/components/mobile/MobileBarcodeScanner";

interface LineItem {
  id: string;
  equipment_item_id: string | null;
  sku: string;
  equipment_name: string;
  recorded_qty: number;
  notes: string;
  photo_file: File | null;
  photo_preview: string | null;
}

export default function MobileCycleCount() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createCycleCount = useCreateCycleCount();
  
  const [step, setStep] = useState(1);
  const [opsArea, setOpsArea] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [skuSearch, setSkuSearch] = useState("");
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Fetch OPS areas
  const { data: opsAreas, isLoading: areasLoading } = useQuery({
    queryKey: ["ops-areas-mobile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .order("ops_area");
      if (error) throw error;
      return [...new Set(data.map(d => d.ops_area))];
    },
  });

  // Search equipment
  const { data: equipmentList } = useQuery({
    queryKey: ["equipment-list-mobile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_items")
        .select("id, name, sku")
        .eq("availability", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredEquipment = equipmentList?.filter(
    (item) =>
      item.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(skuSearch.toLowerCase())
  ) || [];

  const addLine = (equipment: { id: string; name: string; sku: string }) => {
    if (lines.some(l => l.equipment_item_id === equipment.id)) {
      toast.error("Item already added");
      return;
    }
    
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        equipment_item_id: equipment.id,
        sku: equipment.sku,
        equipment_name: equipment.name,
        recorded_qty: 0,
        notes: "",
        photo_file: null,
        photo_preview: null,
      },
    ]);
    setShowEquipmentPicker(false);
    setSkuSearch("");
  };

  const updateLine = (id: string, field: keyof LineItem, value: unknown) => {
    setLines(lines.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handlePhotoCapture = (lineId: string, file: File | null) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      updateLine(lineId, "photo_file", file);
      updateLine(lineId, "photo_preview", preview);
    }
  };

  const handleScanResult = (scannedValue: string) => {
    setShowScanner(false);
    // Look up equipment by SKU
    const equipment = equipmentList?.find(
      e => e.sku.toLowerCase() === scannedValue.toLowerCase()
    );
    
    if (equipment) {
      addLine(equipment);
      toast.success(`Found: ${equipment.name}`);
    } else {
      toast.error(`No equipment found for: ${scannedValue}`);
      setSkuSearch(scannedValue);
      setShowEquipmentPicker(true);
    }
  };

  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!opsArea) {
        toast.error("Please select an Ops Area");
        return false;
      }
      if (!locationName.trim()) {
        toast.error("Please enter a location name");
        return false;
      }
    }
    if (stepNum === 2 && lines.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (lines.some(l => l.recorded_qty < 0)) {
      toast.error("Quantity cannot be negative");
      return;
    }

    setIsSubmitting(true);

    try {
      const linesWithPhotos = await Promise.all(
        lines.map(async (line) => {
          let photo_path = null;
          if (line.photo_file) {
            photo_path = await uploadCycleCountPhoto(line.photo_file);
          }
          return {
            equipment_item_id: line.equipment_item_id,
            sku: line.sku,
            recorded_qty: line.recorded_qty,
            notes: line.notes || null,
            photo_path,
          };
        })
      );

      await createCycleCount.mutateAsync({
        ops_area: opsArea,
        location_name: locationName,
        lines: linesWithPhotos,
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit cycle count");
    } finally {
      setIsSubmitting(false);
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

  // Success screen
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Cycle Count Submitted</h1>
        <p className="text-muted-foreground mb-8">
          Your inventory count has been submitted for review.
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => navigate("/cycle-counts/my")}
          >
            View My Counts
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
      <h1 className="text-xl font-bold mb-2">Cycle Count</h1>
      <p className="text-sm text-muted-foreground mb-4">Step {step} of 3</p>

      {/* Progress */}
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

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-base font-medium">Ops Area *</Label>
                {areasLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <Select value={opsArea} onValueChange={setOpsArea}>
                    <SelectTrigger className="h-12 text-base mt-2">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {opsAreas?.map((area) => (
                        <SelectItem key={area} value={area} className="text-base py-3">
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="text-base font-medium">Location Name *</Label>
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Warehouse A, Shelf B-12"
                  className="h-12 text-base mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={nextStep}
            disabled={!opsArea || !locationName.trim()}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Add Items */}
      {step === 2 && (
        <div className="space-y-4">
          {showEquipmentPicker ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or SKU..."
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredEquipment.slice(0, 20).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addLine(item)}
                      className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
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
                    setSkuSearch("");
                  }}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Items list */}
              {lines.map((line) => (
                <Card key={line.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{line.equipment_name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {line.sku}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-sm">Quantity *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={line.recorded_qty}
                          onChange={(e) =>
                            updateLine(line.id, "recorded_qty", parseInt(e.target.value) || 0)
                          }
                          className="h-12 text-base mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Photo</Label>
                        {line.photo_preview ? (
                          <div className="relative w-12 h-12 mt-1">
                            <img
                              src={line.photo_preview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) =>
                                handlePhotoCapture(line.id, e.target.files?.[0] || null)
                              }
                            />
                            <div className="flex items-center justify-center w-12 h-12 border-2 border-dashed rounded mt-1">
                              <Camera className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Notes</Label>
                      <Input
                        value={line.notes}
                        onChange={(e) => updateLine(line.id, "notes", e.target.value)}
                        placeholder="Optional notes"
                        className="h-12 text-base mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add buttons */}
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
                  disabled={lines.length === 0}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Ops Area</Label>
                <p className="font-medium">{opsArea}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Location</Label>
                <p className="font-medium">{locationName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Items ({lines.length})</Label>
                <div className="mt-2 space-y-2">
                  {lines.map((line) => (
                    <div key={line.id} className="flex justify-between text-sm">
                      <span>{line.equipment_name}</span>
                      <span className="font-medium">Qty: {line.recorded_qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14" onClick={prevStep}>
              Back
            </Button>
            <Button
              className="flex-1 h-14 text-lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
