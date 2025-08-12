-- Remover constraints de foreign key problemáticas
ALTER TABLE public.site_media DROP CONSTRAINT IF EXISTS site_media_uploaded_by_fkey;
ALTER TABLE public.site_contents DROP CONSTRAINT IF EXISTS site_contents_updated_by_fkey;
ALTER TABLE public.site_pages DROP CONSTRAINT IF EXISTS site_pages_updated_by_fkey;
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_updated_by_fkey;

-- Mensagem de sucesso
SELECT '✅ Foreign key constraints removidas com sucesso!' as message;