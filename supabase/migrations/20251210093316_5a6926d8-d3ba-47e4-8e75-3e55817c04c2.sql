-- Add rationale column to equipment_requests (separate from notes)
ALTER TABLE public.equipment_requests 
ADD COLUMN IF NOT EXISTS rationale text;

-- Create equipment_request_events table for status history/timeline
CREATE TABLE public.equipment_request_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  request_id uuid NOT NULL REFERENCES public.equipment_requests(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'approved', 'rejected', 'modified', 'fulfilled', 'shipped', 'comment', 'cancelled')),
  event_notes text,
  old_values jsonb,
  new_values jsonb
);

-- Enable RLS on events table
ALTER TABLE public.equipment_request_events ENABLE ROW LEVEL SECURITY;

-- Users can view events for their own requests
CREATE POLICY "Users can view their request events"
ON public.equipment_request_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM equipment_requests 
    WHERE equipment_requests.id = equipment_request_events.request_id 
    AND equipment_requests.user_id = auth.uid()
  )
);

-- OPX can view events for their assigned areas
CREATE POLICY "OPX can view events for their areas"
ON public.equipment_request_events
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN opx_area_assignments oa ON oa.ops_area = er.ops_area
    WHERE er.id = equipment_request_events.request_id 
    AND oa.user_id = auth.uid()
  )
);

-- Hub Admins can view events for their hub's approved requests
CREATE POLICY "Hub Admins can view events for their hub"
ON public.equipment_request_events
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN hub_admin_assignments ha ON ha.hub = er.hub
    WHERE er.id = equipment_request_events.request_id 
    AND ha.user_id = auth.uid()
    AND er.opx_status = 'opx_approved'
  )
);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON public.equipment_request_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert events (controlled by application logic)
CREATE POLICY "Authenticated users can insert events"
ON public.equipment_request_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND actor_user_id = auth.uid());

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_request_events;