-- Check if payments_enabled exists in database
SELECT * FROM public.promotion_settings WHERE key = 'payments_enabled';

-- Check RLS policies on promotion_settings table
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'promotion_settings';

-- Show all public settings
SELECT key, value, is_public, category 
FROM public.promotion_settings 
WHERE is_public = true 
ORDER BY key;

-- Force insert with correct values
DELETE FROM public.promotion_settings WHERE key = 'payments_enabled';

INSERT INTO public.promotion_settings (key, value, description, category, is_public, created_at, updated_at) VALUES
('payments_enabled', 'true'::jsonb, 'Cobrança de pagamentos ativa', 'payments', true, NOW(), NOW());

-- Verify again
SELECT 'After insert:' as status, key, value, is_public, category 
FROM public.promotion_settings 
WHERE key = 'payments_enabled';