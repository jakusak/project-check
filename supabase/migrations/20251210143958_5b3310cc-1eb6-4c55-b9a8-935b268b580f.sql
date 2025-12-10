-- Create cycle count status enum
CREATE TYPE public.cycle_count_status AS ENUM ('submitted', 'validated', 'rejected');

-- Create cycle_counts table
CREATE TABLE public.cycle_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ops_area TEXT NOT NULL,
  location_name TEXT NOT NULL,
  status cycle_count_status NOT NULL DEFAULT 'submitted',
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cycle_count_lines table
CREATE TABLE public.cycle_count_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_count_id UUID NOT NULL REFERENCES public.cycle_counts(id) ON DELETE CASCADE,
  equipment_item_id UUID REFERENCES public.equipment_items(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  recorded_qty INTEGER NOT NULL,
  notes TEXT,
  photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cycle_count_events table for audit trail
CREATE TABLE public.cycle_count_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cycle_count_id UUID NOT NULL REFERENCES public.cycle_counts(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_notes TEXT,
  old_values JSONB,
  new_values JSONB
);

-- Enable RLS
ALTER TABLE public.cycle_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_count_events ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for cycle count photos
INSERT INTO storage.buckets (id, name, public) VALUES ('cycle-count-photos', 'cycle-count-photos', true);

-- RLS Policies for cycle_counts

-- Users can view their own cycle counts
CREATE POLICY "Users can view their own cycle counts"
ON public.cycle_counts FOR SELECT
USING (auth.uid() = created_by_user_id);

-- Users can create cycle counts
CREATE POLICY "Users can create cycle counts"
ON public.cycle_counts FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

-- OPX can view cycle counts for their assigned areas
CREATE POLICY "OPX can view cycle counts for their areas"
ON public.cycle_counts FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
    AND opx_area_assignments.ops_area = cycle_counts.ops_area
  )
);

-- OPX can update cycle counts for their assigned areas
CREATE POLICY "OPX can update cycle counts for their areas"
ON public.cycle_counts FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
    AND opx_area_assignments.ops_area = cycle_counts.ops_area
  )
);

-- Admins can view all cycle counts
CREATE POLICY "Admins can view all cycle counts"
ON public.cycle_counts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all cycle counts
CREATE POLICY "Admins can update all cycle counts"
ON public.cycle_counts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for cycle_count_lines

-- Users can view their cycle count lines
CREATE POLICY "Users can view their cycle count lines"
ON public.cycle_count_lines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cycle_counts
    WHERE cycle_counts.id = cycle_count_lines.cycle_count_id
    AND cycle_counts.created_by_user_id = auth.uid()
  )
);

-- Users can create cycle count lines
CREATE POLICY "Users can create cycle count lines"
ON public.cycle_count_lines FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cycle_counts
    WHERE cycle_counts.id = cycle_count_lines.cycle_count_id
    AND cycle_counts.created_by_user_id = auth.uid()
  )
);

-- OPX can view cycle count lines for their areas
CREATE POLICY "OPX can view cycle count lines for their areas"
ON public.cycle_count_lines FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM cycle_counts
    JOIN opx_area_assignments ON opx_area_assignments.ops_area = cycle_counts.ops_area
    WHERE cycle_counts.id = cycle_count_lines.cycle_count_id
    AND opx_area_assignments.user_id = auth.uid()
  )
);

-- Admins can view all cycle count lines
CREATE POLICY "Admins can view all cycle count lines"
ON public.cycle_count_lines FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for cycle_count_events

-- Users can view events for their cycle counts
CREATE POLICY "Users can view their cycle count events"
ON public.cycle_count_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cycle_counts
    WHERE cycle_counts.id = cycle_count_events.cycle_count_id
    AND cycle_counts.created_by_user_id = auth.uid()
  )
);

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can insert cycle count events"
ON public.cycle_count_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND actor_user_id = auth.uid());

-- OPX can view events for their areas
CREATE POLICY "OPX can view cycle count events for their areas"
ON public.cycle_count_events FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM cycle_counts
    JOIN opx_area_assignments ON opx_area_assignments.ops_area = cycle_counts.ops_area
    WHERE cycle_counts.id = cycle_count_events.cycle_count_id
    AND opx_area_assignments.user_id = auth.uid()
  )
);

-- Admins can view all events
CREATE POLICY "Admins can view all cycle count events"
ON public.cycle_count_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for cycle-count-photos bucket
CREATE POLICY "Anyone can view cycle count photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'cycle-count-photos');

CREATE POLICY "Authenticated users can upload cycle count photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cycle-count-photos' AND auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_cycle_counts_updated_at
BEFORE UPDATE ON public.cycle_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_cycle_counts_ops_area ON public.cycle_counts(ops_area);
CREATE INDEX idx_cycle_counts_status ON public.cycle_counts(status);
CREATE INDEX idx_cycle_counts_created_by ON public.cycle_counts(created_by_user_id);
CREATE INDEX idx_cycle_count_lines_cycle_count_id ON public.cycle_count_lines(cycle_count_id);
CREATE INDEX idx_cycle_count_events_cycle_count_id ON public.cycle_count_events(cycle_count_id);