import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WorkforceRole {
  id: string;
  name: string;
  department: string;
  assigned_person_name: string | null;
  ops_team_member_id: string | null;
  monthly_capacity_hours: number;
  vacation_weeks_per_year: number;
  is_active: boolean;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkforceTask {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  department: string;
  assigned_role_id: string | null;
  estimated_hours_per_month: number;
  recurrence_type: string;
  active_months: number[];
  priority: string;
  skill_tags: string[] | null;
  is_reassignable: boolean;
  deadline_sensitivity: string | null;
  ops_task_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  assigned_role?: WorkforceRole;
}

export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const RECURRENCE_OPTIONS = [
  { value: "one_time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "seasonal", label: "Seasonal" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const CATEGORY_OPTIONS = [
  "general", "trailer_management", "facilities", "building_requests",
  "supplies", "maintenance", "admin", "seasonal", "it", "other"
];

// Calculate task hours for a specific month
export function getTaskHoursForMonth(task: WorkforceTask, month: number): number {
  if (!task.active_months.includes(month)) return 0;
  
  switch (task.recurrence_type) {
    case "monthly":
      return task.estimated_hours_per_month;
    case "quarterly":
      return [1, 4, 7, 10].includes(month) ? task.estimated_hours_per_month : 0;
    case "seasonal":
    case "one_time":
      return task.estimated_hours_per_month;
    default:
      return task.estimated_hours_per_month;
  }
}

// Calculate monthly workload for a role
export function getRoleMonthlyWorkload(
  roleId: string, 
  tasks: WorkforceTask[], 
  month: number
): number {
  return tasks
    .filter(t => t.assigned_role_id === roleId)
    .reduce((sum, t) => sum + getTaskHoursForMonth(t, month), 0);
}

// Get effective monthly capacity after vacation adjustment
export function getEffectiveMonthlyCapacity(baseCapacity: number, vacationWeeks: number): number {
  // Spread vacation evenly across 12 months: vacationWeeks * 40h / 12
  const vacationHoursPerMonth = (vacationWeeks * 40) / 12;
  return Math.max(0, Math.round(baseCapacity - vacationHoursPerMonth));
}

// Get utilization percentage
export function getUtilization(workload: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.round((workload / capacity) * 100);
}

// Get utilization color class
export function getUtilizationColor(pct: number): string {
  if (pct > 100) return "bg-red-500";
  if (pct > 85) return "bg-orange-500";
  if (pct > 60) return "bg-yellow-500";
  if (pct > 30) return "bg-green-500";
  return "bg-slate-300";
}

export function getUtilizationBadge(pct: number): { label: string; className: string } {
  if (pct > 100) return { label: "Overloaded", className: "bg-red-100 text-red-800" };
  if (pct > 85) return { label: "Near Capacity", className: "bg-orange-100 text-orange-800" };
  if (pct > 60) return { label: "Balanced", className: "bg-green-100 text-green-800" };
  if (pct > 30) return { label: "Light", className: "bg-blue-100 text-blue-800" };
  return { label: "Underutilized", className: "bg-slate-100 text-slate-700" };
}

// ─── Hooks ───

export function useWorkforceRoles() {
  return useQuery({
    queryKey: ["workforce-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workforce_roles")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as unknown as WorkforceRole[];
    },
  });
}

export function useWorkforceTasks() {
  return useQuery({
    queryKey: ["workforce-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workforce_tasks")
        .select(`*, assigned_role:workforce_roles(*)`)
        .order("name");
      if (error) throw error;
      return data as unknown as WorkforceTask[];
    },
  });
}

export function useCreateWorkforceRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (role: Partial<WorkforceRole>) => {
      const { data, error } = await supabase
        .from("workforce_roles")
        .insert(role as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce-roles"] });
      toast({ title: "Role created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateWorkforceRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WorkforceRole> }) => {
      const { error } = await supabase.from("workforce_roles").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce-roles"] });
      toast({ title: "Role updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useCreateWorkforceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<WorkforceTask>) => {
      const { data, error } = await supabase
        .from("workforce_tasks")
        .insert(task as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce-tasks"] });
      toast({ title: "Task created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateWorkforceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WorkforceTask> }) => {
      const { error } = await supabase.from("workforce_tasks").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce-tasks"] });
      toast({ title: "Task updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteWorkforceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workforce_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce-tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
