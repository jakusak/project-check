-- Add explicit authentication requirement for user_roles table
-- This prevents anonymous users from even attempting to query the table
CREATE POLICY "Require authentication for user_roles" 
ON public.user_roles 
FOR SELECT 
TO anon
USING (false);

-- Also add for other operations to be explicit
CREATE POLICY "Require authentication for user_roles insert" 
ON public.user_roles 
FOR INSERT 
TO anon
WITH CHECK (false);

CREATE POLICY "Require authentication for user_roles delete" 
ON public.user_roles 
FOR DELETE 
TO anon
USING (false);