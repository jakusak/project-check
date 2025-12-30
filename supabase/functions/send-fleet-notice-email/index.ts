import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FleetNoticeEmailRequest {
  noticeId: string;
  recipientEmail: string;
  recipientName: string;
  emailSubject: string;
  emailBody: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-fleet-notice-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noticeId, recipientEmail, recipientName, emailSubject, emailBody }: FleetNoticeEmailRequest = await req.json();
    
    console.log(`Sending fleet notice email for notice ${noticeId} to ${recipientEmail}`);

    // Validate required fields
    if (!recipientEmail || !emailSubject || !emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail, emailSubject, or emailBody" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Backroads Fleet <ops@backroads.com>",
      to: [recipientEmail],
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; white-space: pre-wrap; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fleet Violation Notice</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName || 'Driver'},</p>
              
              ${emailBody}
              
              <p style="margin-top: 24px;"><strong>Best regards,<br>Backroads Fleet Management</strong></p>
            </div>
            <div class="footer">
              <p>Backroads Fleet Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Fleet notice email response:", JSON.stringify(emailResponse));

    // Check if email was actually sent
    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error.message,
          note: "If using test mode, emails can only be sent to the verified account email. Verify a domain at resend.com/domains to send to other addresses."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save the email record to the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase
      .from("fleet_notice_emails")
      .insert({
        notice_id: noticeId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: emailSubject,
        body: emailBody,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to save email record:", insertError);
    } else {
      console.log("Email record saved for notice:", noticeId);
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-fleet-notice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
