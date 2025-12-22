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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, AlertTriangle, Calendar, MapPin, Car, FileText, ExternalLink, Loader2, Mail, MessageSquare, Send, CheckCircle, Clock, XCircle, Eye, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LDReviewPanel } from "@/components/van-incidents/LDReviewPanel";
import { OPSSendEmailPanel } from "@/components/van-incidents/OPSSendEmailPanel";

const REGION_OPTIONS = [
  { value: "all", label: "All Regions" },
  { value: "europe", label: "Europe" },
  { value: "usa_lappa", label: "USA / LAPPA" },
  { value: "canada", label: "Canada" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "New Accident" },
  { value: "in_review", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_review: "bg-blue-100 text-blue-800 border-blue-200",
  closed: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "New Accident",
  in_review: "In Progress",
  closed: "Closed",
};

const LD_REVIEW_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  needs_revision: { label: "Needs Revision", color: "bg-amber-100 text-amber-800" },
};

const COST_BUCKET_LABELS: Record<string, { label: string; color: string }> = {
  under_1500: { label: "< €1.5k", color: "bg-green-100 text-green-800" },
  "1500_to_3500": { label: "€1.5-3.5k", color: "bg-amber-100 text-amber-800" },
  over_3500: { label: "> €3.5k", color: "bg-red-100 text-red-800" },
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
  const [activeTab, setActiveTab] = useState<string>("details");

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

  async function openDetail(incident: VanIncident) {
    setSelectedIncident(incident);
    setInternalNotes(incident.internal_notes || "");
    setNewStatus(incident.status);
    setActiveTab("details");
    
    // Auto-update status to "in_review" when opening a "submitted" incident
    if (incident.status === "submitted" && canEdit) {
      await updateIncident.mutateAsync({
        id: incident.id,
        status: "in_review",
      });
    }
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
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>LD Review</TableHead>
                      <TableHead>Email Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => {
                      const costBucket = COST_BUCKET_LABELS[incident.ai_cost_bucket || "1500_to_3500"];
                      const ldReview = LD_REVIEW_STATUS[incident.ld_review_status || "pending"];
                      
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
                            <Badge variant="outline" className={cn("text-xs", costBucket.color)}>
                              {costBucket.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                          <Badge
                              variant="outline"
                              className={cn(STATUS_COLORS[incident.status])}
                            >
                              {STATUS_LABELS[incident.status] || incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs", ldReview.color)}>
                              {ldReview.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {incident.ops_email_sent_at ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">Sent</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs">Pending</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
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

      {/* Detail Dialog with Tabs */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Incident - {selectedIncident.van_id}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedIncident.incident_date), "MMM d, yyyy")} • {selectedIncident.ops_area}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="ld-review">LD Review</TabsTrigger>
                  <TabsTrigger value="send-email">Field Staff Final Email Draft</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-y-auto mt-4">
                  <div className="space-y-4">
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">License Plate</p>
                        <p className="font-medium">{selectedIncident.license_plate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date & Time</p>
                        <p className="font-medium">
                          {format(new Date(selectedIncident.incident_date), "MMM d, yyyy")} at {selectedIncident.incident_time}
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

                    {/* Admin/OPX Actions - Internal Notes only */}
                    {canEdit && (
                      <div className="border-t pt-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Internal Notes</Label>
                          <Textarea
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                            placeholder="Add internal notes"
                            rows={3}
                          />
                        </div>

                        <Button onClick={handleUpdateIncident} disabled={updateIncident.isPending} className="w-full">
                          {updateIncident.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Update Incident
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ld-review" className="flex-1 overflow-hidden mt-4">
                  <LDReviewPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
                </TabsContent>

                <TabsContent value="send-email" className="flex-1 overflow-hidden mt-4">
                  <OPSSendEmailPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}