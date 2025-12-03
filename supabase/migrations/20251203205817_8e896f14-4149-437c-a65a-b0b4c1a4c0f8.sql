-- Create storage bucket for equipment images
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-images', 'equipment-images', true);

-- Allow anyone to view equipment images (public bucket)
CREATE POLICY "Anyone can view equipment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-images');

-- Allow admins to upload equipment images
CREATE POLICY "Admins can upload equipment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'equipment-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update equipment images
CREATE POLICY "Admins can update equipment images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'equipment-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete equipment images
CREATE POLICY "Admins can delete equipment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'equipment-images' AND public.has_role(auth.uid(), 'admin'));