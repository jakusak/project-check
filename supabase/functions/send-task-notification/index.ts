import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { taskTitle, taskType, priority, requestedBy, description, category } = await req.json();

    // Fetch team members with emails
    const { data: members, error: membersError } = await supabase
      .from("ops_team_members")
      .select("name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (membersError) throw membersError;

    const recipients = (members || []).filter((m: any) => m.email);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No recipients with emails" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabel = taskType === "facility" ? "Facilities & Building Request"
      : taskType === "supply" ? "Supply Request"
      : "Ops Task";

    const priorityUpper = (priority || "medium").charAt(0).toUpperCase() + (priority || "medium").slice(1);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
          New ${typeLabel} Submitted
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 12px; font-weight: bold; color: #555; width: 140px;">Title</td><td style="padding: 8px 12px;">${taskTitle}</td></tr>
          <tr style="background: #f9f9f9;"><td style="padding: 8px 12px; font-weight: bold; color: #555;">Priority</td><td style="padding: 8px 12px;">${priorityUpper}</td></tr>
          ${requestedBy ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #555;">Requested By</td><td style="padding: 8px 12px;">${requestedBy}</td></tr>` : ""}
          ${category ? `<tr style="background: #f9f9f9;"><td style="padding: 8px 12px; font-weight: bold; color: #555;">Category</td><td style="padding: 8px 12px;">${category}</td></tr>` : ""}
        </table>
        ${description ? `<div style="margin: 16px 0; padding: 12px; background: #f5f5f5; border-radius: 6px;"><strong>Description:</strong><br/>${description}</div>` : ""}
        <p style="color: #888; font-size: 12px; margin-top: 24px;">— Backroads Ops Dashboard</p>
      </div>
    `;

    // Send to each recipient individually
    const results = await Promise.allSettled(
      recipients.map(async (member: any) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "ops@backroads.com",
            to: [member.email],
            subject: `[OPS] New ${typeLabel}: ${taskTitle}`,
            html: emailHtml,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to send to ${member.email}: ${err}`);
        }
        return await res.json();
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`Task notification: sent=${sent}, failed=${failed}`);

    return new Response(JSON.stringify({ success: true, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending task notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
