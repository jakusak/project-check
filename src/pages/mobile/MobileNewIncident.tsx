import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCreateIncident, useUploadIncidentFile } from "@/hooks/useVanIncidents";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Camera, X, Loader2 } from "lucide-react";

const WEATHER_OPTIONS = [
  "Clear",
  "Cloudy",
  "Rain",
  "Heavy Rain",
  "Fog",
  "Snow",
  "Ice",
  "Other",
];

export default function MobileNewIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createIncident = useCreateIncident();
  const uploadFile = useUploadIncidentFile();
  
  const [opsAreas, setOpsAreas] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  const loadOpsAreas = async () => {
    if (!user) return;
    
    // Check if user is OPX - load their assigned areas
    const { data: opxAssignments } = await supabase
      .from("opx_area_assignments")
      .select("ops_area")
      .eq("user_id", user.id);
    
    if (opxAssignments && opxAssignments.length > 0) {
      setOpsAreas(opxAssignments.map((a) => a.ops_area));
      if (opxAssignments.length === 1) {
        setFormData(prev => ({ ...prev, ops_area: opxAssignments[0].ops_area }));
      }
    } else {
      // Load all ops areas for non-OPX users
      const { data: allAreas } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .order("ops_area");
      
      if (allAreas) {
        setOpsAreas(allAreas.map((a) => a.ops_area));
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.ops_area) newErrors.ops_area = "Required";
    if (!formData.van_id) newErrors.van_id = "Required";
    if (!formData.license_plate) newErrors.license_plate = "Required";
    if (!formData.vin) newErrors.vin = "Required";
    if (!formData.incident_date) newErrors.incident_date = "Required";
    if (!formData.incident_time) newErrors.incident_time = "Required";
    if (!formData.location_text) newErrors.location_text = "Required";
    if (!formData.weather) newErrors.weather = "Required";
    if (!formData.description) newErrors.description = "Required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !user) return;
    
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
        await uploadFile.mutateAsync({
          incidentId: incident.id,
          file,
        });
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting incident:", error);
      toast({
        title: "Error",
        description: "Failed to submit incident report. Please try again.",
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
        <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
        <p className="text-muted-foreground mb-8">
          Your incident report has been submitted successfully.
        </p>
        <Button 
          size="lg" 
          className="w-full max-w-xs h-14 text-lg"
          onClick={() => navigate("/m/home")}
        >
          Back to Mobile Home
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <h1 className="text-xl font-bold mb-4">Report Van Incident</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Operations Area */}
        <div className="space-y-2">
          <Label htmlFor="ops_area">Operations Area *</Label>
          <Select 
            value={formData.ops_area} 
            onValueChange={(v) => handleChange("ops_area", v)}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {opsAreas.map((area) => (
                <SelectItem key={area} value={area} className="text-base py-3">
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ops_area && <p className="text-sm text-destructive">{errors.ops_area}</p>}
        </div>

        {/* Trip ID (optional) */}
        <div className="space-y-2">
          <Label htmlFor="trip_id">Trip ID (optional)</Label>
          <Input
            id="trip_id"
            value={formData.trip_id}
            onChange={(e) => handleChange("trip_id", e.target.value)}
            className="h-12 text-base"
            placeholder="e.g., TRIP-2024-001"
          />
        </div>

        {/* Van Details */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h2 className="font-semibold text-base">Van Details</h2>
            
            <div className="space-y-2">
              <Label htmlFor="van_id">Van ID *</Label>
              <Input
                id="van_id"
                value={formData.van_id}
                onChange={(e) => handleChange("van_id", e.target.value)}
                className="h-12 text-base"
                placeholder="e.g., VAN-001"
              />
              {errors.van_id && <p className="text-sm text-destructive">{errors.van_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">License Plate *</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => handleChange("license_plate", e.target.value)}
                className="h-12 text-base"
                placeholder="e.g., ABC-1234"
              />
              {errors.license_plate && <p className="text-sm text-destructive">{errors.license_plate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleChange("vin", e.target.value)}
                className="h-12 text-base"
                placeholder="Vehicle Identification Number"
              />
              {errors.vin && <p className="text-sm text-destructive">{errors.vin}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="incident_date">Date *</Label>
            <Input
              id="incident_date"
              type="date"
              value={formData.incident_date}
              onChange={(e) => handleChange("incident_date", e.target.value)}
              className="h-12 text-base"
            />
            {errors.incident_date && <p className="text-sm text-destructive">{errors.incident_date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident_time">Time *</Label>
            <Input
              id="incident_time"
              type="time"
              value={formData.incident_time}
              onChange={(e) => handleChange("incident_time", e.target.value)}
              className="h-12 text-base"
            />
            {errors.incident_time && <p className="text-sm text-destructive">{errors.incident_time}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location_text">Location *</Label>
          <Input
            id="location_text"
            value={formData.location_text}
            onChange={(e) => handleChange("location_text", e.target.value)}
            className="h-12 text-base"
            placeholder="Where did the incident occur?"
          />
          {errors.location_text && <p className="text-sm text-destructive">{errors.location_text}</p>}
        </div>

        {/* Weather */}
        <div className="space-y-2">
          <Label htmlFor="weather">Weather Conditions *</Label>
          <Select 
            value={formData.weather} 
            onValueChange={(v) => handleChange("weather", v)}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select weather" />
            </SelectTrigger>
            <SelectContent>
              {WEATHER_OPTIONS.map((weather) => (
                <SelectItem key={weather} value={weather} className="text-base py-3">
                  {weather}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.weather && <p className="text-sm text-destructive">{errors.weather}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="min-h-[120px] text-base"
            placeholder="Describe what happened..."
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photos</Label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <Camera className="h-5 w-5" />
              <span className="text-base">Add Photos</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div 
                    key={index} 
                    className="relative bg-muted rounded-lg p-2 pr-8 text-sm"
                  >
                    {file.name.length > 15 
                      ? file.name.substring(0, 15) + "..." 
                      : file.name}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-destructive/20 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          size="lg" 
          className="w-full h-14 text-lg mt-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Report"
          )}
        </Button>
      </form>
    </div>
  );
}
