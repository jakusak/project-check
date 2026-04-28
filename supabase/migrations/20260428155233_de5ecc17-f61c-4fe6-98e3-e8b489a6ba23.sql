-- Allowlist table for Workforce Planning access
CREATE TABLE public.workforce_access_allowlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  added_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.workforce_access_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage workforce allowlist"
ON public.workforce_access_allowlist
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated can view workforce allowlist"
ON public.workforce_access_allowlist
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Security definer function for workforce access check
CREATE OR REPLACE FUNCTION public.has_workforce_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.workforce_access_allowlist WHERE user_id = _user_id);
$$;