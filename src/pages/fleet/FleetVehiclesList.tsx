import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Car } from "lucide-react";
import { useFleetVehicles, useCreateFleetVehicle } from "@/hooks/useFleetNotices";
import { useForm } from "react-hook-form";

interface NewVehicleForm {
  license_plate: string;
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
  const { data: vehicles, isLoading } = useFleetVehicles();
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
      vehicle.vin?.toLowerCase().includes(search)
    );
  });

  const onSubmit = async (data: NewVehicleForm) => {
    await createVehicle.mutateAsync({
      license_plate: data.license_plate,
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
              <div className="space-y-2">
                <Label>License Plate *</Label>
                <Input {...register("license_plate", { required: true })} placeholder="e.g., AB-123-CD" className="font-mono" />
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
                <TableHead>Make / Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vendor</TableHead>
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
                    <TableCell>{vehicle.vendor || "—"}</TableCell>
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
