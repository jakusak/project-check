-- Create storage bucket for fleet notice files
INSERT INTO storage.buckets (id, name, public) VALUES ('fleet-notices', 'fleet-notices', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fleet-notices bucket
CREATE POLICY "Anyone can view fleet notice files" ON storage.objects
  FOR SELECT USING (bucket_id = 'fleet-notices');

CREATE POLICY "Admins can upload fleet notice files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fleet-notices' 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins can update fleet notice files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fleet-notices' 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins can delete fleet notice files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fleet-notices' 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  );