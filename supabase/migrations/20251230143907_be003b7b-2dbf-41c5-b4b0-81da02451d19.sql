-- Create enum for notice types
CREATE TYPE public.fleet_notice_type AS ENUM ('speeding', 'parking', 'restricted_zone', 'toll_fine', 'unknown');

-- Create enum for notice statuses
CREATE TYPE public.fleet_notice_status AS ENUM ('new', 'needs_review', 'ready_to_assign', 'assigned', 'in_payment', 'paid', 'in_dispute', 'closed', 'exception');

-- Fleet Vehicles table
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  fleet_type TEXT NOT NULL DEFAULT 'owned', -- owned, rental
  vendor TEXT,
  country_base TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fleet Drivers table (non-system users)
CREATE TABLE public.fleet_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  region TEXT,
  country TEXT,
  employment_type TEXT, -- full_time, contractor, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vehicle Assignments (links vehicle to driver for time periods)
CREATE TABLE public.fleet_vehicle_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.fleet_drivers(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  unit_or_trip_id TEXT,
  source TEXT DEFAULT 'manual', -- manual, import
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fleet Notices (main record)
CREATE TABLE public.fleet_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_type public.fleet_notice_type NOT NULL DEFAULT 'unknown',
  status public.fleet_notice_status NOT NULL DEFAULT 'new',
  country TEXT,
  language_detected TEXT,
  issuing_authority TEXT,
  violation_datetime TIMESTAMP WITH TIME ZONE,
  violation_location TEXT,
  fine_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  deadline_date DATE,
  reference_number TEXT,
  license_plate TEXT,
  vehicle_id UUID REFERENCES public.fleet_vehicles(id),
  driver_id UUID REFERENCES public.fleet_drivers(id),
  unit_or_trip_id TEXT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  document_source TEXT DEFAULT 'upload', -- upload, email, folder_watch
  confidence_overall DECIMAL(3,2),
  field_confidence_map JSONB,
  raw_extracted_text TEXT,
  notes_internal TEXT,
  tags TEXT[],
  paid_date DATE,
  paid_amount DECIMAL(10,2),
  payment_method TEXT,
  dispute_date DATE,
  dispute_reason TEXT,
  dispute_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fleet Notice Files (uploaded documents)
CREATE TABLE public.fleet_notice_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID NOT NULL REFERENCES public.fleet_notices(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fleet Audit Log
CREATE TABLE public.fleet_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- notice, vehicle, driver, assignment
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- created, updated, status_changed, assigned, etc.
  old_values JSONB,
  new_values JSONB,
  actor_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fleet Settings (for thresholds)
CREATE TABLE public.fleet_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO public.fleet_settings (key, value) VALUES
  ('repeat_offender_thresholds', '{"notices_90_days": 3, "notices_12_months": 5, "speeding_90_days": 2}'::jsonb),
  ('confidence_threshold', '{"minimum": 0.7}'::jsonb);

-- Enable RLS on all tables
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_notice_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fleet_vehicles
CREATE POLICY "Admins can manage fleet vehicles" ON public.fleet_vehicles
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view fleet vehicles" ON public.fleet_vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for fleet_drivers
CREATE POLICY "Admins can manage fleet drivers" ON public.fleet_drivers
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view fleet drivers" ON public.fleet_drivers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for fleet_vehicle_assignments
CREATE POLICY "Admins can manage vehicle assignments" ON public.fleet_vehicle_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view vehicle assignments" ON public.fleet_vehicle_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for fleet_notices
CREATE POLICY "Admins can manage fleet notices" ON public.fleet_notices
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view fleet notices" ON public.fleet_notices
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for fleet_notice_files
CREATE POLICY "Admins can manage notice files" ON public.fleet_notice_files
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view notice files" ON public.fleet_notice_files
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for fleet_audit_log
CREATE POLICY "Admins can view audit logs" ON public.fleet_audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert audit logs" ON public.fleet_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for fleet_settings
CREATE POLICY "Admins can manage fleet settings" ON public.fleet_settings
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view fleet settings" ON public.fleet_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_fleet_notices_status ON public.fleet_notices(status);
CREATE INDEX idx_fleet_notices_deadline ON public.fleet_notices(deadline_date);
CREATE INDEX idx_fleet_notices_license_plate ON public.fleet_notices(license_plate);
CREATE INDEX idx_fleet_notices_driver_id ON public.fleet_notices(driver_id);
CREATE INDEX idx_fleet_notices_vehicle_id ON public.fleet_notices(vehicle_id);
CREATE INDEX idx_fleet_vehicle_assignments_vehicle ON public.fleet_vehicle_assignments(vehicle_id);
CREATE INDEX idx_fleet_vehicle_assignments_driver ON public.fleet_vehicle_assignments(driver_id);
CREATE INDEX idx_fleet_audit_log_entity ON public.fleet_audit_log(entity_type, entity_id);

-- Triggers for updated_at
CREATE TRIGGER update_fleet_vehicles_updated_at
  BEFORE UPDATE ON public.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fleet_drivers_updated_at
  BEFORE UPDATE ON public.fleet_drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fleet_notices_updated_at
  BEFORE UPDATE ON public.fleet_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();