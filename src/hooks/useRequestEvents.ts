import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";

export type EventType = 'created' | 'approved' | 'rejected' | 'modified' | 'fulfilled' | 'shipped' | 'comment' | 'cancelled';

export interface RequestEvent {
  id: string;
  created_at: string;
  request_id: string;
  actor_user_id: string;
  event_type: EventType;
  event_notes: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  actor_email?: string;
}

export function useRequestEvents(requestId: string | undefined) {
  return useQuery({
    queryKey: ["request-events", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from("equipment_request_events")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Fetch actor emails
      const actorIds = [...new Set(data.map(e => e.actor_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", actorIds);
      
      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
      
      return data.map(event => ({
        ...event,
        actor_email: emailMap.get(event.actor_user_id) || "Unknown",
      })) as RequestEvent[];
    },
    enabled: !!requestId,
  });
}

export function useCreateRequestEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      requestId,
      eventType,
      eventNotes,
      oldValues,
      newValues,
    }: {
      requestId: string;
      eventType: EventType;
      eventNotes?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("equipment_request_events")
        .insert({
          request_id: requestId,
          actor_user_id: user?.id,
          event_type: eventType,
          event_notes: eventNotes || null,
          old_values: oldValues || null,
          new_values: newValues || null,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["request-events", variables.requestId] });
    },
  });
}

// Placeholder function for future NetSuite integration
export async function syncInventoryRequestToExternalSystem(requestId: string): Promise<void> {
  // TODO: Wire this to NetSuite inventory management system
  // This function should:
  // 1. Fetch the approved request details
  // 2. Map equipment items to NetSuite SKUs
  // 3. Call NetSuite API to adjust inventory
  // 4. Log the sync result to inventory_sync_logs table
  console.log(`[TODO] Sync request ${requestId} to external inventory system (NetSuite)`);
}
