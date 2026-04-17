ALTER TYPE public.fleet_notice_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.fleet_notice_status ADD VALUE IF NOT EXISTS 'email_sent';
ALTER TYPE public.fleet_notice_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE public.fleet_notice_status ADD VALUE IF NOT EXISTS 'finance_verified';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';