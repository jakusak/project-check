import { useState, useEffect } from "react";
import { VanIncident, LDDraftContent } from "@/hooks/useVanIncidents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mail, Save, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIncidentReviewComments, useAddIncidentComment } from "@/hooks/useIncidentReviewComments";
import { useAuth } from "@/integrations/supabase/auth";

interface IncidentDraftEditorProps {
  incident: VanIncident;
  onSaveDraft: (draft: { subject: string; body: string }) => Promise<void>;
  isSaving?: boolean;
  readOnly?: boolean;
}

// Policy consequence logic
function getConsequenceDetails(costBucket: string, incidentNumber: number) {
  if (incidentNumber >= 3) {
    return {
      title: "THIRD+ INCIDENT of Season",
      costLabel: null,
      mandatory: ["May result in termination", "Application of maximum penalties regardless of cost"],
      optional: [],
      note: "Any THIRD incident may result in termination or application of max penalties regardless of cost."
    };
  }
  
  if (incidentNumber === 2) {
    return {
      title: "SECOND INCIDENT of Season",
      costLabel: "Any Cost at All",
      mandatory: ["Loss of additional 6 Performance Points"],
      optional: ["Termination"],
      note: "Policy indicates additional loss of 6 performance points for a second incident."
    };
  }
  
  if (costBucket === "under_1500") {
    return {
      title: "FIRST INCIDENT of Season",
      costLabel: "Less than €1,500",
      mandatory: ["Loss of 4 Performance Points"],
      optional: [],
      note: null
    };
  } else if (costBucket === "1500_to_3500") {
    return {
      title: "FIRST INCIDENT of Season",
      costLabel: "€1,500 to €3,500",
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
      costLabel: "Over €3,500",
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
}

function generateEmailBody(incident: VanIncident, draft: LDDraftContent | null, costBucket: string) {
  const preventability = incident.ld_preventability_decision === "non_preventable" 
    ? "non-preventable" 
    : "preventable";
  
  const incidentNumber = incident.driver_incident_count_this_season || 1;
  const consequences = getConsequenceDetails(costBucket, incidentNumber);
  
  const mandatoryList = consequences.mandatory.map(item => `  • ${item}`).join("\n");
  const optionalList = consequences.optional.length > 0 
    ? consequences.optional.map(item => `  • ${item} (optional)`).join("\n")
    : "";

  return `Dear Team Member,

We are following up regarding the van incident on ${format(new Date(incident.incident_date), "MMMM d, yyyy")} involving vehicle ${incident.van_id}.

INCIDENT SUMMARY:
${draft?.incident_summary || incident.description}

LOCATION: ${incident.location_text}
WEATHER CONDITIONS: ${incident.weather}

DAMAGE ASSESSMENT:
${draft?.ai_damage_review?.damaged_components?.length ? 
  `Damaged Components: ${draft.ai_damage_review.damaged_components.join(", ")}` : 
  "See attached photos for damage details."}
${draft?.ai_damage_review?.cost_range ? `Estimated Repair Cost: ${draft.ai_damage_review.cost_range}` : ""}

DETERMINATION:
This incident has been determined to be ${preventability}.

POLICY CONSEQUENCES:
${consequences.title}${consequences.costLabel ? ` (${consequences.costLabel})` : ""}

Mandatory:
${mandatoryList}
${optionalList ? `\nOptional:\n${optionalList}` : ""}
${consequences.note ? `\nNote: ${consequences.note}` : ""}

All penalties apply for 1 calendar year.

If you have any questions about this determination, please contact your Operations Manager.

Best regards,
Backroads OPS Team`;
}

export function IncidentDraftEditor({ incident, onSaveDraft, isSaving, readOnly }: IncidentDraftEditorProps) {
  const draft = incident.ld_draft_content as LDDraftContent | null;
  const existingEditedDraft = incident.ld_edited_draft as { subject?: string; body?: string } | null;
  
  // Use override cost bucket if set, otherwise AI bucket
  const effectiveCostBucket = incident.ld_cost_bucket_override || incident.ai_cost_bucket || "1500_to_3500";
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [newComment, setNewComment] = useState("");
  
  const { user } = useAuth();
  const { data: comments, isLoading: commentsLoading } = useIncidentReviewComments(incident.id);
  const addComment = useAddIncidentComment();

  useEffect(() => {
    // Priority: edited draft > generate from template
    if (existingEditedDraft?.subject && existingEditedDraft?.body) {
      setEmailSubject(existingEditedDraft.subject);
      setEmailBody(existingEditedDraft.body);
    } else {
      setEmailSubject(`Van Incident Follow-up - ${incident.van_id} (${format(new Date(incident.incident_date), "MMM d, yyyy")})`);
      setEmailBody(generateEmailBody(incident, draft, effectiveCostBucket));
    }
  }, [incident, draft, effectiveCostBucket, existingEditedDraft]);

  // Regenerate body when cost bucket changes (from override)
  useEffect(() => {
    if (incident.ld_cost_bucket_override) {
      setEmailBody(generateEmailBody(incident, draft, effectiveCostBucket));
    }
  }, [incident.ld_cost_bucket_override]);

  async function handleSave() {
    await onSaveDraft({ subject: emailSubject, body: emailBody });
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    await addComment.mutateAsync({ incidentId: incident.id, comment: newComment.trim() });
    setNewComment("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Email Draft Section */}
      <div className="flex-1 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Field Staff Email Draft
          </h4>
          {!readOnly && (
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              disabled={readOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email Body</Label>
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              disabled={readOnly}
              rows={15}
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Threaded Comments Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Review Comments</h4>
        
        <ScrollArea className="h-32 border rounded-lg p-2">
          {commentsLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Loading comments...</p>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className={cn(
                  "p-2 rounded-lg text-xs",
                  c.user_id === user?.id ? "bg-primary/10 ml-4" : "bg-muted mr-4"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{c.user?.full_name || "Unknown"}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(c.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-foreground">{c.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No comments yet</p>
          )}
        </ScrollArea>

        {!readOnly && (
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment for LD/OPS..."
              className="flex-1 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <Button 
              size="sm" 
              onClick={handleAddComment}
              disabled={addComment.isPending || !newComment.trim()}
            >
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
