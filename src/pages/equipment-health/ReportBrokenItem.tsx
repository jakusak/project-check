import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateBrokenItemReport, uploadEquipmentHealthPhoto } from "@/hooks/useEquipmentHealth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Loader2, Upload, X, AlertTriangle } from "lucide-react";

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low - Minor issue, still usable" },
  { value: "medium", label: "Medium - Needs attention soon" },
  { value: "high", label: "High - Unusable, urgent" },
];

export default function ReportBrokenItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createReport = useCreateBrokenItemReport();

  const [opsAreas, setOpsAreas] = useState<string[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    equipment_item_id: "",
    sku: "",
    ops_area: "",
    location_name: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    // Load ops areas
    const { data: areas } = await supabase
      .from("ops_area_to_hub")
      .select("ops_area")
      .order("ops_area");
    setOpsAreas([...new Set(areas?.map((a) => a.ops_area) || [])]);

    // Load equipment items
    const { data: items } = await supabase
      .from("equipment_items")
      .select("id, name, sku")
      .order("name");
    setEquipmentItems(items || []);
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
    if (!formData.ops_area) newErrors.ops_area = "Operations Area is required";
    if (!formData.location_name.trim()) newErrors.location_name = "Location is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

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
        photoPath = await uploadEquipmentHealthPhoto(photo, "broken-items");
      }

      await createReport.mutateAsync({
        equipment_item_id: formData.equipment_item_id || undefined,
        sku: formData.sku,
        ops_area: formData.ops_area,
        location_name: formData.location_name,
        description: formData.description,
        severity: formData.severity,
        photo_path: photoPath,
      });

      toast({
        title: "Report Submitted",
        description: "Broken item report has been submitted successfully.",
      });

      navigate("/broken-items");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
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
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Broken Item
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

            {/* Ops Area */}
            <div className="space-y-2">
              <Label>Operations Area *</Label>
              <Select
                value={formData.ops_area}
                onValueChange={(v) => handleChange("ops_area", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  {opsAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ops_area && <p className="text-sm text-destructive">{errors.ops_area}</p>}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location_name}
                onChange={(e) => handleChange("location_name", e.target.value)}
                placeholder="e.g., Warehouse A, Van #123, Trail Mile 5"
              />
              {errors.location_name && <p className="text-sm text-destructive">{errors.location_name}</p>}
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(v) => handleChange("severity", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
                Submit Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
