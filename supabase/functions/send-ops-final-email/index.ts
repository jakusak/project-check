import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OPSEmailRequest {
  incidentId: string;
  recipientEmail: string;
  recipientName: string;
  emailSubject: string;
  emailBody: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-ops-final-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incidentId, recipientEmail, recipientName, emailSubject, emailBody }: OPSEmailRequest = await req.json();
    
    console.log(`Sending OPS final email for incident ${incidentId} to ${recipientEmail}`);

    // Send the final email to the field staff
    const emailResponse = await resend.emails.send({
      from: "Backroads Ops <onboarding@resend.dev>",
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Van Incident Update</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName || 'Team Member'},</p>
              
              ${emailBody}
              
              <p style="margin-top: 24px;"><strong>Best regards,<br>OPS Team Global</strong></p>
            </div>
            <div class="footer">
              <p>Backroads Operations Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("OPS email response:", JSON.stringify(emailResponse));

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

    // Update the incident to mark OPS email as sent
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("van_incidents")
      .update({ 
        ops_email_sent_at: new Date().toISOString(),
        status: "closed",
        fs_communication_status: "sent",
        ld_draft_status: "sent"
      })
      .eq("id", incidentId);

    if (updateError) {
      console.error("Failed to update incident:", updateError);
    } else {
      console.log("Updated incident status for:", incidentId);
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ops-final-email function:", error);
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
