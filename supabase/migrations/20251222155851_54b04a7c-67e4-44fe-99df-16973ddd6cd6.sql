-- Add AI analysis and LD draft fields to van_incidents
ALTER TABLE public.van_incidents
ADD COLUMN IF NOT EXISTS ai_cost_bucket text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_severity text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_confidence text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_damaged_components text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_analysis_notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ld_draft_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ld_draft_content jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ld_draft_generated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ld_email_sent_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS driver_incident_count_this_season integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS vehicle_drivable boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS was_towed boolean DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.van_incidents.ai_cost_bucket IS 'AI-estimated cost bucket: under_1500, 1500_to_3500, over_3500';
COMMENT ON COLUMN public.van_incidents.ai_severity IS 'AI-assessed severity: cosmetic, structural, unclear';
COMMENT ON COLUMN public.van_incidents.ai_confidence IS 'AI confidence level: high, medium, low';
COMMENT ON COLUMN public.van_incidents.ld_draft_status IS 'LD draft status: pending, generated, reviewed, sent';