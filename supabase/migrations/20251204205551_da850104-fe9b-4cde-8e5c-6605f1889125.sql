-- Add new roles to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'field_staff';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'opx';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hub_admin';

-- OPX to OPS Area assignments (admin assigns OPX users to specific areas)
CREATE TABLE public.opx_area_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ops_area TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, ops_area)
);

-- Hub Admin to Hub assignments
CREATE TABLE public.hub_admin_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, hub)
);

-- Global app settings (for reminder timeframe etc)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default reminder setting (24 hours)
INSERT INTO public.app_settings (key, value) 
VALUES ('opx_reminder_hours', '24'::jsonb);

-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add OPX review columns to equipment_requests
ALTER TABLE public.equipment_requests 
ADD COLUMN IF NOT EXISTS opx_status TEXT DEFAULT 'pending_opx',
ADD COLUMN IF NOT EXISTS opx_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS opx_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opx_notes TEXT;

-- Add original quantity to line items (to track OPX modifications)
ALTER TABLE public.equipment_request_line_items
ADD COLUMN IF NOT EXISTS original_quantity INTEGER,
ADD COLUMN IF NOT EXISTS modified_by_opx UUID REFERENCES auth.users(id);

-- Enable RLS on new tables
ALTER TABLE public.opx_area_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_admin_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opx_area_assignments
CREATE POLICY "Admins can manage OPX assignments"
ON public.opx_area_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "OPX can view their own assignments"
ON public.opx_area_assignments FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for hub_admin_assignments
CREATE POLICY "Admins can manage Hub Admin assignments"
ON public.hub_admin_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Hub Admins can view their own assignments"
ON public.hub_admin_assignments FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for app_settings
CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view app settings"
ON public.app_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Update equipment_requests RLS to allow OPX access
CREATE POLICY "OPX can view requests for their assigned areas"
ON public.equipment_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opx_area_assignments 
    WHERE user_id = auth.uid() 
    AND ops_area = equipment_requests.ops_area
  )
);

CREATE POLICY "OPX can update requests for their assigned areas"
ON public.equipment_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM opx_area_assignments 
    WHERE user_id = auth.uid() 
    AND ops_area = equipment_requests.ops_area
  )
);

-- Update equipment_request_line_items RLS to allow OPX access
CREATE POLICY "OPX can view line items for their assigned areas"
ON public.equipment_request_line_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN opx_area_assignments oa ON oa.ops_area = er.ops_area
    WHERE er.id = equipment_request_line_items.request_id
    AND oa.user_id = auth.uid()
  )
);

CREATE POLICY "OPX can update line items for their assigned areas"
ON public.equipment_request_line_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN opx_area_assignments oa ON oa.ops_area = er.ops_area
    WHERE er.id = equipment_request_line_items.request_id
    AND oa.user_id = auth.uid()
  )
);

-- Hub Admin policies for requests
CREATE POLICY "Hub Admins can view OPX-approved requests for their hubs"
ON public.equipment_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM hub_admin_assignments 
    WHERE user_id = auth.uid() 
    AND hub = equipment_requests.hub
  )
  AND opx_status = 'opx_approved'
);

CREATE POLICY "Hub Admins can update requests for their hubs"
ON public.equipment_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM hub_admin_assignments 
    WHERE user_id = auth.uid() 
    AND hub = equipment_requests.hub
  )
  AND opx_status = 'opx_approved'
);

-- Hub Admin policies for line items
CREATE POLICY "Hub Admins can view line items for their hub requests"
ON public.equipment_request_line_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN hub_admin_assignments ha ON ha.hub = er.hub
    WHERE er.id = equipment_request_line_items.request_id
    AND ha.user_id = auth.uid()
    AND er.opx_status = 'opx_approved'
  )
);

CREATE POLICY "Hub Admins can update line items for their hub requests"
ON public.equipment_request_line_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN hub_admin_assignments ha ON ha.hub = er.hub
    WHERE er.id = equipment_request_line_items.request_id
    AND ha.user_id = auth.uid()
    AND er.opx_status = 'opx_approved'
  )
);

-- Create indexes for performance
CREATE INDEX idx_opx_area_assignments_user ON public.opx_area_assignments(user_id);
CREATE INDEX idx_opx_area_assignments_area ON public.opx_area_assignments(ops_area);
CREATE INDEX idx_hub_admin_assignments_user ON public.hub_admin_assignments(user_id);
CREATE INDEX idx_hub_admin_assignments_hub ON public.hub_admin_assignments(hub);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_equipment_requests_opx_status ON public.equipment_requests(opx_status);
CREATE INDEX idx_equipment_requests_ops_area ON public.equipment_requests(ops_area);