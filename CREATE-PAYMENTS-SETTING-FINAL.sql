-- Create the missing payments_enabled setting
DELETE FROM public.promotion_settings WHERE key = 'payments_enabled';

INSERT INTO public.promotion_settings (key, value, description, category, is_public, created_at, updated_at) VALUES
('payments_enabled', 'true', 'Cobrança de pagamentos ativa', 'payments', true, NOW(), NOW());

-- Verify it was created
SELECT * FROM public.promotion_settings WHERE key = 'payments_enabled';

-- Show all settings for verification
SELECT key, value, is_public FROM public.promotion_settings ORDER BY key;