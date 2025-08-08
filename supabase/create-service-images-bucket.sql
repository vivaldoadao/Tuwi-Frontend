-- Create service-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'service-images',
  'service-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for service-images bucket
CREATE POLICY "Service images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own service images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own service images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');