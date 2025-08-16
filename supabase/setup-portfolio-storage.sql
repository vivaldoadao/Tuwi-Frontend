-- ====================================
-- SETUP PORTFOLIO STORAGE SYSTEM
-- ====================================

-- 1. Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for portfolio images

-- Policy: Anyone can view portfolio images (public bucket)
CREATE POLICY "Portfolio images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

-- Policy: Authenticated users can upload their own portfolio images
CREATE POLICY "Users can upload their own portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own portfolio images
CREATE POLICY "Users can update their own portfolio images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own portfolio images
CREATE POLICY "Users can delete their own portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can manage all portfolio images
CREATE POLICY "Admins can manage all portfolio images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'portfolio-images'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. Create function to get portfolio image URL
CREATE OR REPLACE FUNCTION get_portfolio_image_url(bucket_name text, image_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    image_path
  );
END;
$$;

-- 4. Create function to validate portfolio images
CREATE OR REPLACE FUNCTION validate_portfolio_images()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limit to maximum 10 images
  IF array_length(NEW.portfolio_images, 1) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 portfolio images allowed';
  END IF;
  
  -- Validate that all URLs are from our storage
  IF NEW.portfolio_images IS NOT NULL THEN
    DECLARE
      img_url text;
    BEGIN
      FOREACH img_url IN ARRAY NEW.portfolio_images
      LOOP
        IF img_url NOT LIKE '%/storage/v1/object/public/portfolio-images/%' THEN
          RAISE EXCEPTION 'Invalid portfolio image URL: %', img_url;
        END IF;
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create trigger for portfolio validation
DROP TRIGGER IF EXISTS validate_portfolio_images_trigger ON braiders;
CREATE TRIGGER validate_portfolio_images_trigger
  BEFORE INSERT OR UPDATE ON braiders
  FOR EACH ROW
  EXECUTE FUNCTION validate_portfolio_images();

-- 6. Create function to cleanup unused portfolio images
CREATE OR REPLACE FUNCTION cleanup_unused_portfolio_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unused_image record;
BEGIN
  -- Find storage objects that are not referenced in any braider portfolio
  FOR unused_image IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'portfolio-images'
    AND name NOT IN (
      SELECT unnest(portfolio_images)
      FROM braiders
      WHERE portfolio_images IS NOT NULL
    )
    AND created_at < NOW() - INTERVAL '24 hours' -- Only delete files older than 24h
  LOOP
    -- Delete the unused image
    DELETE FROM storage.objects
    WHERE bucket_id = 'portfolio-images'
    AND name = unused_image.name;
    
    RAISE NOTICE 'Deleted unused portfolio image: %', unused_image.name;
  END LOOP;
END;
$$;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_braiders_portfolio_images 
ON braiders USING GIN (portfolio_images);

-- 8. Add helpful comments
COMMENT ON COLUMN braiders.portfolio_images IS 'Array of portfolio image URLs from Supabase Storage';
COMMENT ON FUNCTION get_portfolio_image_url IS 'Generate full URL for portfolio image in storage';
COMMENT ON FUNCTION validate_portfolio_images IS 'Validate portfolio images array before insert/update';
COMMENT ON FUNCTION cleanup_unused_portfolio_images IS 'Clean up unused portfolio images from storage';

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_portfolio_image_url TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_unused_portfolio_images TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Portfolio storage system setup completed successfully!';
  RAISE NOTICE 'Bucket: portfolio-images created with 5MB limit';
  RAISE NOTICE 'Policies: Created for public read, authenticated upload/update/delete';
  RAISE NOTICE 'Functions: Created for URL generation and validation';
  RAISE NOTICE 'Triggers: Added for portfolio validation';
END;
$$;