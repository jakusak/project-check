import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useVanIncidents, VanIncident, useUpdateIncident, useIncidentFiles } from "@/hooks/useVanIncidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Filter, AlertTriangle, Calendar, MapPin, Car, FileText, ExternalLink, Loader2, Mail, MessageSquare, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const REGION_OPTIONS = [
  { value: "all", label: "All Regions" },
  { value: "europe", label: "Europe" },
  { value: "usa_lappa", label: "USA / LAPPA" },
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

const LD_STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  not_sent: { label: "Not Sent", icon: XCircle, className: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-amber-600" },
  completed: { label: "Completed", icon: CheckCircle, className: "text-green-600" },
};

const FS_STATUS_CONFIG: Record<string, { label: string; icon: typeof Send; className: string }> = {
  not_sent: { label: "Not Sent", icon: XCircle, className: "text-muted-foreground" },
  sent: { label: "Sent", icon: CheckCircle, className: "text-green-600" },
};

export default function IncidentList() {
  const navigate = useNavigate();
  const { user, isAdmin, isOPX } = useAuth();
  const updateIncident = useUpdateIncident();

  const [filters, setFilters] = useState({
    region: "all",
    dateFrom: "",
    dateTo: "",
    opsArea: "",
    status: "all",
  });

  const [opsAreas, setOpsAreas] = useState<string[]>([]);
  const [allOpsAreaMappings, setAllOpsAreaMappings] = useState<{ ops_area: string; region: string }[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<VanIncident | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [ldStatus, setLdStatus] = useState<string>("not_sent");
  const [fsStatus, setFsStatus] = useState<string>("not_sent");

  const { data: incidents, isLoading } = useVanIncidents({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    opsArea: filters.opsArea || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
  });

  const { data: incidentFiles } = useIncidentFiles(selectedIncident?.id || "");

  useEffect(() => {
    loadOpsAreas();
  }, [user, isAdmin, isOPX]);

  // Filter ops areas when region changes
  useEffect(() => {
    if (filters.region === "all") {
      setOpsAreas([...new Set(allOpsAreaMappings.map((a) => a.ops_area))]);
    } else {
      const filtered = allOpsAreaMappings
        .filter((a) => a.region === filters.region)
        .map((a) => a.ops_area);
      setOpsAreas([...new Set(filtered)]);
    }
    // Reset ops area filter when region changes
    setFilters((prev) => ({ ...prev, opsArea: "" }));
  }, [filters.region, allOpsAreaMappings]);

  async function loadOpsAreas() {
    if (!user) return;

    if (isAdmin) {
      // Admins see all areas with their regions
      const { data } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area, region")
        .order("ops_area");
      if (data) {
        setAllOpsAreaMappings(data.map((a) => ({ ops_area: a.ops_area, region: a.region || "europe" })));
        setOpsAreas([...new Set(data.map((a) => a.ops_area))]);
      }
    } else if (isOPX) {
      // OPX see only assigned areas - need to get region info too
      const { data: assignments } = await supabase
        .from("opx_area_assignments")
        .select("ops_area")
        .eq("user_id", user.id);
      
      if (assignments) {
        const opsAreaNames = assignments.map((a) => a.ops_area);
        const { data: mappings } = await supabase
          .from("ops_area_to_hub")
          .select("ops_area, region")
          .in("ops_area", opsAreaNames);
        
        if (mappings) {
          setAllOpsAreaMappings(mappings.map((a) => ({ ops_area: a.ops_area, region: a.region || "europe" })));
        }
        setOpsAreas(opsAreaNames);
      }
    }
  }

  function openDetail(incident: VanIncident) {
    setSelectedIncident(incident);
    setInternalNotes(incident.internal_notes || "");
    setNewStatus(incident.status);
    setLdStatus(incident.ld_communication_status || "not_sent");
    setFsStatus(incident.fs_communication_status || "not_sent");
  }

  async function handleUpdateIncident() {
    if (!selectedIncident || !user) return;

    await updateIncident.mutateAsync({
      id: selectedIncident.id,
      status: newStatus as "submitted" | "in_review" | "closed",
      internal_notes: internalNotes,
      ops_admin_user_id: user.id,
      ld_communication_status: ldStatus as "not_sent" | "in_progress" | "completed",
      fs_communication_status: fsStatus as "sent" | "not_sent",
    });

    setSelectedIncident(null);
  }

  function getFileUrl(filePath: string) {
    const { data } = supabase.storage.from("incident-files").getPublicUrl(filePath);
    return data.publicUrl;
  }

  const canEdit = isAdmin || isOPX;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Van Incident Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              {canEdit
                ? "View and manage incident reports"
                : "View your submitted incident reports"}
            </p>
          </div>
          <Button onClick={() => navigate("/van-incidents/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Region Filter - First */}
              {(isAdmin || isOPX) && (
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={filters.region}
                    onValueChange={(v) =>
                      setFilters((prev) => ({ ...prev, region: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
                />
              </div>
              {(isAdmin || isOPX) && opsAreas.length > 0 && (
                <div className="space-y-2">
                  <Label>Operations Area</Label>
                  <Select
                    value={filters.opsArea}
                    onValueChange={(v) =>
                      setFilters((prev) => ({ ...prev, opsArea: v === "all" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {opsAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(v) =>
                    setFilters((prev) => ({ ...prev, status: v }))
                  }
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

        {/* Incidents Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !incidents || incidents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No incident reports found</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate("/van-incidents/new")}
                >
                  Submit your first report
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Van</TableHead>
                      <TableHead>Ops Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email Sent</TableHead>
                      <TableHead>LD Comm.</TableHead>
                      <TableHead>FS Comm.</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => {
                      const ldConfig = LD_STATUS_CONFIG[incident.ld_communication_status || "not_sent"];
                      const fsConfig = FS_STATUS_CONFIG[incident.fs_communication_status || "not_sent"];
                      const LdIcon = ldConfig.icon;
                      const FsIcon = fsConfig.icon;
                      
                      return (
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
                          <TableCell>{incident.ops_area}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(STATUS_COLORS[incident.status])}
                            >
                              {incident.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {incident.email_sent_at ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Mail className="h-4 w-4" />
                                <span className="text-xs">Sent</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="text-xs">Pending</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={cn("flex items-center gap-1", ldConfig.className)}>
                              <LdIcon className="h-4 w-4" />
                              <span className="text-xs">{ldConfig.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn("flex items-center gap-1", fsConfig.className)}>
                              <FsIcon className="h-4 w-4" />
                              <span className="text-xs">{fsConfig.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
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
                  Reported on{" "}
                  {format(new Date(selectedIncident.created_at), "MMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(STATUS_COLORS[selectedIncident.status])}
                  >
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
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedIncident.description}
                  </p>
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

                {/* Admin/OPX Actions */}
                {canEdit && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label>LD Communication</Label>
                        <Select value={ldStatus} onValueChange={setLdStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_sent">Not Sent</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Final FS Communication</Label>
                      <Select value={fsStatus} onValueChange={setFsStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_sent">Not Sent</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
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
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
