import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";

interface LocationCriteria {
  country: string;
  city: string;
}

interface SearchCaseFormData {
  case_name: string;
  property_type: "housing" | "warehouse";
  locations: LocationCriteria[];
  budget_min?: number;
  budget_max?: number;
  size_min_sqm?: number;
  size_max_sqm?: number;
  duration_months?: number;
  required_amenities: string[];
  run_frequency: "daily" | "weekly" | "bi_weekly" | "monthly";
}

export default function NewPropertySearch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [amenity, setAmenity] = useState("");
  const [formData, setFormData] = useState<SearchCaseFormData>({
    case_name: "",
    property_type: "housing",
    locations: [{ country: "Germany", city: "" }],
    required_amenities: [],
    run_frequency: "weekly",
  });

  // Create search case mutation
  const createSearchCaseMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("property_search_cases")
        .insert({
          case_name: formData.case_name,
          property_type: formData.property_type,
          locations: formData.locations,
          budget_min: formData.budget_min || null,
          budget_max: formData.budget_max || null,
          size_min_sqm: formData.size_min_sqm || null,
          size_max_sqm: formData.size_max_sqm || null,
          duration_months: formData.duration_months || null,
          required_amenities: formData.required_amenities,
          run_frequency: formData.run_frequency,
          status: "active",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Property search case created successfully!");
      queryClient.invalidateQueries({ queryKey: ["property-search-cases"] });
      navigate(`/leases/property-search/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create search case: ${error.message}`);
    },
  });

  const addLocation = () => {
    setFormData({
      ...formData,
      locations: [...formData.locations, { country: "Germany", city: "" }],
    });
  };

  const removeLocation = (index: number) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter((_, i) => i !== index),
    });
  };

  const updateLocation = (index: number, field: keyof LocationCriteria, value: string) => {
    const newLocations = [...formData.locations];
    newLocations[index][field] = value;
    setFormData({ ...formData, locations: newLocations });
  };

  const addAmenity = () => {
    if (amenity.trim() && !formData.required_amenities.includes(amenity.trim())) {
      setFormData({
        ...formData,
        required_amenities: [...formData.required_amenities, amenity.trim()],
      });
      setAmenity("");
    }
  };

  const removeAmenity = (amenityToRemove: string) => {
    setFormData({
      ...formData,
      required_amenities: formData.required_amenities.filter((a) => a !== amenityToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.case_name.trim()) {
      toast.error("Please provide a case name");
      return;
    }

    if (formData.locations.some((loc) => !loc.city.trim())) {
      toast.error("Please provide a city for all locations");
      return;
    }

    createSearchCaseMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/leases/property-search")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Property Search Case</h1>
          <p className="text-muted-foreground mt-1">
            Create a new search case to find properties matching your criteria
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Name and identify this property search case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="case_name">Case Name *</Label>
                <Input
                  id="case_name"
                  placeholder="e.g., Summer 2026 Housing - Barcelona"
                  value={formData.case_name}
                  onChange={(e) =>
                    setFormData({ ...formData, case_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value: "housing" | "warehouse") =>
                    setFormData({ ...formData, property_type: value })
                  }
                >
                  <SelectTrigger id="property_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Locations</CardTitle>
                  <CardDescription>
                    Where are you searching for properties?
                  </CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addLocation}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.locations.map((location, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select
                        value={location.country}
                        onValueChange={(value) =>
                          updateLocation(index, "country", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Italy">Italy</SelectItem>
                          <SelectItem value="Spain">Spain</SelectItem>
                          <SelectItem value="Netherlands">Netherlands</SelectItem>
                          <SelectItem value="Austria">Austria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        placeholder="e.g., Munich, Barcelona"
                        value={location.city}
                        onChange={(e) =>
                          updateLocation(index, "city", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  {formData.locations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLocation(index)}
                      className="mt-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>
                Define the criteria for properties in this search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Min Budget (€/month)</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    min="0"
                    placeholder="e.g., 1000"
                    value={formData.budget_min || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budget_min: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Max Budget (€/month)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    min="0"
                    placeholder="e.g., 3000"
                    value={formData.budget_max || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budget_max: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size_min">Min Size (sqm)</Label>
                  <Input
                    id="size_min"
                    type="number"
                    min="0"
                    placeholder="e.g., 80"
                    value={formData.size_min_sqm || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size_min_sqm: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size_max">Max Size (sqm)</Label>
                  <Input
                    id="size_max"
                    type="number"
                    min="0"
                    placeholder="e.g., 150"
                    value={formData.size_max_sqm || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size_max_sqm: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="e.g., 12"
                    value={formData.duration_months || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_months: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Required Amenities</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Parking, WiFi, Heating"
                    value={amenity}
                    onChange={(e) => setAmenity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAmenity();
                      }
                    }}
                  />
                  <Button type="button" onClick={addAmenity}>
                    Add
                  </Button>
                </div>
                {formData.required_amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.required_amenities.map((a) => (
                      <div
                        key={a}
                        className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full"
                      >
                        <span className="text-sm">{a}</span>
                        <button
                          type="button"
                          onClick={() => removeAmenity(a)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Schedule</CardTitle>
              <CardDescription>
                How often should this search be executed?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="run_frequency">Run Frequency *</Label>
                <Select
                  value={formData.run_frequency}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, run_frequency: value })
                  }
                >
                  <SelectTrigger id="run_frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The external property search agent will run on this schedule
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/leases/property-search")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSearchCaseMutation.isPending}
            >
              {createSearchCaseMutation.isPending ? "Creating..." : "Create Search Case"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
