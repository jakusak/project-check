-- Add LD review fields to van_incidents
ALTER TABLE public.van_incidents
ADD COLUMN IF NOT EXISTS ld_review_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ld_review_comment text,
ADD COLUMN IF NOT EXISTS ld_reviewed_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS ld_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ld_preventability_decision text,
ADD COLUMN IF NOT EXISTS ops_email_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ops_email_sent_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS final_email_content jsonb;