-- ==========================================
-- FIX ADMIN SETTINGS - CLEAN VERSION (Remove políticas primeiro)
-- ==========================================

-- 1. Remover políticas RLS existentes para evitar conflitos
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.promotion_settings;
DROP POLICY IF EXISTS "Service role full access to settings" ON public.promotion_settings;
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.promotion_settings;

-- 2. Criar tabela promotion_settings se não existir
CREATE TABLE IF NOT EXISTS public.promotion_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_promotion_settings_key ON public.promotion_settings(key);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_category ON public.promotion_settings(category);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_public ON public.promotion_settings(is_public);

-- 4. Habilitar RLS
ALTER TABLE public.promotion_settings ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS (versão limpa)
CREATE POLICY "Public settings are viewable by everyone" ON public.promotion_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Service role full access to settings" ON public.promotion_settings
  FOR ALL USING (true);

-- 6. Conceder permissões
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.promotion_settings TO anon, authenticated;
GRANT ALL ON public.promotion_settings TO authenticated;

-- 7. Inserir configurações iniciais (ON CONFLICT DO UPDATE para evitar duplicatas)
INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES

-- Sistema geral
('system_enabled', 'true', 'Sistema de promoções ativo globalmente', 'system', true),
('payments_enabled', 'false', 'Cobrança de pagamentos ativa (false = período gratuito)', 'payments', true),
('free_trial_enabled', 'true', 'Permite uso gratuito temporário', 'trial', true),
('free_trial_days', '7', 'Dias de teste gratuito para novos usuários', 'trial', false),

-- Limites do sistema
('max_hero_banners', '3', 'Máximo de banners no hero section simultaneamente', 'limits', true),
('max_highlighted_profiles', '15', 'Máximo de perfis em destaque simultaneamente', 'limits', true),
('max_active_promotions_per_user', '5', 'Máximo de promoções ativas por trancista', 'limits', false),

-- Aprovação e moderação
('auto_approval_profiles', 'true', 'Aprovação automática para perfis destacados', 'approval', false),
('hero_requires_approval', 'true', 'Banners do hero precisam aprovação admin', 'approval', false),
('moderation_enabled', 'true', 'Sistema de moderação ativo', 'approval', false),

-- Preços e descontos
('default_currency', '"EUR"', 'Moeda padrão do sistema', 'pricing', true),
('discount_first_purchase', '20', 'Desconto percentual na primeira compra', 'pricing', false),
('seasonal_discount', '0', 'Desconto sazonal ativo (percentual)', 'pricing', false),

-- Analytics e métricas
('analytics_enabled', 'true', 'Coleta de analytics ativa', 'analytics', false),
('track_views', 'true', 'Rastrear visualizações de promoções', 'analytics', false),
('track_clicks', 'true', 'Rastrear cliques em promoções', 'analytics', false),

-- Email e notificações
('email_notifications', 'true', 'Notificações por email ativas', 'notifications', false),
('admin_email', '"admin@wilnaratancas.com"', 'Email do administrador principal', 'notifications', false),
('smtp_enabled', 'false', 'SMTP configurado para envio de emails', 'notifications', false)

ON CONFLICT (key) DO UPDATE SET 
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- 8. Verificar se as configurações foram inseridas corretamente
SELECT 
  'Settings table setup completed! Total settings: ' || COUNT(*) || ' ✅' as result,
  'Critical settings: ' || COUNT(*) FILTER (WHERE key IN ('system_enabled', 'payments_enabled', 'free_trial_enabled')) as critical_count
FROM public.promotion_settings;

-- 9. Mostrar configurações atuais para verificação
SELECT key, value, description, category, is_public 
FROM public.promotion_settings 
WHERE key IN ('system_enabled', 'payments_enabled', 'free_trial_enabled')
ORDER BY key;