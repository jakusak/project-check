import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type SupplyRequest = {
  id: string;
  title: string;
  category: "kitchen_supplies" | "office_supplies";
  items: string;
  quantity: number;
  priority: "low" | "medium" | "high";
  notes: string | null;
  requested_by: string;
  status: "open" | "in_progress" | "closed";
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useSupplyRequests() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["supply-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SupplyRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (req: Omit<SupplyRequest, "id" | "created_at" | "updated_at" | "status" | "created_by_user_id">) => {
      const { error } = await supabase.from("supply_requests").insert({
        ...req,
        created_by_user_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supply-requests"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SupplyRequest["status"] }) => {
      const { error } = await supabase
        .from("supply_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supply-requests"] }),
  });

  return { ...query, createRequest, updateStatus };
}
