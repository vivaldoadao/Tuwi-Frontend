-- Insert payments_enabled setting
INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES
('payments_enabled', 'true', 'Cobrança de pagamentos ativa', 'payments', true)
ON CONFLICT (key) DO UPDATE SET 
  value = 'true',
  updated_at = NOW();

-- Verify the setting
SELECT key, value, description FROM public.promotion_settings WHERE key = 'payments_enabled';