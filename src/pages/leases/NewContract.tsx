import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText } from "lucide-react";

interface ContractFormData {
  contract_type: "housing" | "warehouse";
  country: string;
  duration_months: number;
  seasonality: "seasonal" | "year_round";
  property_reference?: string;
}

export default function NewContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadMethod, setUploadMethod] = useState<"upload" | "template">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ContractFormData>({
    contract_type: "housing",
    country: "Germany",
    duration_months: 12,
    seasonality: "year_round",
  });

  // Fetch legal entities for the selected country
  const { data: legalEntities } = useQuery({
    queryKey: ["legal-entities", formData.country, formData.contract_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_entities")
        .select("*")
        .eq("country", formData.country)
        .eq("entity_type", formData.contract_type)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      // Generate contract number
      const { data: contractNumberData, error: numberError } = await supabase
        .rpc("generate_contract_number");

      if (numberError) throw numberError;

      // Create contract record
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          contract_number: contractNumberData,
          contract_type: formData.contract_type,
          country: formData.country,
          duration_months: formData.duration_months,
          seasonality: formData.seasonality,
          property_reference: formData.property_reference || null,
          state: selectedFile ? "uploaded" : "draft",
          created_by: user.id,
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // If file is selected, upload it
      if (selectedFile && contract) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${contract.id}.${fileExt}`;
        const filePath = `contracts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("lease-documents")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // Update contract with document info
        const { error: updateError } = await supabase
          .from("contracts")
          .update({
            document_url: filePath,
            document_filename: selectedFile.name,
            document_type: fileExt === "pdf" ? "pdf" : "docx",
          })
          .eq("id", contract.id);

        if (updateError) throw updateError;
      }

      return contract;
    },
    onSuccess: (contract) => {
      toast.success("Contract created successfully!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      navigate(`/leases/contracts/${contract.id}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const fileType = file.name.split(".").pop()?.toLowerCase();
      if (fileType !== "pdf" && fileType !== "docx") {
        toast.error("Only PDF and DOCX files are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (uploadMethod === "upload" && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (formData.duration_months < 1) {
      toast.error("Duration must be at least 1 month");
      return;
    }

    createContractMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leases/contracts")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Lease Contract</h1>
          <p className="text-muted-foreground mt-1">
            Create a new contract by uploading a document or using a template
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Contract Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Creation Method</CardTitle>
              <CardDescription>
                Choose how you want to create the contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "upload" | "template")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </TabsTrigger>
                  <TabsTrigger value="template">
                    <FileText className="w-4 h-4 mr-2" />
                    Use Template
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Contract Document</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Accepted formats: PDF, DOCX (max 10MB)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="template" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Template-based contract generation will be available soon.
                    For now, please upload an existing contract document.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>
                Provide the basic information about this lease contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Contract Type *</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value: "housing" | "warehouse") =>
                      setFormData({ ...formData, contract_type: value })
                    }
                  >
                    <SelectTrigger id="contract_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      setFormData({ ...formData, country: value })
                    }
                  >
                    <SelectTrigger id="country">
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
                  <Label htmlFor="duration">Duration (months) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_months: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seasonality">Seasonality *</Label>
                  <Select
                    value={formData.seasonality}
                    onValueChange={(value: "seasonal" | "year_round") =>
                      setFormData({ ...formData, seasonality: value })
                    }
                  >
                    <SelectTrigger id="seasonality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year_round">Year Round</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_reference">Property Reference (Optional)</Label>
                <Input
                  id="property_reference"
                  placeholder="e.g., BCN-WH-001 or Paris Housing Unit 5"
                  value={formData.property_reference || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, property_reference: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Internal reference for the property (can be added later)
                </p>
              </div>

              {legalEntities && legalEntities.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    Applicable Legal Entity:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {legalEntities[0].name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/leases/contracts")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createContractMutation.isPending}
            >
              {createContractMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
