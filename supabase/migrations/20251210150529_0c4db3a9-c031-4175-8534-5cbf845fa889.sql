-- Create severity enum for broken item reports
CREATE TYPE broken_item_severity AS ENUM ('low', 'medium', 'high');

-- Create status enum for broken items
CREATE TYPE broken_item_status AS ENUM ('open', 'in_maintenance', 'resolved');

-- Create status enum for maintenance records
CREATE TYPE maintenance_status AS ENUM ('open', 'completed');

-- Create broken_item_reports table
CREATE TABLE public.broken_item_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  equipment_item_id UUID REFERENCES public.equipment_items(id),
  sku TEXT NOT NULL,
  ops_area TEXT NOT NULL,
  location_name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity broken_item_severity NOT NULL DEFAULT 'medium',
  status broken_item_status NOT NULL DEFAULT 'open',
  photo_path TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_records table
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  equipment_item_id UUID REFERENCES public.equipment_items(id),
  sku TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  notes TEXT,
  status maintenance_status NOT NULL DEFAULT 'open',
  photo_path TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  broken_item_report_id UUID REFERENCES public.broken_item_reports(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broken_item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Broken Item Reports RLS Policies
CREATE POLICY "Users can create broken item reports"
ON public.broken_item_reports FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can view their own broken item reports"
ON public.broken_item_reports FOR SELECT
USING (auth.uid() = created_by_user_id);

CREATE POLICY "Admins can view all broken item reports"
ON public.broken_item_reports FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OPX can view broken item reports for their areas"
ON public.broken_item_reports FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
    AND opx_area_assignments.ops_area = broken_item_reports.ops_area
  )
);

CREATE POLICY "Admins can update broken item reports"
ON public.broken_item_reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OPX can update broken item reports for their areas"
ON public.broken_item_reports FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
    AND opx_area_assignments.ops_area = broken_item_reports.ops_area
  )
);

-- Maintenance Records RLS Policies
CREATE POLICY "Users can create maintenance records"
ON public.maintenance_records FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can view their own maintenance records"
ON public.maintenance_records FOR SELECT
USING (auth.uid() = created_by_user_id);

CREATE POLICY "Admins can view all maintenance records"
ON public.maintenance_records FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OPX can view maintenance records for equipment in their areas"
ON public.maintenance_records FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM broken_item_reports bir
    JOIN opx_area_assignments oa ON oa.ops_area = bir.ops_area
    WHERE bir.id = maintenance_records.broken_item_report_id
    AND oa.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments oa
    WHERE oa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update maintenance records"
ON public.maintenance_records FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OPX can update maintenance records"
ON public.maintenance_records FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid()
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_broken_item_reports_updated_at
BEFORE UPDATE ON public.broken_item_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at
BEFORE UPDATE ON public.maintenance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for equipment health photos
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-health-photos', 'equipment-health-photos', true);

-- Storage policies for equipment health photos
CREATE POLICY "Anyone can view equipment health photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-health-photos');

CREATE POLICY "Authenticated users can upload equipment health photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'equipment-health-photos' AND auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX idx_broken_item_reports_ops_area ON public.broken_item_reports(ops_area);
CREATE INDEX idx_broken_item_reports_status ON public.broken_item_reports(status);
CREATE INDEX idx_broken_item_reports_created_at ON public.broken_item_reports(created_at);
CREATE INDEX idx_maintenance_records_status ON public.maintenance_records(status);
CREATE INDEX idx_maintenance_records_created_at ON public.maintenance_records(created_at);