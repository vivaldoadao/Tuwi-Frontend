-- ==========================================
-- FIX MISSING PAYMENTS_ENABLED SETTING
-- ==========================================

-- Insert payments_enabled setting if it doesn't exist
INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES
('payments_enabled', 'true', 'Cobrança de pagamentos ativa', 'payments', true)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- Verify the setting was created
SELECT key, value, description, category, is_public 
FROM public.promotion_settings 
WHERE key = 'payments_enabled';