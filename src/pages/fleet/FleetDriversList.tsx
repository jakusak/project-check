import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, User, Mail, Phone } from "lucide-react";
import { useFleetDrivers, useCreateFleetDriver } from "@/hooks/useFleetNotices";
import { useForm } from "react-hook-form";

interface NewDriverForm {
  name: string;
  email: string;
  phone: string;
  region: string;
  country: string;
  employment_type: string;
}

export default function FleetDriversList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const { data: drivers, isLoading } = useFleetDrivers();
  const createDriver = useCreateFleetDriver();

  const { register, handleSubmit, reset } = useForm<NewDriverForm>();

  const filteredDrivers = drivers?.filter(driver => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      driver.name.toLowerCase().includes(search) ||
      driver.email?.toLowerCase().includes(search) ||
      driver.region?.toLowerCase().includes(search)
    );
  });

  const onSubmit = async (data: NewDriverForm) => {
    await createDriver.mutateAsync({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      region: data.region || undefined,
      country: data.country || undefined,
      employment_type: data.employment_type || undefined,
    });
    reset();
    setShowNewForm(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Drivers</h1>
          <p className="text-muted-foreground">Manage drivers for violation assignment and tracking</p>
        </div>
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...register("name", { required: true })} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...register("email")} type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register("phone")} placeholder="+1 234 567 890" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input {...register("region")} placeholder="e.g., Tuscany" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input {...register("country")} placeholder="e.g., IT" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Input {...register("employment_type")} placeholder="e.g., Full-time, Contractor" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDriver.isPending}>
                  Add Driver
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
              placeholder="Search drivers..."
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredDrivers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers?.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {driver.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {driver.email}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{driver.region || "—"}</TableCell>
                    <TableCell>{driver.country || "—"}</TableCell>
                    <TableCell>{driver.employment_type || "—"}</TableCell>
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
