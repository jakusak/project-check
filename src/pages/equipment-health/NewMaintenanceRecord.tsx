import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateMaintenanceRecord, uploadEquipmentHealthPhoto } from "@/hooks/useEquipmentHealth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, Wrench } from "lucide-react";

const MAINTENANCE_TYPES = [
  "Routine Inspection",
  "Repair",
  "Replacement",
  "Cleaning",
  "Calibration",
  "Software Update",
  "Other",
];

export default function NewMaintenanceRecord() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const createRecord = useCreateMaintenanceRecord();

  const [equipmentItems, setEquipmentItems] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  const brokenItemReportId = searchParams.get("broken_item_id");

  const [formData, setFormData] = useState({
    equipment_item_id: "",
    sku: "",
    maintenance_type: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load equipment items
    const { data: items } = await supabase
      .from("equipment_items")
      .select("id, name, sku")
      .order("name");
    setEquipmentItems(items || []);

    // If linked to a broken item report, pre-populate
    if (brokenItemReportId) {
      const { data: report } = await supabase
        .from("broken_item_reports")
        .select("equipment_item_id, sku")
        .eq("id", brokenItemReportId)
        .single();

      if (report) {
        setFormData((prev) => ({
          ...prev,
          equipment_item_id: report.equipment_item_id || "",
          sku: report.sku,
          maintenance_type: "Repair",
        }));
      }
    }
  }

  function handleEquipmentSelect(itemId: string) {
    const item = equipmentItems.find((i) => i.id === itemId);
    setFormData((prev) => ({
      ...prev,
      equipment_item_id: itemId,
      sku: item?.sku || "",
    }));
    setErrors((prev) => ({ ...prev, equipment_item_id: "", sku: "" }));
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.maintenance_type) newErrors.maintenance_type = "Maintenance type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let photoPath: string | undefined;
      if (photo) {
        photoPath = await uploadEquipmentHealthPhoto(photo, "maintenance");
      }

      await createRecord.mutateAsync({
        equipment_item_id: formData.equipment_item_id || undefined,
        sku: formData.sku,
        maintenance_type: formData.maintenance_type,
        notes: formData.notes || undefined,
        photo_path: photoPath,
        broken_item_report_id: brokenItemReportId || undefined,
      });

      toast({
        title: "Record Created",
        description: "Maintenance record has been created successfully.",
      });

      navigate("/maintenance");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            New Maintenance Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Equipment Selection */}
            <div className="space-y-2">
              <Label>Equipment Item (Optional)</Label>
              <Select
                value={formData.equipment_item_id}
                onValueChange={handleEquipmentSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment item..." />
                </SelectTrigger>
                <SelectContent>
                  {equipmentItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="Enter SKU"
              />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
            </div>

            {/* Maintenance Type */}
            <div className="space-y-2">
              <Label>Maintenance Type *</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(v) => handleChange("maintenance_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.maintenance_type && <p className="text-sm text-destructive">{errors.maintenance_type}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes about the maintenance..."
                rows={4}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo (Optional)</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{photo.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setPhoto(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {brokenItemReportId && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                This maintenance record is linked to a broken item report.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Record
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
