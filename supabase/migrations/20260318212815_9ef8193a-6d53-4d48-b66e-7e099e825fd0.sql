
-- Enums for ops tasks
CREATE TYPE public.ops_task_status AS ENUM (
  'new_request', 'triaged', 'planned', 'in_progress', 'blocked', 'waiting', 'done', 'cannot_complete', 'cancelled'
);

CREATE TYPE public.ops_task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE public.ops_task_category AS ENUM (
  'trailer_management', 'facilities', 'trailer_overhaul', 'building_requests', 
  'build_trays', 'racking_unracking', 'spare_parts', 'interior_build', 'other'
);

CREATE TYPE public.ops_recurring_frequency AS ENUM (
  'none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
);

-- Team members table
CREATE TABLE public.ops_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'executor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks table
CREATE TABLE public.ops_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category ops_task_category NOT NULL DEFAULT 'other',
  priority ops_task_priority NOT NULL DEFAULT 'medium',
  status ops_task_status NOT NULL DEFAULT 'new_request',
  requested_by TEXT,
  current_owner_id UUID REFERENCES public.ops_team_members(id),
  primary_owner_id UUID REFERENCES public.ops_team_members(id),
  secondary_owner_id UUID REFERENCES public.ops_team_members(id),
  rightful_owner_id UUID REFERENCES public.ops_team_members(id),
  location TEXT,
  requested_due_date DATE,
  start_date DATE,
  target_end_date DATE,
  actual_completion_date DATE,
  planned_week TEXT,
  planned_month TEXT,
  estimated_hours NUMERIC,
  recurring_frequency ops_recurring_frequency NOT NULL DEFAULT 'none',
  blocker_reason TEXT,
  definition_of_done TEXT,
  completion_evidence TEXT,
  work_type TEXT DEFAULT 'manual',
  task_mode TEXT DEFAULT 'operational',
  notes TEXT,
  photo_paths TEXT[],
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task history / audit trail
CREATE TABLE public.ops_task_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.ops_tasks(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ops_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_task_history ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can view and manage (internal tool)
CREATE POLICY "Authenticated users can view ops team members" ON public.ops_team_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage ops team members" ON public.ops_team_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can view ops tasks" ON public.ops_tasks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create ops tasks" ON public.ops_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage ops tasks" ON public.ops_tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Authenticated users can update ops tasks" ON public.ops_tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view ops task history" ON public.ops_task_history FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create ops task history" ON public.ops_task_history FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_ops_team_members_updated_at BEFORE UPDATE ON public.ops_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ops_tasks_updated_at BEFORE UPDATE ON public.ops_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
