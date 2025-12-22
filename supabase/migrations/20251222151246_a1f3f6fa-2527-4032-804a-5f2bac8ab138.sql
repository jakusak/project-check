-- Add tracking columns for incident communication workflow
ALTER TABLE public.van_incidents
ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ld_communication_status text DEFAULT 'not_sent' CHECK (ld_communication_status IN ('not_sent', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS fs_communication_status text DEFAULT 'not_sent' CHECK (fs_communication_status IN ('sent', 'not_sent'));