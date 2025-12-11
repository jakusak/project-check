import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateIncident, useIncidentFiles, VanIncident } from "@/hooks/useVanIncidents";
import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "@/lib/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar, MapPin, Car, FileText, ExternalLink, Loader2, Filter, Globe } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const REGIONS = [
  { value: "europe", label: "Europe" },
  { value: "usa_lappa", label: "USA" },
  { value: "canada", label: "Canada" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "closed", label: "Closed" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_review: "bg-blue-100 text-blue-800 border-blue-200",
  closed: "bg-green-100 text-green-800 border-green-200",
};

function useRegionIncidents(region: string, filters: { dateFrom?: string; dateTo?: string; opsArea?: string; status?: string }) {
  return useQuery({
    queryKey: ["van-incidents-region", region, filters],
    queryFn: async () => {
      // First get ops areas for this region
      const { data: regionAreas } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .eq("region", region);

      if (!regionAreas || regionAreas.length === 0) return [];

      const opsAreasInRegion = regionAreas.map((a) => a.ops_area);

      let query = supabase
        .from("van_incidents")
        .select(`
          *,
          creator:profiles!van_incidents_created_by_user_id_fkey(full_name, email)
        `)
        .in("ops_area", opsAreasInRegion)
        .order("incident_date", { ascending: false });

      if (filters.dateFrom) {
        query = query.gte("incident_date", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("incident_date", filters.dateTo);
      }
      if (filters.opsArea) {
        query = query.eq("ops_area", filters.opsArea);
      }
      if (filters.status && (filters.status === "submitted" || filters.status === "in_review" || filters.status === "closed")) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VanIncident[];
    },
  });
}

function useRegionOpsAreas(region: string) {
  return useQuery({
    queryKey: ["ops-areas-region", region],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .eq("region", region)
        .order("ops_area");

      if (error) throw error;
      return [...new Set(data?.map((a) => a.ops_area) || [])];
    },
  });
}

export default function SuperAdminIncidentsDashboard() {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin"]}>
      <SuperAdminIncidentsDashboardContent />
    </AuthGuard>
  );
}

function SuperAdminIncidentsDashboardContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateIncident = useUpdateIncident();

  const [activeRegion, setActiveRegion] = useState("europe");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    opsArea: "",
    status: "all",
  });

  const [selectedIncident, setSelectedIncident] = useState<VanIncident | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const { data: incidents, isLoading } = useRegionIncidents(activeRegion, {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    opsArea: filters.opsArea || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
  });

  const { data: opsAreas } = useRegionOpsAreas(activeRegion);
  const { data: incidentFiles } = useIncidentFiles(selectedIncident?.id || "");

  // Reset ops area filter when region changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, opsArea: "" }));
  }, [activeRegion]);

  function openDetail(incident: VanIncident) {
    setSelectedIncident(incident);
    setInternalNotes(incident.internal_notes || "");
    setNewStatus(incident.status);
  }

  async function handleUpdateIncident() {
    if (!selectedIncident || !user) return;

    await updateIncident.mutateAsync({
      id: selectedIncident.id,
      status: newStatus as "submitted" | "in_review" | "closed",
      internal_notes: internalNotes,
      ops_admin_user_id: user.id,
    });

    setSelectedIncident(null);
  }

  function getFileUrl(filePath: string) {
    const { data } = supabase.storage.from("incident-files").getPublicUrl(filePath);
    return data.publicUrl;
  }

  const regionLabel = REGIONS.find((r) => r.value === activeRegion)?.label || activeRegion;
  const submittedCount = incidents?.filter((i) => i.status === "submitted").length || 0;
  const inReviewCount = incidents?.filter((i) => i.status === "in_review").length || 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Van Accidents Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Super Admin dashboard for managing all van incidents across regions
            </p>
          </div>
        </div>

        {/* Region Tabs */}
        <Tabs value={activeRegion} onValueChange={setActiveRegion}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            {REGIONS.map((region) => (
              <TabsTrigger key={region.value} value={region.value}>
                {region.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardDescription>Total Incidents ({regionLabel})</CardDescription>
                <CardTitle className="text-2xl">{incidents?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardDescription>Awaiting Review</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">{submittedCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardDescription>In Review</CardDescription>
                <CardTitle className="text-2xl text-blue-600">{inReviewCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mt-4">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-base">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operations Area</Label>
                  <Select
                    value={filters.opsArea}
                    onValueChange={(v) => setFilters((prev) => ({ ...prev, opsArea: v === "all" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {opsAreas?.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incidents Table - Same content for all tabs */}
          {REGIONS.map((region) => (
            <TabsContent key={region.value} value={region.value} className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !incidents || incidents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No incident reports found for {region.label}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Van</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Ops Area</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reported By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incidents.map((incident) => (
                            <TableRow
                              key={incident.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => openDetail(incident)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {format(new Date(incident.incident_date), "MMM d, yyyy")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{incident.van_id}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 max-w-[200px]">
                                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{incident.location_text}</span>
                                </div>
                              </TableCell>
                              <TableCell>{incident.ops_area}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(STATUS_COLORS[incident.status])}>
                                  {incident.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {incident.creator?.full_name || incident.creator?.email || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Incident Report - {selectedIncident.van_id}
                </DialogTitle>
                <DialogDescription>
                  Reported on {format(new Date(selectedIncident.created_at), "MMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(STATUS_COLORS[selectedIncident.status])}>
                    {selectedIncident.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Operations Area</p>
                    <p className="font-medium">{selectedIncident.ops_area}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trip ID</p>
                    <p className="font-medium">{selectedIncident.trip_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Van ID</p>
                    <p className="font-medium">{selectedIncident.van_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License Plate</p>
                    <p className="font-medium">{selectedIncident.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">VIN</p>
                    <p className="font-medium">{selectedIncident.vin}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {format(new Date(selectedIncident.incident_date), "MMM d, yyyy")} at{" "}
                      {selectedIncident.incident_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedIncident.location_text}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weather</p>
                    <p className="font-medium">{selectedIncident.weather}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedIncident.description}</p>
                </div>

                {/* Files */}
                {incidentFiles && incidentFiles.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Attached Files</p>
                    <div className="space-y-2">
                      {incidentFiles.map((file) => (
                        <a
                          key={file.id}
                          href={getFileUrl(file.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {file.file_name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add internal notes (not visible to reporter)"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleUpdateIncident}
                    disabled={updateIncident.isPending}
                    className="w-full"
                  >
                    {updateIncident.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Incident"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
