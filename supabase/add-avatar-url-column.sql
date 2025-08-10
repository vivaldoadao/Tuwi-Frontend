-- ============================================================================
-- ADD AVATAR URL COLUMN TO USERS TABLE
-- ============================================================================

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
        COMMENT ON COLUMN public.users.avatar_url IS 'URL do avatar/foto de perfil do usuário';
    END IF;
END $$;

-- ============================================================================
-- CREATE STORAGE BUCKET FOR USER AVATARS
-- ============================================================================

-- Create storage bucket for user avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR USER AVATARS
-- ============================================================================

-- Policy for uploading avatars (authenticated users can upload their own)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Policy for viewing avatars (public read access)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-avatars'
);

-- Policy for updating avatars (authenticated users can update their own)
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Policy for deleting avatars (authenticated users can delete their own)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.users.avatar_url IS 'URL do avatar/foto de perfil do usuário armazenado no Supabase Storage';