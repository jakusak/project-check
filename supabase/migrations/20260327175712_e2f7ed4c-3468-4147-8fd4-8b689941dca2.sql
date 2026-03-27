
-- Workforce Roles / Job Descriptions
CREATE TABLE public.workforce_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL DEFAULT 'operations',
  assigned_person_name text,
  ops_team_member_id uuid REFERENCES public.ops_team_members(id),
  monthly_capacity_hours numeric NOT NULL DEFAULT 160,
  is_active boolean NOT NULL DEFAULT true,
  color text DEFAULT '#3B82F6',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workforce_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workforce roles"
  ON public.workforce_roles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workforce roles"
  ON public.workforce_roles FOR ALL TO public
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Workforce Planning Tasks
CREATE TABLE public.workforce_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  department text NOT NULL DEFAULT 'operations',
  assigned_role_id uuid REFERENCES public.workforce_roles(id),
  estimated_hours_per_month numeric NOT NULL DEFAULT 0,
  recurrence_type text NOT NULL DEFAULT 'monthly',
  active_months integer[] NOT NULL DEFAULT '{1,2,3,4,5,6,7,8,9,10,11,12}',
  priority text NOT NULL DEFAULT 'medium',
  skill_tags text[],
  is_reassignable boolean NOT NULL DEFAULT true,
  deadline_sensitivity text DEFAULT 'low',
  ops_task_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workforce_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workforce tasks"
  ON public.workforce_tasks FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage workforce tasks"
  ON public.workforce_tasks FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_workforce_roles_updated_at
  BEFORE UPDATE ON public.workforce_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workforce_tasks_updated_at
  BEFORE UPDATE ON public.workforce_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
