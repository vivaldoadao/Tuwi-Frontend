-- Simple fix for payments_enabled
INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES
('payments_enabled', 'true'::jsonb, 'Cobrança de pagamentos ativa', 'payments', true)
ON CONFLICT (key) DO UPDATE SET 
  value = 'true'::jsonb,
  is_public = true;

-- Verify it exists
SELECT key, value, is_public FROM public.promotion_settings WHERE key = 'payments_enabled';