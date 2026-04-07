
-- Allow anonymous inserts into supply_requests (public form)
CREATE POLICY "Public can submit supply requests"
ON public.supply_requests
FOR INSERT
TO anon
WITH CHECK (
  created_by_user_id IS NULL
);

-- Allow anonymous inserts into ops_tasks (public facilities form)
CREATE POLICY "Public can submit facility requests"
ON public.ops_tasks
FOR INSERT
TO anon
WITH CHECK (
  task_mode = 'facility_request' AND status = 'new_request' AND created_by_user_id IS NULL
);
