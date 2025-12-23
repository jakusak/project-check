import { useState } from "react";
import { VanIncident, LDDraftContent, useIncidentFiles, useLDReviewIncident, useRegenerateAnalysis } from "@/hooks/useVanIncidents";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, AlertTriangle, Loader2, RefreshCw, FileText,
  AlertCircle, DollarSign, Car, MapPin, Calendar, Clock, PanelRightClose
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { IncidentDraftEditor } from "./IncidentDraftEditor";
import { toast } from "@/hooks/use-toast";

const COST_BUCKET_LABELS: Record<string, { label: string; color: string }> = {
  under_1500: { label: "< €1,500", color: "bg-green-100 text-green-800" },
  "1500_to_3500": { label: "€1,500 – €3,500", color: "bg-amber-100 text-amber-800" },
  over_3500: { label: "> €3,500", color: "bg-red-100 text-red-800" },
};

const CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-green-600" },
  medium: { label: "Medium", color: "text-amber-600" },
  low: { label: "Low", color: "text-red-600" },
};

// Policy Consequence Guidance based on the penalty chart
function PolicyConsequenceGuidance({ costBucket, incidentNumber }: { costBucket: string; incidentNumber: number }) {
  const getConsequences = () => {
    if (incidentNumber >= 3) {
      return {
        title: "THIRD+ INCIDENT of Season",
        titleColor: "bg-red-600 text-white",
        points: "Maximum penalties apply",
        mandatory: ["May result in termination", "Application of maximum penalties regardless of cost"],
        optional: [],
        note: "Any THIRD incident may result in termination or application of max penalties regardless of cost of the incident."
      };
    }
    
    if (incidentNumber === 2) {
      return {
        title: "SECOND INCIDENT of Season",
        titleColor: "bg-sky-500 text-white",
        costLabel: "Any Cost at All",
        points: "Loss of additional 6 Performance Points",
        mandatory: ["Loss of additional 6 Performance Points"],
        optional: ["Termination"],
        note: "Policy indicates additional loss of 6 performance points for a second incident."
      };
    }
    
    if (costBucket === "under_1500") {
      return {
        title: "FIRST INCIDENT of Season",
        titleColor: "bg-gray-800 text-white",
        costLabel: "Less than €1,500",
        costColor: "bg-sky-200",
        points: "Loss of 4 Performance Points",
        mandatory: ["Loss of 4 Performance Points"],
        optional: [],
        note: null
      };
    } else if (costBucket === "1500_to_3500") {
      return {
        title: "FIRST INCIDENT of Season",
        titleColor: "bg-gray-800 text-white",
        costLabel: "€1,500 to €3,500",
        costColor: "bg-sky-200",
        points: "Loss of 4 Performance Points",
        mandatory: [
          "Loss of 4 Performance Points",
          "1-Year Warning",
          "Staff Ride Disqualification",
          "Backroads Gear Ineligibility"
        ],
        optional: ["Termination"],
        note: "1-Year Warning: You will have lower priority for Staff Ride approval, scheduling, Winter Work, and/or career progression opportunities for the duration of the warning."
      };
    } else {
      return {
        title: "FIRST INCIDENT of Season",
        titleColor: "bg-gray-800 text-white",
        costLabel: "Over €3,500",
        costColor: "bg-red-200",
        points: "Loss of 6 Performance Points",
        mandatory: [
          "Loss of 6 Performance Points",
          "1-Year Warning",
          "Staff Ride Disqualification",
          "Backroads Gear Ineligibility"
        ],
        optional: ["Termination"],
        note: "1-Year Warning: You will have lower priority for Staff Ride approval, scheduling, Winter Work, and/or career progression opportunities for the duration of the warning."
      };
    }
  };
  
  const consequences = getConsequences();
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={cn("px-4 py-2 font-semibold text-center", consequences.titleColor)}>
        {consequences.title}
      </div>
      
      {consequences.costLabel && (
        <div className={cn("px-4 py-2 text-center font-medium border-b", consequences.costColor || "bg-gray-100")}>
          {consequences.costLabel}
        </div>
      )}
      
      <div className="p-4 space-y-2">
        {consequences.mandatory.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-foreground">•</span>
            <span className="font-medium">{item}</span>
          </div>
        ))}
        {consequences.optional.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span>•</span>
            <span className="italic">{item} (optional)</span>
          </div>
        ))}
      </div>
      
      {consequences.note && (
        <div className="px-4 py-3 bg-muted/50 text-xs text-muted-foreground border-t">
          <strong>Note:</strong> {consequences.note}
        </div>
      )}
      
      <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
        All penalties applied for 1 calendar year. Items in <em>italic</em> are optional to be applied.
      </div>
    </div>
  );
}

interface LDReviewPanelProps {
  incident: VanIncident;
  onClose: () => void;
}

export function LDReviewPanel({ incident, onClose }: LDReviewPanelProps) {
  const [reviewStatus, setReviewStatus] = useState<"approved" | "needs_revision">("approved");
  const [comment, setComment] = useState("");
  const [preventability, setPreventability] = useState<"preventable" | "non_preventable">(
    incident.ld_preventability_decision || 
    ((incident.ld_draft_content as LDDraftContent)?.ai_damage_review?.notes?.toLowerCase().includes("non-preventable") 
      ? "non_preventable" 
      : "preventable")
  );
  const [costBucketOverride, setCostBucketOverride] = useState<string>(
    incident.ld_cost_bucket_override || incident.ai_cost_bucket || "1500_to_3500"
  );
  const [showDraftPanel, setShowDraftPanel] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const { data: files } = useIncidentFiles(incident.id);
  const ldReview = useLDReviewIncident();
  const regenerate = useRegenerateAnalysis();

  const draft = incident.ld_draft_content as LDDraftContent | null;
  const effectiveCostBucket = costBucketOverride || incident.ai_cost_bucket || "1500_to_3500";
  const costBucket = COST_BUCKET_LABELS[effectiveCostBucket];
  const confidence = CONFIDENCE_LABELS[incident.ai_confidence || "low"];

  function getFileUrl(filePath: string) {
    const { data } = supabase.storage.from("incident-files").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleCostBucketChange(newBucket: string) {
    setCostBucketOverride(newBucket);
    
    // Save the override to the database
    const { error } = await supabase
      .from("van_incidents")
      .update({ ld_cost_bucket_override: newBucket })
      .eq("id", incident.id);
    
    if (error) {
      toast({ title: "Failed to save cost override", variant: "destructive" });
    } else {
      toast({ title: "Cost bucket updated" });
    }
  }

  async function handleSaveDraft(draftContent: { subject: string; body: string }) {
    setIsSavingDraft(true);
    try {
      const { error } = await supabase
        .from("van_incidents")
        .update({ ld_edited_draft: draftContent })
        .eq("id", incident.id);
      
      if (error) throw error;
      toast({ title: "Draft saved" });
    } catch (err) {
      toast({ title: "Failed to save draft", variant: "destructive" });
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleSubmitReview() {
    await ldReview.mutateAsync({
      id: incident.id,
      ld_review_status: reviewStatus,
      ld_review_comment: comment || undefined,
      ld_preventability_decision: preventability,
    });
    onClose();
  }

  const isAlreadyReviewed = incident.ld_review_status === "approved" || incident.ld_review_status === "needs_revision";

  // Create a modified incident for the draft editor with the override
  const incidentWithOverride = {
    ...incident,
    ld_cost_bucket_override: costBucketOverride !== incident.ai_cost_bucket ? costBucketOverride : null,
  };

  return (
    <div className="flex gap-4 h-[70vh]">
      {/* Left Panel - Review Form */}
      <div className={cn("flex-1 flex flex-col", showDraftPanel ? "max-w-[55%]" : "max-w-full")}>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <Car className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Van</p>
                <p className="font-semibold">{incident.van_id}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold text-sm">{format(new Date(incident.incident_date), "MMM d")}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <Badge variant="outline" className={cn("text-xs", costBucket.color)}>
                  {costBucket.label}
                </Badge>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Incident #</p>
                <Badge variant={incident.driver_incident_count_this_season > 1 ? "destructive" : "secondary"}>
                  #{incident.driver_incident_count_this_season}
                </Badge>
              </div>
            </div>

            {/* Photos */}
            {files && files.length > 0 && (
              <section>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Incident Photos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {files.filter(f => f.file_type.startsWith("image/")).map((file) => (
                    <a
                      key={file.id}
                      href={getFileUrl(file.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={getFileUrl(file.file_path)}
                        alt={file.file_name}
                        className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Incident Description */}
            <section>
              <h4 className="font-medium mb-2">Incident Description</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{incident.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {incident.location_text}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {incident.incident_time}
                </span>
              </div>
            </section>

            {/* AI Analysis with Cost Override */}
            {draft ? (
              <>
                <Separator />
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      AI Damage Assessment
                      <Badge variant="outline" className={cn("text-xs", confidence.color)}>
                        {confidence.label} Confidence
                      </Badge>
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => regenerate.mutate(incident.id)}
                      disabled={regenerate.isPending}
                    >
                      {regenerate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-1 hidden sm:inline">Regenerate</span>
                    </Button>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Damaged Components:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {draft.ai_damage_review?.damaged_components?.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Severity:</span>
                        <span className="font-medium capitalize ml-1">{draft.ai_damage_review?.severity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Repair Complexity:</span>
                        <span className="font-medium capitalize ml-1">{draft.ai_damage_review?.repair_complexity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Est. Range:</span>
                        <span className="font-medium ml-1">{draft.ai_damage_review?.cost_range}</span>
                      </div>
                    </div>
                    {draft.ai_damage_review?.notes && (
                      <p className="text-sm italic text-muted-foreground border-t pt-2">{draft.ai_damage_review.notes}</p>
                    )}
                  </div>

                  {/* Cost Bucket Override */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4" />
                      LD Cost Assessment Override
                    </Label>
                    <Select value={costBucketOverride} onValueChange={handleCostBucketChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_1500">Under €1,500 (Minor)</SelectItem>
                        <SelectItem value="1500_to_3500">€1,500 – €3,500 (Moderate)</SelectItem>
                        <SelectItem value="over_3500">Over €3,500 (Major)</SelectItem>
                      </SelectContent>
                    </Select>
                    {costBucketOverride !== incident.ai_cost_bucket && (
                      <p className="text-xs text-blue-600 mt-1">
                        ⚠️ You've overridden the AI estimate from {COST_BUCKET_LABELS[incident.ai_cost_bucket || "1500_to_3500"]?.label}
                      </p>
                    )}
                  </div>
                </section>

                <Separator />

                {/* Policy Consequence Guidance */}
                <section>
                  <h4 className="font-medium mb-2">Policy Consequence Guidance</h4>
                  <PolicyConsequenceGuidance 
                    costBucket={effectiveCostBucket}
                    incidentNumber={incident.driver_incident_count_this_season || 1}
                  />
                </section>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">AI analysis not yet generated</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={() => regenerate.mutate(incident.id)}
                  disabled={regenerate.isPending}
                >
                  {regenerate.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Generate Analysis
                </Button>
              </div>
            )}

            <Separator />

            {/* LD Review Form */}
            <section className="space-y-4">
              <h4 className="font-medium">LD Review Decision</h4>
              
              {isAlreadyReviewed && (
                <div className={cn(
                  "p-3 rounded-lg text-sm flex items-center gap-2",
                  incident.ld_review_status === "approved" ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
                )}>
                  {incident.ld_review_status === "approved" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>
                    {incident.ld_review_status === "approved" ? "Approved" : "Needs Revision"} 
                    {incident.ld_reviewed_at && ` on ${format(new Date(incident.ld_reviewed_at), "MMM d, yyyy")}`}
                  </span>
                </div>
              )}

              {/* Preventability Decision */}
              <div className="space-y-2">
                <Label className="font-medium">Preventability (LD Decision)</Label>
                <RadioGroup 
                  value={preventability} 
                  onValueChange={(v) => setPreventability(v as "preventable" | "non_preventable")}
                  className="flex gap-4"
                  disabled={isAlreadyReviewed}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="preventable" id="preventable" />
                    <Label htmlFor="preventable" className="cursor-pointer">Preventable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non_preventable" id="non_preventable" />
                    <Label htmlFor="non_preventable" className="cursor-pointer">Non-Preventable</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Review Status */}
              <div className="space-y-2">
                <Label className="font-medium">Review Decision</Label>
                <RadioGroup 
                  value={reviewStatus} 
                  onValueChange={(v) => setReviewStatus(v as "approved" | "needs_revision")}
                  className="flex gap-4"
                  disabled={isAlreadyReviewed}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approved" id="approve" />
                    <Label htmlFor="approve" className="cursor-pointer">Approve</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="needs_revision" id="needs_revision" />
                    <Label htmlFor="needs_revision" className="cursor-pointer">Needs Revision</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label className="font-medium">Comment {reviewStatus === "needs_revision" && <span className="text-destructive">*</span>}</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={reviewStatus === "needs_revision" ? "Please explain what needs to be revised..." : "Optional comment..."}
                  rows={3}
                  disabled={isAlreadyReviewed}
                />
                {incident.ld_review_comment && (
                  <p className="text-xs text-muted-foreground italic">
                    Previous comment: {incident.ld_review_comment}
                  </p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDraftPanel(!showDraftPanel)}
          >
            <PanelRightClose className={cn("h-4 w-4 mr-1", !showDraftPanel && "rotate-180")} />
            {showDraftPanel ? "Hide Draft" : "Show Draft"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!isAlreadyReviewed && (
              <Button 
                onClick={handleSubmitReview}
                disabled={ldReview.isPending || (reviewStatus === "needs_revision" && !comment)}
                className={reviewStatus === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
              >
                {ldReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {reviewStatus === "approved" ? "Approve" : "Request Revision"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Draft Editor */}
      {showDraftPanel && (
        <div className="w-[45%] border-l pl-4">
          <IncidentDraftEditor
            incident={incidentWithOverride as VanIncident}
            onSaveDraft={handleSaveDraft}
            onMarkReadyForOPS={async () => {
              await ldReview.mutateAsync({
                id: incident.id,
                ld_review_status: "approved",
                ld_review_comment: comment || undefined,
                ld_preventability_decision: preventability,
              });
              onClose();
            }}
            isSaving={isSavingDraft}
            isMarkingReady={ldReview.isPending}
            isLDView={!isAlreadyReviewed}
            isOPSView={false}
          />
        </div>
      )}
    </div>
  );
}
