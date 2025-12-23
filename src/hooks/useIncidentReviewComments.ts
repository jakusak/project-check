import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { toast } from "@/hooks/use-toast";

export interface IncidentReviewComment {
  id: string;
  incident_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: { full_name: string | null; email: string | null };
}

export function useIncidentReviewComments(incidentId: string) {
  return useQuery({
    queryKey: ["incident-review-comments", incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_review_comments")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(c => ({
        ...c,
        user: profileMap.get(c.user_id) || null,
      })) as IncidentReviewComment[];
    },
    enabled: !!incidentId,
  });
}

export function useAddIncidentComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ incidentId, comment }: { incidentId: string; comment: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("incident_review_comments")
        .insert({
          incident_id: incidentId,
          user_id: user.id,
          comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incident-review-comments", data.incident_id] });
      toast({ title: "Comment added" });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
