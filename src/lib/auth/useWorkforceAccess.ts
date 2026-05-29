import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns whether the current user is allowed into the Workforce Planning section.
 * Super admins always pass. Otherwise, the user must appear in
 * public.workforce_access_allowlist.
 */
export function useWorkforceAccess() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["workforce-access", user?.id],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_workforce_access", {
        _user_id: user.id,
      });
      if (error) throw error;
      return data === true;
    },
  });

  const hasAccess = data === true;
  const loading = authLoading || (!!user && isLoading);

  return { hasAccess, loading };
}
