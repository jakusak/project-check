import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OPXInvite {
  email: string;
  opsAreas: string[];
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client for user management
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create regular client to verify requesting user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      console.error("Failed to get requesting user:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: requestingUser.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      console.error("User is not admin:", requestingUser.id);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invites }: { invites: OPXInvite[] } = await req.json();
    console.log(`Processing ${invites.length} OPX invitations`);

    const results: InviteResult[] = [];

    for (const invite of invites) {
      try {
        console.log(`Processing invite for: ${invite.email}`);

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === invite.email.toLowerCase());

        let userId: string;

        if (existingUser) {
          console.log(`User already exists: ${invite.email}`);
          userId = existingUser.id;
        } else {
          // Invite new user via Supabase Auth
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            invite.email.toLowerCase()
          );

          if (inviteError) {
            console.error(`Failed to invite ${invite.email}:`, inviteError);
            results.push({
              email: invite.email,
              success: false,
              error: inviteError.message
            });
            continue;
          }

          userId = inviteData.user.id;
          console.log(`Invited new user: ${invite.email}, userId: ${userId}`);
        }

        // Assign OPX role (upsert to avoid duplicates)
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert(
            { user_id: userId, role: 'opx' },
            { onConflict: 'user_id,role' }
          );

        if (roleError) {
          console.error(`Failed to assign OPX role to ${invite.email}:`, roleError);
          results.push({
            email: invite.email,
            success: false,
            error: `Role assignment failed: ${roleError.message}`
          });
          continue;
        }

        // Assign OPS Areas
        for (const opsArea of invite.opsAreas) {
          const { error: areaError } = await supabaseAdmin
            .from('opx_area_assignments')
            .upsert(
              { user_id: userId, ops_area: opsArea, assigned_by: requestingUser.id },
              { onConflict: 'user_id,ops_area', ignoreDuplicates: true }
            );

          if (areaError) {
            console.warn(`Failed to assign ${opsArea} to ${invite.email}:`, areaError);
          }
        }

        // Send welcome email using Resend
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Backroads Ops <onboarding@resend.dev>",
              to: [invite.email],
              subject: "Welcome to Backroads Ops Dashboard",
              html: `
                <h1>Welcome to Backroads Ops!</h1>
                <p>You've been invited as an Operations Expert (OPX) for the Backroads Ops Dashboard.</p>
                <p><strong>Your assigned Operations Areas:</strong></p>
                <ul>
                  ${invite.opsAreas.map(area => `<li>${area}</li>`).join('')}
                </ul>
                <p>Please check your email for a separate invitation link to set up your password and access the system.</p>
                <p>Once logged in, you'll be able to review and manage equipment requests from Field Staff in your assigned areas.</p>
                <br/>
                <p>Best regards,<br/>The Backroads Ops Team</p>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            console.warn(`Welcome email failed for ${invite.email}:`, errorData);
          }
        } catch (emailError) {
          console.warn(`Welcome email failed for ${invite.email}:`, emailError);
          // Don't fail the whole invite if welcome email fails
        }

        results.push({
          email: invite.email,
          success: true,
          userId: userId
        });

      } catch (error) {
        console.error(`Error processing ${invite.email}:`, error);
        results.push({
          email: invite.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`Completed: ${successCount} successful, ${failCount} failed`);

    return new Response(JSON.stringify({ results, successCount, failCount }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in bulk-invite-opx:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
