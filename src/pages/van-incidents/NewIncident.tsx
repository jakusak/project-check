import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCreateIncident, useUploadIncidentFile } from "@/hooks/useVanIncidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WEATHER_OPTIONS = [
  "Clear/Sunny",
  "Cloudy",
  "Rain",
  "Heavy Rain",
  "Snow",
  "Ice/Sleet",
  "Fog",
  "Wind",
  "Other",
];

export default function NewIncident() {
  const navigate = useNavigate();
  const { user, isOPX } = useAuth();
  const createIncident = useCreateIncident();
  const uploadFile = useUploadIncidentFile();

  const [opsAreas, setOpsAreas] = useState<string[]>([]);
  const [assignedAreas, setAssignedAreas] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    ops_area: "",
    trip_id: "",
    van_id: "",
    license_plate: "",
    vin: "",
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: new Date().toTimeString().slice(0, 5),
    location_text: "",
    weather: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOpsAreas();
  }, [user]);

  async function loadOpsAreas() {
    if (!user) return;

    // Load all European ops areas for incident reporting
    const { data: allAreas } = await supabase
      .from("ops_area_to_hub")
      .select("ops_area")
      .eq("region", "europe")
      .order("ops_area");

    if (allAreas) {
      const uniqueAreas = [...new Set(allAreas.map((a) => a.ops_area))];
      setOpsAreas(uniqueAreas);
    }

    // Check if user has OPX assignments for auto-selection
    const { data: assignments } = await supabase
      .from("opx_area_assignments")
      .select("ops_area")
      .eq("user_id", user.id);

    if (assignments && assignments.length > 0) {
      const areas = assignments.map((a) => a.ops_area);
      setAssignedAreas(areas);
      if (areas.length === 1) {
        setFormData((prev) => ({ ...prev, ops_area: areas[0] }));
      }
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.ops_area) newErrors.ops_area = "Operations Area is required";
    if (!formData.van_id) newErrors.van_id = "Van ID is required";
    if (!formData.license_plate) newErrors.license_plate = "License Plate is required";
    if (!formData.vin) newErrors.vin = "VIN is required";
    if (!formData.incident_date) newErrors.incident_date = "Date is required";
    if (!formData.incident_time) newErrors.incident_time = "Time is required";
    if (!formData.location_text) newErrors.location_text = "Location is required";
    if (!formData.weather) newErrors.weather = "Weather is required";
    if (!formData.description) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const incident = await createIncident.mutateAsync({
        ops_area: formData.ops_area,
        trip_id: formData.trip_id || undefined,
        van_id: formData.van_id,
        license_plate: formData.license_plate,
        vin: formData.vin,
        incident_date: formData.incident_date,
        incident_time: formData.incident_time,
        location_text: formData.location_text,
        weather: formData.weather,
        description: formData.description,
      });

      // Upload files if any
      for (const file of files) {
        await uploadFile.mutateAsync({ incidentId: incident.id, file });
      }

      navigate("/van-incidents");
    } catch (error) {
      console.error("Failed to submit incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Van Accident Report</CardTitle>
            </div>
            <CardDescription>
              Submit details about a van incident or accident. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Operations Area */}
              <div className="space-y-2">
                <Label htmlFor="ops_area">Operations Area *</Label>
                <Select
                  value={formData.ops_area}
                  onValueChange={(v) => handleChange("ops_area", v)}
                >
                  <SelectTrigger className={cn(errors.ops_area && "border-destructive")}>
                    <SelectValue placeholder="Select operations area" />
                  </SelectTrigger>
                  <SelectContent>
                    {opsAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ops_area && (
                  <p className="text-sm text-destructive">{errors.ops_area}</p>
                )}
              </div>

              {/* Trip ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="trip_id">Trip ID (optional)</Label>
                <Input
                  id="trip_id"
                  value={formData.trip_id}
                  onChange={(e) => handleChange("trip_id", e.target.value)}
                  placeholder="e.g., TRIP-2024-001"
                />
              </div>

              {/* Van Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="van_id">Van ID *</Label>
                  <Input
                    id="van_id"
                    value={formData.van_id}
                    onChange={(e) => handleChange("van_id", e.target.value)}
                    placeholder="Van identifier"
                    className={cn(errors.van_id && "border-destructive")}
                  />
                  {errors.van_id && (
                    <p className="text-sm text-destructive">{errors.van_id}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate *</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => handleChange("license_plate", e.target.value)}
                    placeholder="e.g., ABC-123"
                    className={cn(errors.license_plate && "border-destructive")}
                  />
                  {errors.license_plate && (
                    <p className="text-sm text-destructive">{errors.license_plate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN *</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => handleChange("vin", e.target.value)}
                    placeholder="Vehicle ID Number"
                    className={cn(errors.vin && "border-destructive")}
                  />
                  {errors.vin && (
                    <p className="text-sm text-destructive">{errors.vin}</p>
                  )}
                </div>
              </div>

              {/* Date/Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incident_date">Incident Date *</Label>
                  <Input
                    id="incident_date"
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => handleChange("incident_date", e.target.value)}
                    className={cn(errors.incident_date && "border-destructive")}
                  />
                  {errors.incident_date && (
                    <p className="text-sm text-destructive">{errors.incident_date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_time">Incident Time *</Label>
                  <Input
                    id="incident_time"
                    type="time"
                    value={formData.incident_time}
                    onChange={(e) => handleChange("incident_time", e.target.value)}
                    className={cn(errors.incident_time && "border-destructive")}
                  />
                  {errors.incident_time && (
                    <p className="text-sm text-destructive">{errors.incident_time}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location_text">Location *</Label>
                <Input
                  id="location_text"
                  value={formData.location_text}
                  onChange={(e) => handleChange("location_text", e.target.value)}
                  placeholder="Street address, city, or description of location"
                  className={cn(errors.location_text && "border-destructive")}
                />
                {errors.location_text && (
                  <p className="text-sm text-destructive">{errors.location_text}</p>
                )}
              </div>

              {/* Weather */}
              <div className="space-y-2">
                <Label htmlFor="weather">Weather Conditions *</Label>
                <Select
                  value={formData.weather}
                  onValueChange={(v) => handleChange("weather", v)}
                >
                  <SelectTrigger className={cn(errors.weather && "border-destructive")}>
                    <SelectValue placeholder="Select weather conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.weather && (
                  <p className="text-sm text-destructive">{errors.weather}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description of Incident *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe what happened, any damage, injuries, other parties involved, etc."
                  rows={4}
                  className={cn(errors.description && "border-destructive")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Photos / Documents (optional)</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload photos or documents
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                      >
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/van-incidents")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
