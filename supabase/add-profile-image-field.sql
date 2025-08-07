-- Add profile_image_url field to braiders table
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.braiders.profile_image_url IS 'URL da foto de perfil da trancista';