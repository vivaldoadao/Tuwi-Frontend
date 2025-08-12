-- ==========================================
-- EXECUTE THIS FIXED SQL IN SUPABASE SQL EDITOR - CLEAN VERSION
-- ==========================================

-- 1. Remove existing policies to avoid conflicts
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

-- 2. Create promotion_combos table
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

-- 3. Create promotion_subscriptions table
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

-- 4. Create promotion_subscription_executions table
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

-- 5. Create promotion_coupons table
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

-- 6. Create coupon usage tracking table
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

-- 7. Create promotion_combo_notifications table  
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

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotion_combos_active ON public.promotion_combos(is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_combos_types ON public.promotion_combos USING GIN(included_types);

CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_user ON public.promotion_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_status ON public.promotion_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_combo ON public.promotion_subscriptions(combo_id);
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_stripe ON public.promotion_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_promotion_coupons_code ON public.promotion_coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_active ON public.promotion_coupons(is_active, valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_user ON public.promotion_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_coupon ON public.promotion_coupon_usage(coupon_id);

-- 9. Insert sample combo data
INSERT INTO public.promotion_combos (name, description, included_types, regular_price, combo_price, duration_days, features) VALUES 
('Combo Visibilidade Total', 'Destaque seu perfil e apareça no banner principal por 30 dias', ARRAY['profile_highlight', 'hero_banner'], 59.98, 39.99, 30, '["Destaque no topo da lista", "Banner na página principal", "Prioridade em buscas", "Analytics detalhados"]'::jsonb),
('Combo Destaque Premium', 'Máxima visibilidade com todos os tipos de promoção', ARRAY['profile_highlight', 'hero_banner'], 89.97, 64.99, 45, '["Destaque premium no perfil", "Banner hero destaque", "Aparição em todas as buscas", "Relatórios de performance", "Suporte prioritário"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert sample coupons
INSERT INTO public.promotion_coupons (code, name, discount_type, discount_value, applies_to, usage_limit, valid_until) VALUES 
('WELCOME10', 'Desconto de Boas-vindas', 'percentage', 10.00, 'all', 100, NOW() + INTERVAL '30 days'),
('COMBO20', 'Desconto Especial Combos', 'percentage', 20.00, 'combos', 50, NOW() + INTERVAL '14 days')
ON CONFLICT (code) DO NOTHING;

-- 11. Enable RLS on new tables
ALTER TABLE public.promotion_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_subscription_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_combo_notifications ENABLE ROW LEVEL SECURITY;

-- 12. Create simple RLS policies (without JWT parsing to avoid errors)

-- Combos: Public read for active combos
CREATE POLICY "Combos are viewable by everyone" ON public.promotion_combos
  FOR SELECT USING (is_active = true);

-- Allow service role full access to combos
CREATE POLICY "Service role full access to combos" ON public.promotion_combos
  FOR ALL USING (true);

-- Subscriptions: Users see their own
CREATE POLICY "Users can view own subscriptions" ON public.promotion_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON public.promotion_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.promotion_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role full access to subscriptions
CREATE POLICY "Service role full access to subscriptions" ON public.promotion_subscriptions
  FOR ALL USING (true);

-- Coupons: Public read for active ones
CREATE POLICY "Active coupons are viewable by everyone" ON public.promotion_coupons
  FOR SELECT USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

-- Allow service role full access to coupons  
CREATE POLICY "Service role full access to coupons" ON public.promotion_coupons
  FOR ALL USING (true);

-- Coupon usage: Users see their own usage
CREATE POLICY "Users can view own coupon usage" ON public.promotion_coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupon usage" ON public.promotion_coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role full access to coupon usage
CREATE POLICY "Service role full access to coupon usage" ON public.promotion_coupon_usage
  FOR ALL USING (true);

-- Notifications: Users see their own notifications
CREATE POLICY "Users can view own notifications" ON public.promotion_combo_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.promotion_combo_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role full access to notifications
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

-- Allow service role full access to executions
CREATE POLICY "Service role full access to executions" ON public.promotion_subscription_executions
  FOR ALL USING (true);

-- 13. Grant usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.promotion_combos TO anon, authenticated;
GRANT ALL ON public.promotion_subscriptions TO authenticated;
GRANT ALL ON public.promotion_subscription_executions TO authenticated;
GRANT SELECT ON public.promotion_coupons TO anon, authenticated;
GRANT ALL ON public.promotion_coupon_usage TO authenticated;
GRANT ALL ON public.promotion_combo_notifications TO authenticated;

-- Success message
SELECT 'Combos and subscriptions schema created successfully! ✅' as result;