-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view ops area mappings" ON public.ops_area_to_hub;

-- Create a policy that restricts access to authenticated users only
CREATE POLICY "Authenticated users can view ops area mappings" 
ON public.ops_area_to_hub 
FOR SELECT 
USING (auth.uid() IS NOT NULL);