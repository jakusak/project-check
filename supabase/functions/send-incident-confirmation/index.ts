import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IncidentEmailRequest {
  incidentId: string;
  userEmail: string;
  userName: string;
  vanId: string;
  incidentDate: string;
  opsArea: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-incident-confirmation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incidentId, userEmail, userName, vanId, incidentDate, opsArea }: IncidentEmailRequest = await req.json();
    
    console.log(`Sending confirmation email for incident ${incidentId} to ${userEmail}`);

    // Send confirmation email to the submitter
    const emailResponse = await resend.emails.send({
      from: "Backroads OPS <ops@backroads.com>",
      to: [userEmail],
      subject: `Van Incident Report Received - ${vanId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Accident Report Received</h1>
            </div>
            <div class="content">
              <p>Dear ${userName || 'Team Member'},</p>
              
              <p>Thank you for submitting the accident form. We are sorry you have had an accident with a Backroads van – please don't panic, there are worse things that can happen.</p>
              
              <p>We will now take a couple of days to process the accident information and get back to you in case we have further questions.</p>
              
              <p>Thank you,</p>
              <p><strong>Best,<br>OPS Team Global</strong></p>
            </div>
            <div class="footer">
              <p>Reference: ${vanId} | ${incidentDate} | ${opsArea}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update the incident to mark email as sent
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("van_incidents")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", incidentId);

    if (updateError) {
      console.error("Failed to update email_sent_at:", updateError);
    } else {
      console.log("Updated email_sent_at for incident:", incidentId);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-incident-confirmation function:", error);
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
