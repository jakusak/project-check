import { useState, useEffect } from "react";
import { VanIncident, LDDraftContent, useSendOPSEmail } from "@/hooks/useVanIncidents";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Loader2, CheckCircle, AlertCircle, Save, User, Clock, Mail
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIncidentReviewComments, useAddIncidentComment } from "@/hooks/useIncidentReviewComments";
import { useAuth } from "@/integrations/supabase/auth";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface OPSSendEmailPanelProps {
  incident: VanIncident;
  onClose: () => void;
}

// Policy consequence logic (same as IncidentDraftEditor)
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

export function OPSSendEmailPanel({ incident, onClose }: OPSSendEmailPanelProps) {
  const draft = incident.ld_draft_content as LDDraftContent | null;
  const ldEditedDraft = incident.ld_edited_draft as { subject?: string; body?: string } | null;
  const effectiveCostBucket = incident.ld_cost_bucket_override || incident.ai_cost_bucket || "1500_to_3500";
  
  const sendEmail = useSendOPSEmail();
  const { user } = useAuth();
  const { data: comments, isLoading: commentsLoading } = useIncidentReviewComments(incident.id);
  const addComment = useAddIncidentComment();
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Priority: LD edited draft > generate from template
    if (ldEditedDraft?.subject && ldEditedDraft?.body) {
      setEmailSubject(ldEditedDraft.subject);
      setEmailBody(ldEditedDraft.body);
    } else if (draft) {
      setEmailSubject(`Van Incident Follow-up - ${incident.van_id} (${format(new Date(incident.incident_date), "MMM d, yyyy")})`);
      setEmailBody(generateEmailBody(incident, draft, effectiveCostBucket));
    }
  }, [incident.id]);

  function handleEmailChange(field: 'subject' | 'body', value: string) {
    if (field === 'subject') {
      setEmailSubject(value);
    } else {
      setEmailBody(value);
    }
    setHasUnsavedChanges(true);
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("van_incidents")
        .update({ ld_edited_draft: { subject: emailSubject, body: emailBody } })
        .eq("id", incident.id);
      
      if (error) throw error;
      toast({ title: "Draft saved" });
      setHasUnsavedChanges(false);
    } catch (err) {
      toast({ title: "Failed to save draft", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSend() {
    const emailContent: Record<string, unknown> = {
      subject: emailSubject,
      body: emailBody,
      sent_at: new Date().toISOString(),
    };
    
    await sendEmail.mutateAsync({
      id: incident.id,
      final_email_content: emailContent as unknown as Json,
    });
    onClose();
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    await addComment.mutateAsync({ incidentId: incident.id, comment: newComment.trim() });
    setNewComment("");
  }

  const isAlreadySent = !!incident.ops_email_sent_at;
  const isLDApproved = incident.ld_review_status === "approved";

  if (!isLDApproved && !isAlreadySent) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h4 className="font-medium mb-2">LD Review Required</h4>
        <p className="text-sm text-muted-foreground">
          This incident must be reviewed and marked "Ready for OPS" by LD before sending the email to field staff.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[70vh]">
      {/* Left Panel - Email Editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Final Email to Field Staff</h4>
            {hasUnsavedChanges && <span className="text-xs text-amber-600">(unsaved)</span>}
          </div>
          
          {/* Status Badges */}
          <div className="flex gap-2">
            {isLDApproved && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                LD Approved
              </Badge>
            )}
            {incident.ld_preventability_decision && (
              <Badge variant="outline" className={cn(
                incident.ld_preventability_decision === "preventable" 
                  ? "border-red-300 text-red-700" 
                  : "border-green-300 text-green-700"
              )}>
                {incident.ld_preventability_decision === "preventable" ? "Preventable" : "Non-Preventable"}
              </Badge>
            )}
            {isAlreadySent && (
              <Badge className="bg-blue-100 text-blue-800">
                <Send className="h-3 w-3 mr-1" />
                Sent {incident.ops_email_sent_at && format(new Date(incident.ops_email_sent_at), "MMM d")}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            <div>
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => handleEmailChange('subject', e.target.value)}
                disabled={isAlreadySent}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email Body</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => handleEmailChange('body', e.target.value)}
                disabled={isAlreadySent}
                rows={20}
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!isAlreadySent && (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || !hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={handleSend}
                disabled={sendEmail.isPending || !emailSubject.trim() || !emailBody.trim()}
              >
                {sendEmail.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Send Email
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Comments */}
      <div className="w-[35%] border-l pl-4 flex flex-col">
        <h4 className="font-semibold text-sm mb-4">Review Comments (LD ↔ OPS)</h4>
        
        <ScrollArea className="flex-1 border rounded-lg p-2 mb-4">
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

        {!isAlreadySent && (
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
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

        {/* LD Review Comment */}
        {incident.ld_review_comment && (
          <div className="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-xs font-medium text-amber-800 mb-1">LD Review Comment:</p>
            <p className="text-sm italic text-amber-700">{incident.ld_review_comment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
