import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { VanIncident, LDDraftContent } from "@/hooks/useVanIncidents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, AlertTriangle, DollarSign, TrendingUp, User, Car, MapPin, 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Send,
  Eye, RefreshCw, FileWarning
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/lib/auth";

const REGION_OPTIONS = [
  { value: "all", label: "All Regions" },
  { value: "europe", label: "Europe" },
  { value: "usa_lappa", label: "USA / LAPPA" },
  { value: "canada", label: "Canada" },
];

const COST_BUCKET_LABELS: Record<string, { label: string; color: string }> = {
  under_1500: { label: "< €1,500", color: "bg-green-100 text-green-800" },
  "1500_to_3500": { label: "€1,500 – €3,500", color: "bg-amber-100 text-amber-800" },
  over_3500: { label: "> €3,500", color: "bg-red-100 text-red-800" },
};

const CONFIDENCE_LABELS: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  high: { label: "High", icon: CheckCircle, color: "text-green-600" },
  medium: { label: "Medium", icon: AlertCircle, color: "text-amber-600" },
  low: { label: "Low", icon: AlertTriangle, color: "text-red-600" },
};

const LD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Analysis", color: "bg-gray-100 text-gray-800" },
  generated: { label: "Ready for Review", color: "bg-blue-100 text-blue-800" },
  reviewed: { label: "Reviewed", color: "bg-purple-100 text-purple-800" },
  sent: { label: "Sent", color: "bg-green-100 text-green-800" },
};

function useLDIncidents(filters: { region: string; ldStatus: string }) {
  const { user, isAdmin, isOPX } = useAuth();

  return useQuery({
    queryKey: ["ld-incidents", filters],
    queryFn: async () => {
      // First get ops areas for the region filter
      let opsAreasInRegion: string[] = [];
      if (filters.region !== "all") {
        const { data: mappings } = await supabase
          .from("ops_area_to_hub")
          .select("ops_area")
          .eq("region", filters.region);
        opsAreasInRegion = mappings?.map(m => m.ops_area) || [];
      }

      let query = supabase
        .from("van_incidents")
        .select(`
          *,
          creator:profiles!van_incidents_created_by_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (filters.ldStatus !== "all") {
        query = query.eq("ld_draft_status", filters.ldStatus);
      }

      if (opsAreasInRegion.length > 0) {
        query = query.in("ops_area", opsAreasInRegion);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VanIncident[];
    },
    enabled: !!user,
  });
}

function useMarkLDReviewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { ld_draft_status: status };
      if (status === "sent") {
        updateData.ld_email_sent_at = new Date().toISOString();
        updateData.ld_communication_status = "completed";
      }

      const { data, error } = await supabase
        .from("van_incidents")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ld-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      toast({ title: "LD status updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });
}

function useRegenerateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const { data, error } = await supabase.functions.invoke("analyze-incident-damage", {
        body: { incident_id: incidentId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ld-incidents"] });
      toast({ title: "Analysis regenerated" });
    },
    onError: (error) => {
      toast({ title: "Failed to regenerate", description: error.message, variant: "destructive" });
    },
  });
}

function LDDashboardContent() {
  const [filters, setFilters] = useState({ region: "all", ldStatus: "all" });
  const [selectedIncident, setSelectedIncident] = useState<VanIncident | null>(null);

  const { data: incidents, isLoading } = useLDIncidents(filters);
  const markReviewed = useMarkLDReviewed();
  const regenerateAnalysis = useRegenerateAnalysis();

  const pendingCount = incidents?.filter(i => i.ld_draft_status === "pending").length || 0;
  const readyCount = incidents?.filter(i => i.ld_draft_status === "generated").length || 0;
  const reviewedCount = incidents?.filter(i => i.ld_draft_status === "reviewed").length || 0;

  const draft = selectedIncident?.ld_draft_content as LDDraftContent | null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              LD Review Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Review AI-analyzed van incidents for Leadership Development action
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Analysis</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ready for Review</p>
                  <p className="text-3xl font-bold text-primary">{readyCount}</p>
                </div>
                <Eye className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                  <p className="text-3xl font-bold">{reviewedCount}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Region</label>
                <Select
                  value={filters.region}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, region: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
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
              <div className="space-y-1">
                <label className="text-sm font-medium">LD Status</label>
                <Select
                  value={filters.ldStatus}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, ldStatus: v }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending Analysis</SelectItem>
                    <SelectItem value="generated">Ready for Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
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
                <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No incidents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Van</TableHead>
                      <TableHead>Ops Area</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Cost Est.</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Incident #</TableHead>
                      <TableHead>LD Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => {
                      const costBucket = COST_BUCKET_LABELS[incident.ai_cost_bucket || "1500_to_3500"];
                      const confidence = CONFIDENCE_LABELS[incident.ai_confidence || "low"];
                      const ldStatus = LD_STATUS_LABELS[incident.ld_draft_status || "pending"];
                      const ConfidenceIcon = confidence.icon;

                      return (
                        <TableRow key={incident.id} className="cursor-pointer hover:bg-muted/50">
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
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {incident.creator?.email?.split("@")[0] || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(costBucket.color)}>
                              {costBucket.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={cn("flex items-center gap-1", confidence.color)}>
                              <ConfidenceIcon className="h-4 w-4" />
                              <span className="text-sm">{confidence.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={incident.driver_incident_count_this_season > 1 ? "destructive" : "secondary"}>
                              #{incident.driver_incident_count_this_season}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(ldStatus.color)}>
                              {ldStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setSelectedIncident(incident)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Draft
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

      {/* Draft Preview Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  LD Draft – Van Incident {selectedIncident.van_id}
                </DialogTitle>
                <DialogDescription>
                  Generated {selectedIncident.ld_draft_generated_at
                    ? format(new Date(selectedIncident.ld_draft_generated_at), "MMM d, yyyy 'at' h:mm a")
                    : "N/A"}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4">
                {draft ? (
                  <div className="space-y-6 pb-4">
                    {/* 1) Incident Overview */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                        Incident Overview
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-4 rounded-lg">
                        <div><span className="text-muted-foreground">Report ID:</span> <span className="font-mono text-xs">{draft.incident_overview.report_id.slice(0, 8)}...</span></div>
                        <div><span className="text-muted-foreground">Driver:</span> {draft.incident_overview.driver_email}</div>
                        <div><span className="text-muted-foreground">Ops Area:</span> {draft.incident_overview.ops_area}</div>
                        <div><span className="text-muted-foreground">Van:</span> {draft.incident_overview.van_id}</div>
                        <div><span className="text-muted-foreground">Date/Time:</span> {draft.incident_overview.date_time}</div>
                        <div><span className="text-muted-foreground">Location:</span> {draft.incident_overview.location}</div>
                      </div>
                    </section>

                    <Separator />

                    {/* 2) Summary */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                        Summary of Incident
                      </h3>
                      <p className="text-sm bg-muted/50 p-4 rounded-lg">{draft.incident_summary}</p>
                    </section>

                    <Separator />

                    {/* 3) Reported Damage */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                        Reported Damage
                      </h3>
                      <p className="text-sm bg-muted/50 p-4 rounded-lg">{draft.reported_damage || "No specific damage reported"}</p>
                    </section>

                    <Separator />

                    {/* 4) AI Damage Review */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                        AI-Assisted Damage Review
                        <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">Guidance Only</Badge>
                      </h3>
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Damaged Components:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {draft.ai_damage_review.damaged_components.map((c, i) => (
                                <Badge key={i} variant="secondary">{c}</Badge>
                              ))}
                            </div>
                          </div>
                          <div><span className="text-muted-foreground">Severity:</span> <span className="font-medium capitalize">{draft.ai_damage_review.severity}</span></div>
                          <div><span className="text-muted-foreground">Repair Complexity:</span> <span className="font-medium capitalize">{draft.ai_damage_review.repair_complexity}</span></div>
                          <div>
                            <span className="text-muted-foreground">Estimated Cost Range:</span>
                            <Badge className={cn("ml-2", COST_BUCKET_LABELS[draft.ai_damage_review.cost_bucket]?.color)}>
                              {draft.ai_damage_review.cost_range}
                            </Badge>
                          </div>
                        </div>
                        {draft.ai_damage_review.notes && (
                          <p className="text-sm italic text-muted-foreground border-t pt-2 mt-2">{draft.ai_damage_review.notes}</p>
                        )}
                        <p className="text-xs text-amber-700 font-medium">
                          ⚠️ This estimate is AI-assisted guidance based on photos only and is not a final repair quote.
                        </p>
                      </div>
                    </section>

                    <Separator />

                    {/* 5) Consequence Guidance */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                        Policy-Based Consequence Guidance
                        <Badge variant="outline" className="ml-2">For Review</Badge>
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Cost Tier:</span> <span className="font-medium">{draft.consequence_guidance.cost_tier}</span></div>
                        <div><span className="text-muted-foreground">Incident Number:</span> <span className="font-medium">{draft.consequence_guidance.incident_number}</span></div>
                        <div><span className="text-muted-foreground">Performance Points Impact:</span> <span className="font-medium">{draft.consequence_guidance.performance_points_impact}</span></div>
                        <div><span className="text-muted-foreground">Additional Measures:</span> <span className="font-medium">{draft.consequence_guidance.additional_measures}</span></div>
                        <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                          Final determination subject to LD review and confirmation of repair costs.
                        </p>
                      </div>
                    </section>

                    <Separator />

                    {/* 6) Incident History */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">6</span>
                        Incident History Flag
                      </h3>
                      <div className={cn(
                        "p-4 rounded-lg text-sm",
                        selectedIncident.driver_incident_count_this_season > 2 
                          ? "bg-red-50 border border-red-200 text-red-800"
                          : selectedIncident.driver_incident_count_this_season === 2
                          ? "bg-amber-50 border border-amber-200 text-amber-800"
                          : "bg-green-50 border border-green-200 text-green-800"
                      )}>
                        {draft.incident_history_flag}
                      </div>
                    </section>

                    <Separator />

                    {/* 7) Attachments */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">7</span>
                        Attachments
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        {draft.attachments.length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {draft.attachments.map((file, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {file}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No attachments</p>
                        )}
                      </div>
                    </section>

                    <Separator />

                    {/* 8) Open Items */}
                    <section>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">8</span>
                        Open Items / Uncertainties
                      </h3>
                      <ul className="bg-muted/50 p-4 rounded-lg text-sm space-y-1">
                        {draft.open_items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Draft not yet generated</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => regenerateAnalysis.mutate(selectedIncident.id)}
                      disabled={regenerateAnalysis.isPending}
                    >
                      {regenerateAnalysis.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Generate Analysis
                    </Button>
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="border-t pt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => regenerateAnalysis.mutate(selectedIncident.id)}
                  disabled={regenerateAnalysis.isPending}
                >
                  {regenerateAnalysis.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
                {selectedIncident.ld_draft_status === "generated" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      markReviewed.mutate({ id: selectedIncident.id, status: "reviewed" });
                      setSelectedIncident(null);
                    }}
                    disabled={markReviewed.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Reviewed
                  </Button>
                )}
                {(selectedIncident.ld_draft_status === "generated" || selectedIncident.ld_draft_status === "reviewed") && (
                  <Button
                    onClick={() => {
                      markReviewed.mutate({ id: selectedIncident.id, status: "sent" });
                      setSelectedIncident(null);
                    }}
                    disabled={markReviewed.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Mark as Sent
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LDDashboard() {
  return (
    <AuthGuard allowedRoles={["super_admin", "admin"]}>
      <LDDashboardContent />
    </AuthGuard>
  );
}
