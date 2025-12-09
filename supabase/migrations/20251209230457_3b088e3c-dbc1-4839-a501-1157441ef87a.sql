-- Update RLS policies for equipment_requests to include super_admin
DROP POLICY IF EXISTS "OPX can view requests for their assigned areas" ON public.equipment_requests;
CREATE POLICY "OPX can view requests for their assigned areas" 
ON public.equipment_requests 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid() 
    AND opx_area_assignments.ops_area = equipment_requests.ops_area
  )
);

DROP POLICY IF EXISTS "OPX can update requests for their assigned areas" ON public.equipment_requests;
CREATE POLICY "OPX can update requests for their assigned areas" 
ON public.equipment_requests 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE opx_area_assignments.user_id = auth.uid() 
    AND opx_area_assignments.ops_area = equipment_requests.ops_area
  )
);

DROP POLICY IF EXISTS "Hub Admins can view OPX-approved requests for their hubs" ON public.equipment_requests;
CREATE POLICY "Hub Admins can view OPX-approved requests for their hubs" 
ON public.equipment_requests 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (EXISTS (
    SELECT 1 FROM hub_admin_assignments
    WHERE hub_admin_assignments.user_id = auth.uid() 
    AND hub_admin_assignments.hub = equipment_requests.hub
  ) AND opx_status = 'opx_approved')
);

DROP POLICY IF EXISTS "Hub Admins can update requests for their hubs" ON public.equipment_requests;
CREATE POLICY "Hub Admins can update requests for their hubs" 
ON public.equipment_requests 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (EXISTS (
    SELECT 1 FROM hub_admin_assignments
    WHERE hub_admin_assignments.user_id = auth.uid() 
    AND hub_admin_assignments.hub = equipment_requests.hub
  ) AND opx_status = 'opx_approved')
);

-- Update RLS policies for equipment_request_line_items to include super_admin
DROP POLICY IF EXISTS "OPX can view line items for their assigned areas" ON public.equipment_request_line_items;
CREATE POLICY "OPX can view line items for their assigned areas" 
ON public.equipment_request_line_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN opx_area_assignments oa ON oa.ops_area = er.ops_area
    WHERE er.id = equipment_request_line_items.request_id 
    AND oa.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "OPX can update line items for their assigned areas" ON public.equipment_request_line_items;
CREATE POLICY "OPX can update line items for their assigned areas" 
ON public.equipment_request_line_items 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN opx_area_assignments oa ON oa.ops_area = er.ops_area
    WHERE er.id = equipment_request_line_items.request_id 
    AND oa.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Hub Admins can view line items for their hub requests" ON public.equipment_request_line_items;
CREATE POLICY "Hub Admins can view line items for their hub requests" 
ON public.equipment_request_line_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN hub_admin_assignments ha ON ha.hub = er.hub
    WHERE er.id = equipment_request_line_items.request_id 
    AND ha.user_id = auth.uid() 
    AND er.opx_status = 'opx_approved'
  )
);

DROP POLICY IF EXISTS "Hub Admins can update line items for their hub requests" ON public.equipment_request_line_items;
CREATE POLICY "Hub Admins can update line items for their hub requests" 
ON public.equipment_request_line_items 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM equipment_requests er
    JOIN hub_admin_assignments ha ON ha.hub = er.hub
    WHERE er.id = equipment_request_line_items.request_id 
    AND ha.user_id = auth.uid() 
    AND er.opx_status = 'opx_approved'
  )
);

-- Update opx_area_assignments RLS to allow super_admin to view all
DROP POLICY IF EXISTS "OPX can view their own assignments" ON public.opx_area_assignments;
CREATE POLICY "OPX can view their own assignments" 
ON public.opx_area_assignments 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Update hub_admin_assignments RLS to allow super_admin to view all
DROP POLICY IF EXISTS "Hub Admins can view their own assignments" ON public.hub_admin_assignments;
CREATE POLICY "Hub Admins can view their own assignments" 
ON public.hub_admin_assignments 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);