import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Car, Upload, FileSpreadsheet } from "lucide-react";
import { useFleetVehicles, useCreateFleetVehicle } from "@/hooks/useFleetNotices";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewVehicleForm {
  license_plate: string;
  backroads_van_number: string;
  fleet_type: string;
  vendor: string;
  country_base: string;
  make: string;
  model: string;
  year: string;
  vin: string;
}

export default function FleetVehiclesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: vehicles, isLoading, refetch } = useFleetVehicles();
  const createVehicle = useCreateFleetVehicle();

  const { register, handleSubmit, reset, setValue, watch } = useForm<NewVehicleForm>({
    defaultValues: { fleet_type: "owned" },
  });

  const fleetType = watch("fleet_type");

  const filteredVehicles = vehicles?.filter(vehicle => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      vehicle.license_plate.toLowerCase().includes(search) ||
      vehicle.make?.toLowerCase().includes(search) ||
      vehicle.model?.toLowerCase().includes(search) ||
      vehicle.vin?.toLowerCase().includes(search) ||
      (vehicle as any).backroads_van_number?.toLowerCase().includes(search)
    );
  });

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }

      // Parse header to find column indices
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const plateIndex = header.findIndex(h => 
        h.includes('plate') || h.includes('license') || h.includes('plaque')
      );
      const vanIndex = header.findIndex(h => 
        h.includes('van') || h.includes('backroads') || h.includes('number') || h.includes('id')
      );

      if (plateIndex === -1) {
        toast.error("Could not find license plate column. Include 'license_plate' or 'plate' header.");
        return;
      }
      if (vanIndex === -1) {
        toast.error("Could not find van number column. Include 'backroads_van_number' or 'van' header.");
        return;
      }

      let updatedCount = 0;
      let createdCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const licensePlate = values[plateIndex];
        const vanNumber = values[vanIndex];

        if (!licensePlate || !vanNumber) continue;

        // Try to find existing vehicle and update
        const normalizedPlate = licensePlate.replace(/[\s\-]/g, '').toUpperCase();
        const existingVehicle = vehicles?.find(v => 
          v.license_plate.replace(/[\s\-]/g, '').toUpperCase() === normalizedPlate
        );

        if (existingVehicle) {
          // Update existing vehicle
          const { error } = await supabase
            .from('fleet_vehicles')
            .update({ backroads_van_number: vanNumber })
            .eq('id', existingVehicle.id);
          
          if (error) {
            console.error('Error updating vehicle:', error);
            errorCount++;
          } else {
            updatedCount++;
          }
        } else {
          // Create new vehicle
          const { error } = await supabase
            .from('fleet_vehicles')
            .insert({
              license_plate: licensePlate,
              backroads_van_number: vanNumber,
              fleet_type: 'owned',
            });
          
          if (error) {
            console.error('Error creating vehicle:', error);
            errorCount++;
          } else {
            createdCount++;
          }
        }
      }

      refetch();
      setShowCsvDialog(false);
      
      const messages: string[] = [];
      if (updatedCount > 0) messages.push(`${updatedCount} updated`);
      if (createdCount > 0) messages.push(`${createdCount} created`);
      if (errorCount > 0) messages.push(`${errorCount} errors`);
      
      toast.success(`CSV import complete: ${messages.join(', ')}`);
    } catch (error) {
      console.error('CSV upload error:', error);
      toast.error("Failed to process CSV file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: NewVehicleForm) => {
    await createVehicle.mutateAsync({
      license_plate: data.license_plate,
      backroads_van_number: data.backroads_van_number || undefined,
      fleet_type: data.fleet_type || undefined,
      vendor: data.vendor || undefined,
      country_base: data.country_base || undefined,
      make: data.make || undefined,
      model: data.model || undefined,
      year: data.year ? parseInt(data.year) : undefined,
      vin: data.vin || undefined,
    });
    reset();
    setShowNewForm(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Vehicles</h1>
          <p className="text-muted-foreground">Manage vehicles for violation tracking</p>
        </div>
        <div className="flex gap-2">
          {/* CSV Upload Dialog */}
          <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Van Numbers from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with license plates and Backroads van numbers. 
                  The CSV should have columns for license plate and van number.
                </p>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    CSV format: license_plate, backroads_van_number
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "Processing..." : "Select CSV File"}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Example CSV:</p>
                  <code className="block bg-muted p-2 rounded">
                    license_plate,backroads_van_number<br />
                    AB-123-CD,VAN-001<br />
                    XY-456-ZZ,VAN-002
                  </code>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Vehicle Dialog */}
          <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Plate *</Label>
                  <Input {...register("license_plate", { required: true })} placeholder="e.g., AB-123-CD" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Backroads Van Number</Label>
                  <Input {...register("backroads_van_number")} placeholder="e.g., VAN-001" className="font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fleet Type</Label>
                  <Select value={fleetType} onValueChange={(v) => setValue("fleet_type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Owned</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                      <SelectItem value="leased">Leased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input {...register("vendor")} placeholder="e.g., Hertz, Enterprise" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input {...register("make")} placeholder="e.g., Mercedes, Ford" />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input {...register("model")} placeholder="e.g., Sprinter, Transit" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input {...register("year")} type="number" placeholder="e.g., 2023" />
                </div>
                <div className="space-y-2">
                  <Label>Country Base</Label>
                  <Input {...register("country_base")} placeholder="e.g., DE, FR" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input {...register("vin")} placeholder="Vehicle Identification Number" className="font-mono" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createVehicle.isPending}>
                  Add Vehicle
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Van Number</TableHead>
                <TableHead>Make / Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredVehicles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles?.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {vehicle.license_plate}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {(vehicle as any).backroads_van_number || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.make || vehicle.model ? (
                        `${vehicle.make || ""} ${vehicle.model || ""}`.trim()
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{vehicle.year || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.fleet_type === "owned" ? "default" : "secondary"}>
                        {vehicle.fleet_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehicle.country_base || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
