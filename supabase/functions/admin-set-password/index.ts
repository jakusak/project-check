import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || !email.trim()) return json({ error: "Email is required" }, 400);
    if (typeof password !== "string" || password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    const targetEmail = email.trim().toLowerCase();
    const isSelf = (caller.email ?? "").toLowerCase() === targetEmail;

    if (!isSelf) {
      const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
        admin.rpc("has_role", { _user_id: caller.id, _role: "admin" }),
        admin.rpc("has_role", { _user_id: caller.id, _role: "super_admin" }),
      ]);
      if (!isAdmin && !isSuper) return json({ error: "Admin access required" }, 403);
    }

    let targetId: string | null = isSelf ? caller.id : null;
    if (!targetId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", targetEmail)
        .maybeSingle();
      targetId = profile?.id ?? null;
    }
    if (!targetId) return json({ error: "No user found with that email" }, 404);

    const { error: updErr } = await admin.auth.admin.updateUserById(targetId, {
      password,
      email_confirm: true,
    });
    if (updErr) return json({ error: updErr.message }, 400);

    console.log(`Password set for ${targetId} by ${caller.id}`);
    return json({ success: true });
  } catch (e) {
    console.error("admin-set-password error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
