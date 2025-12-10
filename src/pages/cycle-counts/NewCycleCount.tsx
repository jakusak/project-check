import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { useCreateCycleCount, uploadCycleCountPhoto } from "@/hooks/useCycleCounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";

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

export default function NewCycleCount() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createCycleCount = useCreateCycleCount();
  
  const [opsArea, setOpsArea] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [skuSearch, setSkuSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch OPS areas for the user (from their assignments or all if admin)
  const { data: opsAreas } = useQuery({
    queryKey: ["ops-areas-for-cycle-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .order("ops_area");
      if (error) throw error;
      return [...new Set(data.map(d => d.ops_area))];
    },
  });
  
  // Search equipment items by SKU
  const { data: searchResults } = useQuery({
    queryKey: ["equipment-search", skuSearch],
    queryFn: async () => {
      if (!skuSearch || skuSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("equipment_items")
        .select("id, name, sku")
        .or(`sku.ilike.%${skuSearch}%,name.ilike.%${skuSearch}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: skuSearch.length >= 2,
  });
  
  const addLine = (equipment: { id: string; name: string; sku: string }) => {
    const existing = lines.find(l => l.equipment_item_id === equipment.id);
    if (existing) {
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
    setSkuSearch("");
  };
  
  const updateLine = (id: string, field: keyof LineItem, value: unknown) => {
    setLines(lines.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };
  
  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };
  
  const handlePhotoChange = (lineId: string, file: File | null) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      updateLine(lineId, "photo_file", file);
      updateLine(lineId, "photo_preview", preview);
    } else {
      updateLine(lineId, "photo_file", null);
      updateLine(lineId, "photo_preview", null);
    }
  };
  
  const handleSubmit = async () => {
    if (!opsArea) {
      toast.error("Please select an Ops Area");
      return;
    }
    if (!locationName.trim()) {
      toast.error("Please enter a location name");
      return;
    }
    if (lines.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }
    if (lines.some(l => l.recorded_qty < 0)) {
      toast.error("Quantity cannot be negative");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload photos first
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
      
      toast.success("Cycle count submitted successfully");
      navigate("/cycle-counts/my");
    } catch (error) {
      console.error("Error submitting cycle count:", error);
      toast.error("Failed to submit cycle count");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Cycle Count</h1>
        <p className="text-muted-foreground">
          Submit inventory counts by SKU and location
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ops Area *</Label>
              <Select value={opsArea} onValueChange={setOpsArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Ops Area" />
                </SelectTrigger>
                <SelectContent>
                  {opsAreas?.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Warehouse A, Shelf B-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Search SKU or Equipment Name</Label>
            <div className="relative">
              <Input
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Type to search..."
              />
              {searchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center"
                      onClick={() => addLine(item)}
                    >
                      <span>{item.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {item.sku}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {lines.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-32">Photo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-sm">
                        {line.sku}
                      </TableCell>
                      <TableCell>{line.equipment_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={line.recorded_qty}
                          onChange={(e) =>
                            updateLine(
                              line.id,
                              "recorded_qty",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.notes}
                          onChange={(e) =>
                            updateLine(line.id, "notes", e.target.value)
                          }
                          placeholder="Optional notes"
                        />
                      </TableCell>
                      <TableCell>
                        {line.photo_preview ? (
                          <div className="relative w-16 h-16">
                            <img
                              src={line.photo_preview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded"
                            />
                            <button
                              onClick={() => handlePhotoChange(line.id, null)}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handlePhotoChange(
                                  line.id,
                                  e.target.files?.[0] || null
                                )
                              }
                            />
                            <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                              <Upload className="h-4 w-4" />
                              Upload
                            </div>
                          </label>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              Search and add equipment items above
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Cycle Count"}
        </Button>
      </div>
    </div>
  );
}
