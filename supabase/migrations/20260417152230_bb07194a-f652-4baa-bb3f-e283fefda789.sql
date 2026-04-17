ALTER TABLE public.fleet_notices
  ADD COLUMN IF NOT EXISTS driver_claims_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_claims_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_claims_paid_note text,
  ADD COLUMN IF NOT EXISTS finance_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS finance_verified_by uuid;

CREATE POLICY "Finance can update fleet notices"
  ON public.fleet_notices
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'finance'::app_role));