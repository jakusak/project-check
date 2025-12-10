import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";

export interface CycleCount {
  id: string;
  created_at: string;
  created_by_user_id: string;
  ops_area: string;
  location_name: string;
  status: "submitted" | "validated" | "rejected";
  validated_at: string | null;
  validated_by: string | null;
  rejection_note: string | null;
  updated_at: string;
  creator_email?: string;
}

export interface CycleCountLine {
  id: string;
  cycle_count_id: string;
  equipment_item_id: string | null;
  sku: string;
  recorded_qty: number;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
  equipment_name?: string;
}

export interface CycleCountEvent {
  id: string;
  created_at: string;
  cycle_count_id: string;
  actor_user_id: string;
  event_type: string;
  event_notes: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  actor_email?: string;
}

interface CreateCycleCountInput {
  ops_area: string;
  location_name: string;
  lines: {
    equipment_item_id: string | null;
    sku: string;
    recorded_qty: number;
    notes: string | null;
    photo_path: string | null;
  }[];
}

// Fetch user's own cycle counts
export function useMyCycleCounts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["cycle-counts", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("cycle_counts")
        .select("*")
        .eq("created_by_user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as CycleCount[];
    },
    enabled: !!user,
  });
}

// Fetch cycle counts for OPX/Admin review
export function useCycleCountsForReview(statusFilter?: string) {
  return useQuery({
    queryKey: ["cycle-counts", "review", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("cycle_counts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (statusFilter && statusFilter !== "__all__") {
        query = query.eq("status", statusFilter as "submitted" | "validated" | "rejected");
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch creator emails
      const userIds = [...new Set(data.map(cc => cc.created_by_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      
      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
      
      return data.map(cc => ({
        ...cc,
        creator_email: emailMap.get(cc.created_by_user_id) || "Unknown",
      })) as CycleCount[];
    },
  });
}

// Fetch a single cycle count with lines
export function useCycleCountDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["cycle-count", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: cycleCount, error: ccError } = await supabase
        .from("cycle_counts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (ccError) throw ccError;
      if (!cycleCount) return null;
      
      const { data: lines, error: linesError } = await supabase
        .from("cycle_count_lines")
        .select("*")
        .eq("cycle_count_id", id);
      
      if (linesError) throw linesError;
      
      // Get equipment names
      const equipmentIds = lines
        .map(l => l.equipment_item_id)
        .filter(Boolean) as string[];
      
      let equipmentMap = new Map<string, string>();
      if (equipmentIds.length > 0) {
        const { data: equipment } = await supabase
          .from("equipment_items")
          .select("id, name")
          .in("id", equipmentIds);
        equipmentMap = new Map(equipment?.map(e => [e.id, e.name]) || []);
      }
      
      // Get creator email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", cycleCount.created_by_user_id)
        .maybeSingle();
      
      return {
        ...cycleCount,
        creator_email: profile?.email || "Unknown",
        lines: lines.map(l => ({
          ...l,
          equipment_name: l.equipment_item_id ? equipmentMap.get(l.equipment_item_id) : undefined,
        })),
      } as CycleCount & { lines: CycleCountLine[] };
    },
    enabled: !!id,
  });
}

// Fetch cycle count events
export function useCycleCountEvents(cycleCountId: string | undefined) {
  return useQuery({
    queryKey: ["cycle-count-events", cycleCountId],
    queryFn: async () => {
      if (!cycleCountId) return [];
      
      const { data, error } = await supabase
        .from("cycle_count_events")
        .select("*")
        .eq("cycle_count_id", cycleCountId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Get actor emails
      const actorIds = [...new Set(data.map(e => e.actor_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", actorIds);
      
      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
      
      return data.map(e => ({
        ...e,
        actor_email: emailMap.get(e.actor_user_id) || "Unknown",
      })) as CycleCountEvent[];
    },
    enabled: !!cycleCountId,
  });
}

// Create a new cycle count
export function useCreateCycleCount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (input: CreateCycleCountInput) => {
      if (!user) throw new Error("Not authenticated");
      
      // Create the cycle count
      const { data: cycleCount, error: ccError } = await supabase
        .from("cycle_counts")
        .insert({
          created_by_user_id: user.id,
          ops_area: input.ops_area,
          location_name: input.location_name,
        })
        .select()
        .single();
      
      if (ccError) throw ccError;
      
      // Create the lines
      const linesData = input.lines.map(line => ({
        cycle_count_id: cycleCount.id,
        equipment_item_id: line.equipment_item_id,
        sku: line.sku,
        recorded_qty: line.recorded_qty,
        notes: line.notes,
        photo_path: line.photo_path,
      }));
      
      const { error: linesError } = await supabase
        .from("cycle_count_lines")
        .insert(linesData);
      
      if (linesError) throw linesError;
      
      // Create creation event
      await supabase.from("cycle_count_events").insert({
        cycle_count_id: cycleCount.id,
        actor_user_id: user.id,
        event_type: "created",
        event_notes: `Cycle count submitted for ${input.location_name}`,
        new_values: { lines_count: input.lines.length },
      });
      
      return cycleCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-counts"] });
    },
  });
}

// Validate a cycle count
export function useValidateCycleCount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("cycle_counts")
        .update({
          status: "validated",
          validated_at: new Date().toISOString(),
          validated_by: user.id,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create validation event
      await supabase.from("cycle_count_events").insert({
        cycle_count_id: id,
        actor_user_id: user.id,
        event_type: "validated",
        event_notes: note || "Cycle count validated",
        old_values: { status: "submitted" },
        new_values: { status: "validated" },
      });
      
      // Call stub function
      syncValidatedCycleCountToExternalSystem(id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-counts"] });
      queryClient.invalidateQueries({ queryKey: ["cycle-count"] });
      queryClient.invalidateQueries({ queryKey: ["cycle-count-events"] });
    },
  });
}

// Reject a cycle count
export function useRejectCycleCount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("cycle_counts")
        .update({
          status: "rejected",
          rejection_note: note,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create rejection event
      await supabase.from("cycle_count_events").insert({
        cycle_count_id: id,
        actor_user_id: user.id,
        event_type: "rejected",
        event_notes: note,
        old_values: { status: "submitted" },
        new_values: { status: "rejected" },
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-counts"] });
      queryClient.invalidateQueries({ queryKey: ["cycle-count"] });
      queryClient.invalidateQueries({ queryKey: ["cycle-count-events"] });
    },
  });
}

// Upload photo for cycle count line
export async function uploadCycleCountPhoto(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `photos/${fileName}`;
  
  const { error } = await supabase.storage
    .from("cycle-count-photos")
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
}

// Get photo URL
export function getCycleCountPhotoUrl(path: string): string {
  const { data } = supabase.storage
    .from("cycle-count-photos")
    .getPublicUrl(path);
  return data.publicUrl;
}

// Stub function for external system sync
// TODO: Implement actual integration with external inventory system (e.g., NetSuite)
async function syncValidatedCycleCountToExternalSystem(cycleCountId: string): Promise<void> {
  console.log(`[STUB] syncValidatedCycleCountToExternalSystem called for cycle count: ${cycleCountId}`);
  // TODO: Implement actual sync to external inventory management system
  // This should send the validated cycle count data to the external system
  // for inventory reconciliation purposes
}
