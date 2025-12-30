import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Mail } from "lucide-react";
import { format } from "date-fns";

interface FleetNotice {
  id: string;
  notice_type: string;
  fine_amount: number | null;
  currency: string | null;
  violation_location: string | null;
  violation_datetime: string | null;
  deadline_date: string | null;
  license_plate: string | null;
  reference_number: string | null;
  driver?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
}

interface FleetNoticeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice: FleetNotice;
}

const PAYMENT_DETAILS = `
<div class="highlight">
<strong>Payment Details:</strong><br>
Bank: Backroads International Bank<br>
IBAN: XX00 0000 0000 0000 0000 00<br>
Reference: Please include the violation reference number
</div>
`;

export function FleetNoticeEmailDialog({ open, onOpenChange, notice }: FleetNoticeEmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Generate email content when dialog opens or notice changes
  useEffect(() => {
    if (open && notice) {
      // Pre-fill recipient info from driver if available
      if (notice.driver) {
        setRecipientName(notice.driver.name || "");
        setRecipientEmail(notice.driver.email || "");
      } else {
        setRecipientName("");
        setRecipientEmail("");
      }

      // Generate subject
      const typeLabel = notice.notice_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Violation";
      setEmailSubject(`Action Required: ${typeLabel} Notice - ${notice.reference_number || notice.id.slice(0, 8)}`);

      // Generate body
      const violationDate = notice.violation_datetime 
        ? format(new Date(notice.violation_datetime), "MMMM d, yyyy 'at' h:mm a")
        : "Date not specified";
      
      const deadlineDate = notice.deadline_date
        ? format(new Date(notice.deadline_date), "MMMM d, yyyy")
        : "as soon as possible";

      const fineAmount = notice.fine_amount 
        ? `${notice.currency || 'EUR'} ${notice.fine_amount.toFixed(2)}`
        : "Amount to be confirmed";

      const body = `
We are writing to inform you about a traffic violation associated with vehicle ${notice.license_plate || 'N/A'}.

<strong>Violation Details:</strong>
• Type: ${typeLabel}
• Date: ${violationDate}
• Location: ${notice.violation_location || 'Not specified'}
• Fine Amount: <strong>${fineAmount}</strong>
• Reference Number: ${notice.reference_number || 'N/A'}

<strong>Payment Deadline: ${deadlineDate}</strong>

This is a time-sensitive matter. Please arrange payment promptly to avoid additional penalties or late fees.

${PAYMENT_DETAILS}

If you have already made this payment or believe this notice was sent in error, please contact us immediately with proof of payment.

Thank you for your prompt attention to this matter.
      `.trim();

      setEmailBody(body);
    }
  }, [open, notice]);

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Please enter recipient email address");
      return;
    }

    if (!emailSubject || !emailBody) {
      toast.error("Subject and body are required");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-fleet-notice-email", {
        body: {
          noticeId: notice.id,
          recipientEmail,
          recipientName,
          emailSubject,
          emailBody,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success("Email sent successfully!");
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Violation Notice Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Driver Name</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Driver Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="driver@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject</Label>
            <Input
              id="emailSubject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">Email Body</Label>
            <Textarea
              id="emailBody"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Email content..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              You can use HTML tags like &lt;strong&gt;, &lt;br&gt;, etc. for formatting.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending || !recipientEmail}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
