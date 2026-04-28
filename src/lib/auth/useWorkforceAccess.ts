import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns whether the current user is allowed into the Workforce Planning section.
 * Super admins always pass. Otherwise, the user must appear in
 * public.workforce_access_allowlist.
 */
export function useWorkforceAccess() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["workforce-access", user?.id],
    enabled: !!user && !isSuperAdmin,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("workforce_access_allowlist")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const hasAccess = isSuperAdmin || !!data;
  const loading = authLoading || (!!user && !isSuperAdmin && isLoading);

  return { hasAccess, loading };
}
