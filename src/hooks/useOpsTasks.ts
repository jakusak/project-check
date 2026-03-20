import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type OpsTaskStatus = 'new_request' | 'triaged' | 'planned' | 'in_progress' | 'blocked' | 'waiting' | 'done' | 'cannot_complete' | 'cancelled';
export type OpsTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type OpsTaskCategory = 'trailer_management' | 'facilities' | 'trailer_overhaul' | 'building_requests' | 'build_trays' | 'racking_unracking' | 'spare_parts' | 'interior_build' | 'other';
export type OpsRecurringFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export interface OpsTeamMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
}

export interface OpsTask {
  id: string;
  title: string;
  description: string | null;
  category: OpsTaskCategory;
  priority: OpsTaskPriority;
  status: OpsTaskStatus;
  requested_by: string | null;
  main_owner_id: string | null;
  other_owner_id: string | null;
  location: string | null;
  requested_due_date: string | null;
  start_date: string | null;
  target_end_date: string | null;
  actual_completion_date: string | null;
  planned_week: string | null;
  planned_month: string | null;
  estimated_hours: number | null;
  recurring_frequency: OpsRecurringFrequency;
  blocker_reason: string | null;
  definition_of_done: string | null;
  completion_evidence: string | null;
  work_type: string | null;
  task_mode: string | null;
  notes: string | null;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
  // Joined
  main_owner?: OpsTeamMember;
  other_owner?: OpsTeamMember;
}

export interface OpsTaskHistory {
  id: string;
  task_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export function useOpsTeamMembers() {
  return useQuery({
    queryKey: ["ops-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_team_members")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as OpsTeamMember[];
    },
  });
}

export function useOpsTasks() {
  return useQuery({
    queryKey: ["ops-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_tasks")
        .select(`
          *,
          main_owner:ops_team_members!ops_tasks_main_owner_id_fkey(id, name, role),
          other_owner:ops_team_members!ops_tasks_other_owner_id_fkey(id, name, role)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OpsTask[];
    },
  });
}

export function useOpsTaskHistory(taskId: string) {
  return useQuery({
    queryKey: ["ops-task-history", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_task_history")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OpsTaskHistory[];
    },
    enabled: !!taskId,
  });
}

export function useCreateOpsTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<OpsTask>) => {
      const { data, error } = await supabase
        .from("ops_tasks")
        .insert(task as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-tasks"] });
      toast({ title: "Task created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error creating task", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateOpsTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, historyEntry }: { id: string; updates: Partial<OpsTask>; historyEntry?: Partial<OpsTaskHistory> }) => {
      const { error } = await supabase
        .from("ops_tasks")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      
      if (historyEntry) {
        await supabase.from("ops_task_history").insert({
          task_id: id,
          ...historyEntry,
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-tasks"] });
      toast({ title: "Task updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error updating task", description: err.message, variant: "destructive" });
    },
  });
}

// Utility constants
export const STATUS_LABELS: Record<OpsTaskStatus, string> = {
  new_request: "New Request",
  triaged: "Triaged",
  planned: "Planned",
  in_progress: "In Progress",
  blocked: "Blocked",
  waiting: "Waiting",
  done: "Done",
  cannot_complete: "Cannot Complete",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OpsTaskStatus, string> = {
  new_request: "bg-blue-100 text-blue-800",
  triaged: "bg-purple-100 text-purple-800",
  planned: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  blocked: "bg-red-100 text-red-800",
  waiting: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
  cannot_complete: "bg-gray-100 text-gray-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export const PRIORITY_COLORS: Record<OpsTaskPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export const CATEGORY_LABELS: Record<OpsTaskCategory, string> = {
  trailer_management: "Trailer Management",
  facilities: "Facilities",
  trailer_overhaul: "Trailer Overhaul",
  building_requests: "Building Requests",
  build_trays: "Build Trays",
  racking_unracking: "Racking / Unracking",
  spare_parts: "Spare Parts",
  interior_build: "Interior / Build",
  other: "Other",
};
