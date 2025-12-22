import { useState, useEffect } from "react";
import { VanIncident, LDDraftContent, useSendOPSEmail } from "@/hooks/useVanIncidents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Loader2, CheckCircle, AlertCircle, Edit2, Eye
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface OPSSendEmailPanelProps {
  incident: VanIncident;
  onClose: () => void;
}

export function OPSSendEmailPanel({ incident, onClose }: OPSSendEmailPanelProps) {
  const draft = incident.ld_draft_content as LDDraftContent | null;
  const sendEmail = useSendOPSEmail();
  const [isEditing, setIsEditing] = useState(false);
  
  // Build initial email content from the draft
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    if (draft) {
      setEmailSubject(`Van Incident Follow-up - ${incident.van_id} (${format(new Date(incident.incident_date), "MMM d, yyyy")})`);
      
      const preventability = incident.ld_preventability_decision === "non_preventable" 
        ? "non-preventable" 
        : "preventable";
      
      const bodyContent = `Dear Team Member,

This email is regarding the van incident involving ${incident.van_id} on ${format(new Date(incident.incident_date), "MMMM d, yyyy")}.

INCIDENT SUMMARY:
${draft.incident_summary}

DAMAGE ASSESSMENT:
- Damaged Components: ${draft.ai_damage_review?.damaged_components?.join(", ") || "N/A"}
- Estimated Repair Cost: ${draft.ai_damage_review?.cost_range || "Under assessment"}
- Severity: ${draft.ai_damage_review?.severity || "N/A"}

DETERMINATION:
This incident has been determined to be ${preventability}.

CONSEQUENCE GUIDANCE:
${draft.consequence_guidance?.suggested_consequences || "To be determined based on review."}

Performance Points Impact: ${draft.consequence_guidance?.performance_points_impact || "N/A"}
${draft.consequence_guidance?.additional_measures ? `Additional Measures: ${draft.consequence_guidance.additional_measures}` : ""}

If you have any questions about this determination, please contact your Operations Manager.

Best regards,
Operations Team`;
      
      setEmailBody(bodyContent);
    }
  }, [draft, incident]);

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

  const isAlreadySent = !!incident.ops_email_sent_at;
  const isLDApproved = incident.ld_review_status === "approved";

  if (!isLDApproved && !isAlreadySent) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h4 className="font-medium mb-2">LD Review Required</h4>
        <p className="text-sm text-muted-foreground">
          This incident must be reviewed and approved by LD before sending the email to field staff.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
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

          {incident.ld_review_comment && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">LD Comment:</p>
              <p className="text-sm italic">{incident.ld_review_comment}</p>
            </div>
          )}

          <Separator />

          {/* Email Preview/Edit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Email to Field Staff</Label>
              {!isAlreadySent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Eye className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
                  {isEditing ? "Preview" : "Edit"}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Subject</Label>
              {isEditing && !isAlreadySent ? (
                <Textarea
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  rows={1}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm font-medium bg-muted/50 p-2 rounded">{emailSubject}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Body</Label>
              {isEditing && !isAlreadySent ? (
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={15}
                  className="font-mono text-xs"
                />
              ) : (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap font-sans">{emailBody}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {!isAlreadySent && (
          <Button
            onClick={handleSend}
            disabled={sendEmail.isPending || !emailSubject.trim() || !emailBody.trim()}
          >
            {sendEmail.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Send Email
          </Button>
        )}
      </div>
    </div>
  );
}