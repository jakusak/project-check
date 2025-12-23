-- Create table for incident review comments (threaded discussion between LD and OPS)
CREATE TABLE public.incident_review_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.van_incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add column to store LD-edited email draft on van_incidents
ALTER TABLE public.van_incidents 
ADD COLUMN ld_edited_draft JSONB,
ADD COLUMN ld_cost_bucket_override TEXT;

-- Enable RLS
ALTER TABLE public.incident_review_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_review_comments
CREATE POLICY "Admins can manage all comments"
ON public.incident_review_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OPX can view comments for incidents in their areas"
ON public.incident_review_comments
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM van_incidents vi
    JOIN opx_area_assignments oa ON oa.ops_area = vi.ops_area
    WHERE vi.id = incident_review_comments.incident_id AND oa.user_id = auth.uid()
  )
);

CREATE POLICY "OPX can create comments on incidents in their areas"
ON public.incident_review_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM van_incidents vi
      JOIN opx_area_assignments oa ON oa.ops_area = vi.ops_area
      WHERE vi.id = incident_review_comments.incident_id AND oa.user_id = auth.uid()
    )
  )
);