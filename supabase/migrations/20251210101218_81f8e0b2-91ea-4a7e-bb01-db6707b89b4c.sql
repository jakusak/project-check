-- Create enum for incident status
CREATE TYPE public.incident_status AS ENUM ('submitted', 'in_review', 'closed');

-- Create van_incidents table
CREATE TABLE public.van_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ops_area TEXT NOT NULL,
  trip_id TEXT,
  van_id TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  vin TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_time TIME NOT NULL,
  location_text TEXT NOT NULL,
  weather TEXT NOT NULL,
  description TEXT NOT NULL,
  status incident_status NOT NULL DEFAULT 'submitted',
  ops_admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  internal_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create van_incident_files table for attachments
CREATE TABLE public.van_incident_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  incident_id UUID NOT NULL REFERENCES public.van_incidents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.van_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.van_incident_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for van_incidents

-- Users can view their own incidents
CREATE POLICY "Users can view their own incidents"
ON public.van_incidents FOR SELECT
USING (auth.uid() = created_by_user_id);

-- OPX can view incidents for their assigned areas
CREATE POLICY "OPX can view incidents for their areas"
ON public.van_incidents FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
    AND opx_area_assignments.ops_area = van_incidents.ops_area
  )
);

-- Admins can view all incidents
CREATE POLICY "Admins can view all incidents"
ON public.van_incidents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can create incidents
CREATE POLICY "Authenticated users can create incidents"
ON public.van_incidents FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by_user_id);

-- OPX can update incidents for their areas
CREATE POLICY "OPX can update incidents for their areas"
ON public.van_incidents FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
    AND opx_area_assignments.ops_area = van_incidents.ops_area
  )
);

-- Admins can update all incidents
CREATE POLICY "Admins can update all incidents"
ON public.van_incidents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for van_incident_files

-- Users can view files for their own incidents
CREATE POLICY "Users can view their incident files"
ON public.van_incident_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM van_incidents
    WHERE van_incidents.id = van_incident_files.incident_id
    AND van_incidents.created_by_user_id = auth.uid()
  )
);

-- OPX can view files for incidents in their areas
CREATE POLICY "OPX can view incident files for their areas"
ON public.van_incident_files FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM van_incidents vi
    JOIN opx_area_assignments oa ON oa.ops_area = vi.ops_area
    WHERE vi.id = van_incident_files.incident_id
    AND oa.user_id = auth.uid()
  )
);

-- Admins can view all files
CREATE POLICY "Admins can view all incident files"
ON public.van_incident_files FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert files for their incidents
CREATE POLICY "Users can upload files for their incidents"
ON public.van_incident_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM van_incidents
    WHERE van_incidents.id = van_incident_files.incident_id
    AND van_incidents.created_by_user_id = auth.uid()
  )
);

-- Create storage bucket for incident files
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-files', 'incident-files', true);

-- Storage policies for incident-files bucket
CREATE POLICY "Authenticated users can upload incident files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'incident-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view incident files"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-files');

-- Create updated_at trigger for van_incidents
CREATE TRIGGER update_van_incidents_updated_at
BEFORE UPDATE ON public.van_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for van_incidents
ALTER PUBLICATION supabase_realtime ADD TABLE public.van_incidents;