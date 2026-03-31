
-- Drop restrictive policies and replace with public read access
DROP POLICY IF EXISTS "Authenticated users can view workforce roles" ON workforce_roles;
DROP POLICY IF EXISTS "Admins can manage workforce roles" ON workforce_roles;
DROP POLICY IF EXISTS "Authenticated users can view workforce tasks" ON workforce_tasks;
DROP POLICY IF EXISTS "Authenticated users can manage workforce tasks" ON workforce_tasks;

-- Allow anyone to read (internal tool, no PII)
CREATE POLICY "Anyone can view workforce roles" ON workforce_roles FOR SELECT USING (true);
CREATE POLICY "Anyone can manage workforce roles" ON workforce_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view workforce tasks" ON workforce_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can manage workforce tasks" ON workforce_tasks FOR ALL USING (true) WITH CHECK (true);
