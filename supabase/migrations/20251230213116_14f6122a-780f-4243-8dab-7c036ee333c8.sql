-- Create table to store fleet notice emails (drafts and sent)
CREATE TABLE public.fleet_notice_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID NOT NULL REFERENCES public.fleet_notices(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_notice_emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage emails
CREATE POLICY "Authenticated users can view emails"
  ON public.fleet_notice_emails FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert emails"
  ON public.fleet_notice_emails FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update emails"
  ON public.fleet_notice_emails FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_fleet_notice_emails_updated_at
  BEFORE UPDATE ON public.fleet_notice_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();