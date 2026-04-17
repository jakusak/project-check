-- Allowlist table for Fleet Violations module access
CREATE TABLE public.fleet_access_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  added_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fleet_access_allowlist ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (so the app can check their own membership)
CREATE POLICY "Authenticated can view fleet allowlist"
  ON public.fleet_access_allowlist FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins/super_admins can manage entries
CREATE POLICY "Admins manage fleet allowlist"
  ON public.fleet_access_allowlist FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Helper: SECURITY DEFINER check (super_admin always passes)
CREATE OR REPLACE FUNCTION public.has_fleet_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.fleet_access_allowlist WHERE user_id = _user_id);
$$;

-- Seed the three known users (Xavier will be added by the admin once his profile exists)
INSERT INTO public.fleet_access_allowlist (user_id, notes) VALUES
  ('e051f111-f756-4030-876f-6ccffac34b83', 'Massimo Zampieri'),
  ('5afc54c9-29a7-4764-9951-c8d5aaaf31e0', 'Vojtech Stanek'),
  ('1eb55c17-70d7-4985-b5d2-76f1f6bebca0', 'Nathalie Parize')
ON CONFLICT (user_id) DO NOTHING;