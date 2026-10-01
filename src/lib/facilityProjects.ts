import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export const HUBS = [
  { key: 'fr', label: '801 FR Campus', legacy: 'provence' },
  { key: 'cz', label: 'Czech', legacy: 'czech' },
  { key: 'it', label: 'Tuscany', legacy: 'tuscany' },
  { key: 'hr', label: 'Croatia', legacy: 'croatia' },
] as const;
export const hubName = (key: string) => HUBS.find(h => h.key === key)?.label ?? key;
export const projectHub = (legacy: string) => HUBS.find(h => h.legacy === legacy)?.key ?? 'fr';
export const dateLabel = (value?: string | null) => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)) : 'No date';
export const todayParis = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const daysFromNow = (date: string) => Math.round((new Date(`${date.slice(0, 10)}T12:00:00Z`).getTime() - new Date(`${todayParis()}T12:00:00Z`).getTime()) / 86400000);
export type Project = { id: string; title: string; hub: string; site: string | null; summary: string | null; owner_id: string | null; co_owner_id: string | null; contractor_id: string | null; status: string; health: string; health_note: string | null; priority: string; start_date: string | null; target_date: string | null; completed_date: string | null; decision_needed: boolean; decision_note: string | null; next_step: string | null; last_reviewed_at: string | null; created_at: string; updated_at: string };
export type Milestone = { id: string; project_id: string; title: string; owner_id: string | null; due_date: string | null; done: boolean; done_date: string | null; type: string; notes: string | null; sort_order: number };
export type Dependency = { id: string; project_id: string; depends_on_project_id: string | null; depends_on_milestone_id: string | null; note: string | null };
export type Contractor = { id: string; company_name: string; contact_name: string | null; phone: string | null; email: string | null; trade: string | null; hub: string; notes: string | null };
export type ProjectUpdate = { id: string; project_id: string; author_id: string | null; created_at: string; text: string; kind: string };
export function useFacilityData() {
  const projects = useQuery({ queryKey: ['facility-projects'], queryFn: async () => { const { data, error } = await supabase.from('facility_projects').select('*').order('created_at'); if (error) throw error; return data as Project[]; } });
  const milestones = useQuery({ queryKey: ['facility-milestones'], queryFn: async () => { const { data, error } = await supabase.from('facility_milestones').select('*').order('due_date'); if (error) throw error; return data as Milestone[]; } });
  const dependencies = useQuery({ queryKey: ['facility-dependencies'], queryFn: async () => { const { data, error } = await supabase.from('facility_dependencies').select('*'); if (error) throw error; return data as Dependency[]; } });
  const contractors = useQuery({ queryKey: ['facility-contractors'], queryFn: async () => { const { data, error } = await supabase.from('facility_contractors').select('*').order('company_name'); if (error) throw error; return data as Contractor[]; } });
  return { projects: projects.data ?? [], milestones: milestones.data ?? [], dependencies: dependencies.data ?? [], contractors: contractors.data ?? [], loading: projects.isLoading || milestones.isLoading, error: projects.error || milestones.error };
}
export function useFacilityEdit(hub: string) {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const access = useQuery({ queryKey: ['facility-edit', user?.id, hub], enabled: !!user, queryFn: async () => { const { data, error } = await supabase.rpc('can_edit_facility', { _hub: hub }); if (error) throw error; return !!data; } });
  return { canEdit: !!user && (isAdmin || isSuperAdmin || !!access.data), isLoading: access.isLoading };
}
export function useFacilityMutation() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: async ({ table, values, id }: { table: 'facility_projects' | 'facility_milestones' | 'facility_dependencies' | 'facility_contractors' | 'facility_project_updates' | 'facility_weekly_notes'; values: Record<string, unknown>; id?: string }) => {
    let result;
    if (table === 'facility_weekly_notes') result = await supabase.from(table).upsert(values as any, { onConflict: 'week_start' });
    else if (id) result = await supabase.from(table).update(values as any).eq('id', id);
    else result = await supabase.from(table).insert(values as any);
    if (result.error) throw result.error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['facility-projects'] }); qc.invalidateQueries({ queryKey: ['facility-milestones'] }); qc.invalidateQueries({ queryKey: ['facility-dependencies'] }); qc.invalidateQueries({ queryKey: ['facility-contractors'] }); qc.invalidateQueries({ queryKey: ['facility-updates'] }); qc.invalidateQueries({ queryKey: ['facility-weekly-notes'] }); toast.success('Saved'); }, onError: (error: Error) => toast.error(error.message) });
  return mutation;
}
export function healthClass(health: string) { return health === 'On track' ? 'text-accent' : health === 'At risk' ? 'text-amber-700 dark:text-amber-400' : 'text-destructive'; }
