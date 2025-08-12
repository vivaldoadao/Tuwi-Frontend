-- ==========================================
-- COMPLETE PROMOTION SYSTEM SETUP - EXECUTE ALL
-- ==========================================
-- Execute este SQL completo no Supabase SQL Editor
-- para configurar todo o sistema de promoções

-- ==========================================
-- STEP 1: ADD MISSING COLUMN IF NEEDED
-- ==========================================

-- Add package_id column to promotions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'package_id'
    ) THEN
        ALTER TABLE public.promotions 
        ADD COLUMN package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Column package_id added to promotions table ✅';
    ELSE
        RAISE NOTICE 'Column package_id already exists in promotions table ✅';
    END IF;
END
$$;

-- ==========================================
-- STEP 2: REMOVE EXISTING POLICIES TO AVOID CONFLICTS
-- ==========================================

-- Core promotion tables policies
DROP POLICY IF EXISTS "Users can view own promotions" ON public.promotions;
DROP POLICY IF EXISTS "Users can create own promotions" ON public.promotions;
DROP POLICY IF EXISTS "Users can update own promotions" ON public.promotions;
DROP POLICY IF EXISTS "Service role full access to promotions" ON public.promotions;
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.promotion_packages;
DROP POLICY IF EXISTS "Service role full access to packages" ON public.promotion_packages;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.promotion_transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.promotion_transactions;
DROP POLICY IF EXISTS "Service role full access to transactions" ON public.promotion_transactions;
DROP POLICY IF EXISTS "Users can view own promotion analytics" ON public.promotion_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON public.promotion_analytics;
DROP POLICY IF EXISTS "Service role full access to analytics" ON public.promotion_analytics;

-- Settings table policies
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.promotion_settings;
DROP POLICY IF EXISTS "Service role full access to settings" ON public.promotion_settings;

-- Combo/subscription table policies
DROP POLICY IF EXISTS "Combos are viewable by everyone" ON public.promotion_combos;
DROP POLICY IF EXISTS "Service role full access to combos" ON public.promotion_combos;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.promotion_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.promotion_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.promotion_subscriptions;
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON public.promotion_subscriptions;
DROP POLICY IF EXISTS "Active coupons are viewable by everyone" ON public.promotion_coupons;
DROP POLICY IF EXISTS "Service role full access to coupons" ON public.promotion_coupons;
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.promotion_coupon_usage;
DROP POLICY IF EXISTS "System can insert coupon usage" ON public.promotion_coupon_usage;
DROP POLICY IF EXISTS "Service role full access to coupon usage" ON public.promotion_coupon_usage;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.promotion_combo_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.promotion_combo_notifications;
DROP POLICY IF EXISTS "Service role full access to notifications" ON public.promotion_combo_notifications;
DROP POLICY IF EXISTS "Users can view own subscription executions" ON public.promotion_subscription_executions;
DROP POLICY IF EXISTS "Service role full access to executions" ON public.promotion_subscription_executions;

-- ==========================================
-- STEP 3: CREATE ALL CORE TABLES
-- ==========================================

-- 1. Promotion packages table
CREATE TABLE IF NOT EXISTS public.promotion_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package')),
  duration_days INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  color VARCHAR DEFAULT '#10B981',
  icon VARCHAR DEFAULT 'star',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL,
  type VARCHAR NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package')),
  title VARCHAR NOT NULL,
  description TEXT,
  content_data JSONB DEFAULT '{}',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'rejected')),
  price DECIMAL(10,2) DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  payment_id VARCHAR,
  stripe_session_id VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Promotion transactions table
CREATE TABLE IF NOT EXISTS public.promotion_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR DEFAULT 'EUR',
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_session_id VARCHAR,
  stripe_payment_intent_id VARCHAR,
  stripe_status VARCHAR,
  payment_method VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Promotion analytics table
CREATE TABLE IF NOT EXISTS public.promotion_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL CHECK (event_type IN ('view', 'click', 'contact', 'message')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Promotion settings table
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

-- 6. Promotion combos table
CREATE TABLE IF NOT EXISTS public.promotion_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  included_types VARCHAR[] NOT NULL DEFAULT '{}',
  regular_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  combo_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage INTEGER GENERATED ALWAYS AS (
    CASE WHEN regular_price > 0 
    THEN ROUND(((regular_price - combo_price) / regular_price * 100)::numeric, 0)::integer
    ELSE 0 END
  ) STORED,
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]',
  badge_text VARCHAR,
  highlight_color VARCHAR DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Promotion subscriptions table
CREATE TABLE IF NOT EXISTS public.promotion_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combo_id UUID REFERENCES public.promotion_combos(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL,
  billing_cycle VARCHAR NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  cycle_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_price_id VARCHAR,
  total_amount_paid DECIMAL(10,2) DEFAULT 0,
  total_promotions_created INTEGER DEFAULT 0,
  auto_renew_promotions BOOLEAN DEFAULT TRUE,
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Promotion subscription executions table
CREATE TABLE IF NOT EXISTS public.promotion_subscription_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.promotion_subscriptions(id) ON DELETE CASCADE,
  execution_type VARCHAR NOT NULL CHECK (execution_type IN ('trial_start', 'renewal', 'cancellation', 'reactivation')),
  promotion_ids UUID[],
  amount_charged DECIMAL(10,2),
  stripe_invoice_id VARCHAR,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  execution_details JSONB DEFAULT '{}',
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Promotion coupons table
CREATE TABLE IF NOT EXISTS public.promotion_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  discount_type VARCHAR NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  applies_to VARCHAR DEFAULT 'all' CHECK (applies_to IN ('all', 'packages', 'combos')),
  applicable_package_types VARCHAR[],
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Coupon usage tracking table
CREATE TABLE IF NOT EXISTS public.promotion_coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.promotion_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.promotion_transactions(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, promotion_id)
);

-- 11. Promotion combo notifications table  
CREATE TABLE IF NOT EXISTS public.promotion_combo_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combo_id UUID REFERENCES public.promotion_combos(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.promotion_subscriptions(id) ON DELETE CASCADE,
  notification_type VARCHAR NOT NULL CHECK (notification_type IN ('purchase_success', 'renewal_success', 'payment_failed', 'subscription_cancelled', 'trial_ending')),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Core promotion indexes
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_package_id ON public.promotions(package_id);

-- Package indexes
CREATE INDEX IF NOT EXISTS idx_promotion_packages_type ON public.promotion_packages(type);
CREATE INDEX IF NOT EXISTS idx_promotion_packages_active ON public.promotion_packages(is_active);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_promotion_transactions_user ON public.promotion_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_transactions_status ON public.promotion_transactions(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_promotion ON public.promotion_analytics(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_type ON public.promotion_analytics(event_type);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_promotion_settings_key ON public.promotion_settings(key);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_category ON public.promotion_settings(category);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_public ON public.promotion_settings(is_public);

-- Combo indexes
CREATE INDEX IF NOT EXISTS idx_promotion_combos_active ON public.promotion_combos(is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_combos_types ON public.promotion_combos USING GIN(included_types);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_user ON public.promotion_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_status ON public.promotion_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_combo ON public.promotion_subscriptions(combo_id);
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_stripe ON public.promotion_subscriptions(stripe_subscription_id);

-- Coupon indexes
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_code ON public.promotion_coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_active ON public.promotion_coupons(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_user ON public.promotion_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_coupon ON public.promotion_coupon_usage(coupon_id);

-- ==========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_subscription_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_combo_notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 6: CREATE RLS POLICIES
-- ==========================================

-- Packages: Public read for active packages
CREATE POLICY "Packages are viewable by everyone" ON public.promotion_packages
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access to packages" ON public.promotion_packages
  FOR ALL USING (true);

-- Promotions: Users see their own
CREATE POLICY "Users can view own promotions" ON public.promotions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own promotions" ON public.promotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own promotions" ON public.promotions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to promotions" ON public.promotions
  FOR ALL USING (true);

-- Transactions: Users see their own
CREATE POLICY "Users can view own transactions" ON public.promotion_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.promotion_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to transactions" ON public.promotion_transactions
  FOR ALL USING (true);

-- Analytics: Users see their own, system can insert
CREATE POLICY "Users can view own promotion analytics" ON public.promotion_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions p 
      WHERE p.id = promotion_analytics.promotion_id 
      AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "System can insert analytics" ON public.promotion_analytics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access to analytics" ON public.promotion_analytics
  FOR ALL USING (true);

-- Settings: Public read for public settings
CREATE POLICY "Public settings are viewable by everyone" ON public.promotion_settings
  FOR SELECT USING (is_public = true);
CREATE POLICY "Service role full access to settings" ON public.promotion_settings
  FOR ALL USING (true);

-- Combos: Public read for active combos
CREATE POLICY "Combos are viewable by everyone" ON public.promotion_combos
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access to combos" ON public.promotion_combos
  FOR ALL USING (true);

-- Subscriptions: Users see their own
CREATE POLICY "Users can view own subscriptions" ON public.promotion_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.promotion_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.promotion_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to subscriptions" ON public.promotion_subscriptions
  FOR ALL USING (true);

-- Coupons: Public read for active ones
CREATE POLICY "Active coupons are viewable by everyone" ON public.promotion_coupons
  FOR SELECT USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));
CREATE POLICY "Service role full access to coupons" ON public.promotion_coupons
  FOR ALL USING (true);

-- Coupon usage: Users see their own usage
CREATE POLICY "Users can view own coupon usage" ON public.promotion_coupon_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert coupon usage" ON public.promotion_coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to coupon usage" ON public.promotion_coupon_usage
  FOR ALL USING (true);

-- Combo notifications: Users see their own
CREATE POLICY "Users can view own notifications" ON public.promotion_combo_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.promotion_combo_notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to notifications" ON public.promotion_combo_notifications
  FOR ALL USING (true);

-- Subscription executions: Users see their own via subscription
CREATE POLICY "Users can view own subscription executions" ON public.promotion_subscription_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotion_subscriptions ps 
      WHERE ps.id = promotion_subscription_executions.subscription_id 
      AND ps.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role full access to executions" ON public.promotion_subscription_executions
  FOR ALL USING (true);

-- ==========================================
-- STEP 7: GRANT PERMISSIONS
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.promotion_packages TO anon, authenticated;
GRANT ALL ON public.promotions TO authenticated;
GRANT ALL ON public.promotion_transactions TO authenticated;
GRANT ALL ON public.promotion_analytics TO authenticated;
GRANT SELECT ON public.promotion_settings TO anon, authenticated;
GRANT ALL ON public.promotion_settings TO authenticated;
GRANT SELECT ON public.promotion_combos TO anon, authenticated;
GRANT ALL ON public.promotion_subscriptions TO authenticated;
GRANT ALL ON public.promotion_subscription_executions TO authenticated;
GRANT SELECT ON public.promotion_coupons TO anon, authenticated;
GRANT ALL ON public.promotion_coupon_usage TO authenticated;
GRANT ALL ON public.promotion_combo_notifications TO authenticated;

-- ==========================================
-- STEP 8: INSERT INITIAL DATA
-- ==========================================

-- Insert promotion packages
INSERT INTO public.promotion_packages (name, description, type, duration_days, price, features, color, icon) VALUES 
('Destaque Perfil Básico', 'Destaque seu perfil por 7 dias', 'profile_highlight', 7, 9.99, '["Aparece no topo da lista", "Badge de destaque", "Maior visibilidade"]'::jsonb, '#10B981', 'crown'),
('Destaque Perfil Premium', 'Destaque seu perfil por 30 dias', 'profile_highlight', 30, 29.99, '["Aparece no topo da lista", "Badge premium", "Destaque especial", "Analytics detalhados"]'::jsonb, '#8B5CF6', 'star'),
('Banner Hero Básico', 'Banner na página principal por 7 dias', 'hero_banner', 7, 19.99, '["Banner na página inicial", "Máxima visibilidade", "Call-to-action personalizado"]'::jsonb, '#F59E0B', 'megaphone'),
('Banner Hero Premium', 'Banner na página principal por 30 dias', 'hero_banner', 30, 59.99, '["Banner premium na página inicial", "Posição privilegiada", "Design personalizado", "Analytics avançados"]'::jsonb, '#EF4444', 'zap')
ON CONFLICT (id) DO NOTHING;

-- Insert promotion combos
INSERT INTO public.promotion_combos (name, description, included_types, regular_price, combo_price, duration_days, features) VALUES 
('Combo Visibilidade Total', 'Destaque seu perfil e apareça no banner principal por 30 dias', ARRAY['profile_highlight', 'hero_banner'], 59.98, 39.99, 30, '["Destaque no topo da lista", "Banner na página principal", "Prioridade em buscas", "Analytics detalhados"]'::jsonb),
('Combo Destaque Premium', 'Máxima visibilidade com todos os tipos de promoção', ARRAY['profile_highlight', 'hero_banner'], 89.97, 64.99, 45, '["Destaque premium no perfil", "Banner hero destaque", "Aparição em todas as buscas", "Relatórios de performance", "Suporte prioritário"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert sample coupons
INSERT INTO public.promotion_coupons (code, name, discount_type, discount_value, applies_to, usage_limit, valid_until) VALUES 
('WELCOME10', 'Desconto de Boas-vindas', 'percentage', 10.00, 'all', 100, NOW() + INTERVAL '30 days'),
('COMBO20', 'Desconto Especial Combos', 'percentage', 20.00, 'combos', 50, NOW() + INTERVAL '14 days')
ON CONFLICT (code) DO NOTHING;

-- Insert promotion settings (CRITICAL - INCLUDING PAYMENTS_ENABLED!)
INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES

-- Sistema geral
('system_enabled', 'true', 'Sistema de promoções ativo globalmente', 'system', true),
('payments_enabled', 'true', 'Cobrança de pagamentos ativa (false = período gratuito)', 'payments', true),
('free_trial_enabled', 'false', 'Permite uso gratuito temporário', 'trial', true),
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
('smtp_enabled', 'false', 'SMTP configurado para envio de emails', 'notifications', false),

-- Interface e UX
('show_promotion_badge', 'true', 'Mostrar badges de destaque nos perfis', 'ui', true),
('badge_animation', 'true', 'Animações nos badges de destaque', 'ui', true),
('hero_rotation_interval', '8', 'Intervalo de rotação dos banners hero (segundos)', 'ui', true),

-- Funcionalidades avançadas
('combo_packages_enabled', 'true', 'Pacotes combo disponíveis', 'features', true),
('geographic_targeting', 'false', 'Segmentação geográfica (futuro)', 'features', false),
('scheduling_promotions', 'true', 'Agendamento de promoções futuras', 'features', false),

-- Relatórios e analytics
('analytics_retention_days', '90', 'Dias para manter dados de analytics', 'analytics', false),
('public_stats_enabled', 'false', 'Mostrar estatísticas públicas do sistema', 'analytics', true)

ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- ==========================================
-- STEP 9: SUCCESS MESSAGE
-- ==========================================

SELECT 
  '🎉 Sistema de promoções configurado com sucesso! ✅' as message,
  'Total de tabelas: ' || COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'promotion%';

-- Show critical settings
SELECT 
  '⚡ Configurações críticas:' as info,
  key, 
  value, 
  description 
FROM public.promotion_settings 
WHERE key IN ('system_enabled', 'payments_enabled', 'free_trial_enabled')
ORDER BY key;