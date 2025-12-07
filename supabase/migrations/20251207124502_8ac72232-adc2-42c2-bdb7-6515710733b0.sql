-- Remove the confusing "false" policies that block all access
-- These are unnecessary when we have proper role-based policies

DROP POLICY IF EXISTS "Require authentication for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Require authentication for user_roles delete" ON public.user_roles;
DROP POLICY IF EXISTS "Require authentication for user_roles insert" ON public.user_roles;

-- The remaining policies are properly scoped:
-- - "Users can view their own roles" (SELECT where auth.uid() = user_id)
-- - "Admins can view all roles" (SELECT with has_role check)
-- - "Admins can insert roles" (INSERT with has_role check)
-- - "Admins can delete roles" (DELETE with has_role check)