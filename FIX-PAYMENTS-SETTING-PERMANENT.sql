-- Recreate payments_enabled setting with all necessary settings
-- This ensures all critical settings exist and persist

-- Delete and recreate all critical settings
DELETE FROM public.promotion_settings WHERE key IN ('payments_enabled', 'system_enabled', 'free_trial_enabled');

INSERT INTO public.promotion_settings (key, value, description, category, is_public, created_at, updated_at) VALUES
-- Critical system settings
('system_enabled', 'true'::jsonb, 'Sistema de promoções ativo globalmente', 'system', true, NOW(), NOW()),
('payments_enabled', 'true'::jsonb, 'Cobrança de pagamentos ativa', 'payments', true, NOW(), NOW()),
('free_trial_enabled', 'false'::jsonb, 'Permite uso gratuito temporário', 'trial', true, NOW(), NOW()),
-- Additional important settings
('max_hero_banners', '3'::jsonb, 'Máximo de banners no hero section simultaneamente', 'limits', true, NOW(), NOW()),
('max_highlighted_profiles', '15'::jsonb, 'Máximo de perfis em destaque simultaneamente', 'limits', true, NOW(), NOW()),
('default_currency', '"EUR"'::jsonb, 'Moeda padrão do sistema', 'pricing', true, NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- Verify critical settings exist
SELECT 'Critical settings check:' as status;
SELECT key, value, is_public 
FROM public.promotion_settings 
WHERE key IN ('system_enabled', 'payments_enabled', 'free_trial_enabled')
ORDER BY key;

-- Show all public settings for verification
SELECT 'All public settings:' as status;
SELECT key, value, category, is_public 
FROM public.promotion_settings 
WHERE is_public = true 
ORDER BY category, key;