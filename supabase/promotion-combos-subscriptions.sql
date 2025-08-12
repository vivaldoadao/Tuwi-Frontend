-- =====================================================
-- SISTEMA DE COMBOS E ASSINATURAS DE PROMOÇÕES
-- Extensão do sistema existente para suportar:
-- - Combos personalizados multi-promoção
-- - Assinaturas de promoção (renovação automática)
-- - Planos de promoção com níveis
-- =====================================================

-- ===== 1. TABELA DE COMBOS DE PROMOÇÃO =====
-- Extende promotion_packages para combos mais complexos

CREATE TABLE IF NOT EXISTS public.promotion_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Tipos de promoção incluídas no combo
  included_types VARCHAR[] NOT NULL, -- ['profile_highlight', 'hero_banner']
  
  -- Configurações de duração
  profile_highlight_days INTEGER DEFAULT 0,
  hero_banner_days INTEGER DEFAULT 0,
  combo_package_days INTEGER DEFAULT 0,
  
  -- Preços e desconto
  regular_price DECIMAL(10,2) NOT NULL, -- Soma dos preços individuais
  combo_price DECIMAL(10,2) NOT NULL,   -- Preço com desconto
  discount_percentage INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN regular_price > 0 
      THEN ROUND(((regular_price - combo_price) / regular_price * 100)::numeric, 0)::integer
      ELSE 0 
    END
  ) STORED,
  
  -- Visual e marketing
  badge_text VARCHAR DEFAULT 'COMBO', -- "POPULAR", "MELHOR VALOR"
  highlight_color VARCHAR DEFAULT '#10B981',
  features JSONB DEFAULT '[]', -- ["Destaque por 7 dias", "Banner principal", "Analytics avançadas"]
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Limites e condições
  min_subscription_months INTEGER DEFAULT 1, -- Mínimo para assinatura
  max_uses_per_user INTEGER, -- NULL = ilimitado
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validações
  CHECK (combo_price <= regular_price),
  CHECK (array_length(included_types, 1) >= 1),
  CHECK (
    (profile_highlight_days > 0 AND 'profile_highlight' = ANY(included_types)) OR
    (profile_highlight_days = 0 AND NOT 'profile_highlight' = ANY(included_types))
  ),
  CHECK (
    (hero_banner_days > 0 AND 'hero_banner' = ANY(included_types)) OR
    (hero_banner_days = 0 AND NOT 'hero_banner' = ANY(included_types))
  )
);

-- ===== 2. TABELA DE ASSINATURAS DE PROMOÇÃO =====
-- Sistema de assinatura para renovação automática de promoções

CREATE TABLE IF NOT EXISTS public.promotion_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combo_id UUID REFERENCES public.promotion_combos(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL,
  
  -- Configurações da assinatura
  billing_cycle VARCHAR NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  cycle_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'EUR',
  
  -- Status da assinatura
  status VARCHAR DEFAULT 'active' CHECK (status IN (
    'trial', 'active', 'past_due', 'cancelled', 'suspended', 'expired'
  )),
  
  -- Datas importantes
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  
  -- Stripe integration
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_customer_id VARCHAR,
  stripe_price_id VARCHAR,
  
  -- Auto-renovação de promoções
  auto_renew_promotions BOOLEAN DEFAULT true,
  next_promotion_start TIMESTAMPTZ,
  
  -- Configurações personalizadas
  custom_settings JSONB DEFAULT '{}', -- Configurações específicas do usuário
  
  -- Analytics
  total_promotions_created INTEGER DEFAULT 0,
  total_amount_paid DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Um usuário só pode ter uma assinatura ativa por vez
  UNIQUE(user_id, status) WHERE status IN ('trial', 'active')
);

-- ===== 3. TABELA DE HISTÓRICO DE EXECUÇÃO DE ASSINATURA =====
-- Rastreia quando as promoções são criadas automaticamente

CREATE TABLE IF NOT EXISTS public.promotion_subscription_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.promotion_subscriptions(id) ON DELETE CASCADE,
  
  -- Execução
  execution_date TIMESTAMPTZ DEFAULT NOW(),
  execution_type VARCHAR NOT NULL CHECK (execution_type IN ('trial_start', 'renewal', 'manual')),
  
  -- Promoções criadas nesta execução
  promotion_ids UUID[], -- IDs das promoções criadas
  
  -- Detalhes financeiros
  amount_charged DECIMAL(10,2),
  stripe_invoice_id VARCHAR,
  
  -- Status
  status VARCHAR DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'partially_completed')),
  error_message TEXT,
  
  -- Metadata da execução
  execution_details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 4. TABELA DE TEMPLATES DE PROMOÇÃO =====
-- Templates pré-definidos para facilitar criação

CREATE TABLE IF NOT EXISTS public.promotion_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Tipo de template
  promotion_type VARCHAR NOT NULL CHECK (promotion_type IN ('profile_highlight', 'hero_banner', 'combo_package')),
  
  -- Configurações padrão
  default_duration_days INTEGER NOT NULL DEFAULT 7,
  suggested_price DECIMAL(10,2),
  
  -- Conteúdo template
  template_content JSONB DEFAULT '{}', -- Estrutura padrão para content_data
  
  -- Marketing
  preview_image VARCHAR, -- URL da imagem de preview
  example_description TEXT,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false, -- Só disponível para assinantes premium
  category VARCHAR DEFAULT 'general', -- 'seasonal', 'holiday', 'general'
  
  -- Estatísticas
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0, -- % de promoções bem-sucedidas usando este template
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 5. TABELA DE CUPONS E DESCONTOS =====
-- Sistema de cupons para promoções

CREATE TABLE IF NOT EXISTS public.promotion_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Tipo de desconto
  discount_type VARCHAR NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value DECIMAL(10,2) NOT NULL, -- 20 para 20% ou 10.00 para 10€
  
  -- Aplicabilidade
  applicable_to VARCHAR[] DEFAULT '{combo,package}', -- ['combo', 'package', 'subscription']
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2), -- Cap para descontos percentuais
  
  -- Limites de uso
  usage_limit INTEGER, -- NULL = ilimitado
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_user INTEGER DEFAULT 1,
  
  -- Validade
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Condições especiais
  first_time_users_only BOOLEAN DEFAULT false,
  minimum_subscription_months INTEGER, -- Para cupons de assinatura
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (discount_value > 0),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- ===== 6. TABELA DE USO DE CUPONS =====
-- Histórico de uso dos cupons

CREATE TABLE IF NOT EXISTS public.promotion_coupon_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.promotion_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Uso
  used_at TIMESTAMPTZ DEFAULT NOW(),
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- Relacionamento com compra
  subscription_id UUID REFERENCES public.promotion_subscriptions(id),
  transaction_id UUID REFERENCES public.promotion_transactions(id),
  
  -- Metadata
  usage_metadata JSONB DEFAULT '{}',
  
  UNIQUE(coupon_id, user_id, subscription_id), -- Evita uso duplo do mesmo cupom
  CHECK (final_amount = original_amount - discount_amount)
);

-- ===== 7. ÍNDICES PARA PERFORMANCE =====

-- Combos
CREATE INDEX idx_promotion_combos_active ON public.promotion_combos(is_active, sort_order);
CREATE INDEX idx_promotion_combos_featured ON public.promotion_combos(is_featured, sort_order);

-- Assinaturas
CREATE INDEX idx_promotion_subscriptions_user ON public.promotion_subscriptions(user_id);
CREATE INDEX idx_promotion_subscriptions_status ON public.promotion_subscriptions(status);
CREATE INDEX idx_promotion_subscriptions_stripe ON public.promotion_subscriptions(stripe_subscription_id);
CREATE INDEX idx_promotion_subscriptions_renewal ON public.promotion_subscriptions(current_period_end) 
  WHERE status IN ('active', 'trial');

-- Execuções
CREATE INDEX idx_subscription_executions_subscription ON public.promotion_subscription_executions(subscription_id);
CREATE INDEX idx_subscription_executions_date ON public.promotion_subscription_executions(execution_date DESC);

-- Templates
CREATE INDEX idx_promotion_templates_active ON public.promotion_templates(is_active, promotion_type);
CREATE INDEX idx_promotion_templates_category ON public.promotion_templates(category, is_active);

-- Cupons
CREATE INDEX idx_promotion_coupons_code ON public.promotion_coupons(code) WHERE is_active = true;
CREATE INDEX idx_promotion_coupons_active ON public.promotion_coupons(is_active, valid_until);
CREATE INDEX idx_coupon_uses_coupon_user ON public.promotion_coupon_uses(coupon_id, user_id);

-- ===== 8. ROW LEVEL SECURITY =====

ALTER TABLE public.promotion_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_subscription_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_coupon_uses ENABLE ROW LEVEL SECURITY;

-- Combos: todos podem ver ativos, apenas admins podem gerenciar
CREATE POLICY "Anyone can view active combos" ON public.promotion_combos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage combos" ON public.promotion_combos
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Assinaturas: usuários veem suas próprias, admins veem todas
CREATE POLICY "Users can view own subscriptions" ON public.promotion_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions" ON public.promotion_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.promotion_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" ON public.promotion_subscriptions
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Execuções: vinculadas às assinaturas
CREATE POLICY "Users can view own subscription executions" ON public.promotion_subscription_executions
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM public.promotion_subscriptions WHERE user_id = auth.uid()
    )
  );

-- Templates: todos podem ver ativos
CREATE POLICY "Anyone can view active templates" ON public.promotion_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.promotion_templates
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Cupons: todos podem ver ativos (para validação), mas histórico é privado
CREATE POLICY "Anyone can view active coupons" ON public.promotion_coupons
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage coupons" ON public.promotion_coupons
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Uso de cupons: usuários veem seus próprios usos
CREATE POLICY "Users can view own coupon uses" ON public.promotion_coupon_uses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create coupon uses" ON public.promotion_coupon_uses
  FOR INSERT WITH CHECK (true); -- Sistema pode registrar usos

-- ===== 9. TRIGGERS PARA UPDATED_AT =====

CREATE TRIGGER update_promotion_combos_updated_at
  BEFORE UPDATE ON public.promotion_combos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotion_subscriptions_updated_at
  BEFORE UPDATE ON public.promotion_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotion_templates_updated_at
  BEFORE UPDATE ON public.promotion_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotion_coupons_updated_at
  BEFORE UPDATE ON public.promotion_coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 10. DADOS INICIAIS - COMBOS POPULARES =====

INSERT INTO public.promotion_combos (
  name, description, included_types, 
  profile_highlight_days, hero_banner_days,
  regular_price, combo_price,
  badge_text, highlight_color, features, is_featured, sort_order
) VALUES 
-- Combo Starter
(
  'Combo Starter', 
  'Perfeito para trancistas iniciantes que querem ganhar visibilidade',
  ARRAY['profile_highlight']::VARCHAR[],
  7, 0,
  15.00, 10.00,
  'INICIANTE', '#3B82F6',
  '["Destaque por 7 dias", "Posição prioritária", "Badge \"Verificada\"", "Analytics básicas"]'::jsonb,
  false, 1
),
-- Combo Popular
(
  'Combo Popular',
  'A escolha mais popular! Combine destaque no perfil com banner principal',
  ARRAY['profile_highlight', 'hero_banner']::VARCHAR[],
  7, 3,
  35.00, 25.00,
  'POPULAR', '#10B981',
  '["Destaque por 7 dias", "Banner principal por 3 dias", "Analytics avançadas", "Suporte prioritário"]'::jsonb,
  true, 2
),
-- Combo Premium
(
  'Combo Premium',
  'Máxima visibilidade com todos os recursos disponíveis',
  ARRAY['profile_highlight', 'hero_banner']::VARCHAR[],
  14, 7,
  70.00, 45.00,
  'PREMIUM', '#8B5CF6',
  '["Destaque por 14 dias", "Banner principal por 7 dias", "Analytics completas", "Templates exclusivos", "Suporte VIP"]'::jsonb,
  true, 3
);

-- ===== 11. TEMPLATES INICIAIS =====

INSERT INTO public.promotion_templates (
  name, description, promotion_type, default_duration_days,
  suggested_price, template_content, category
) VALUES
-- Profile Highlight Templates
(
  'Destaque Clássico',
  'Template clássico para destaque de perfil com badge dourado',
  'profile_highlight',
  7, 15.00,
  '{"badge_style": "gold", "position_priority": "high", "show_rating": true}'::jsonb,
  'general'
),
(
  'Destaque Sazonal',
  'Template temático para épocas especiais (Natal, Carnaval, etc.)',
  'profile_highlight', 
  10, 20.00,
  '{"badge_style": "seasonal", "themed_border": true, "special_icon": true}'::jsonb,
  'seasonal'
),
-- Hero Banner Templates  
(
  'Banner Promocional',
  'Banner principal para promoções especiais e ofertas',
  'hero_banner',
  3, 25.00,
  '{"layout": "promo", "cta_style": "button", "background_style": "gradient"}'::jsonb,
  'general'
),
(
  'Banner Institucional',
  'Banner elegante para apresentação profissional',
  'hero_banner',
  5, 30.00,
  '{"layout": "institutional", "cta_style": "link", "background_style": "image"}'::jsonb,
  'general'
);

-- ===== 12. CUPONS INICIAIS =====

INSERT INTO public.promotion_coupons (
  code, name, description, discount_type, discount_value,
  applicable_to, usage_limit, valid_until
) VALUES
-- Cupom de boas-vindas
(
  'WELCOME10',
  'Desconto de Boas-vindas',
  '10% de desconto na primeira compra de promoções',
  'percentage', 10.00,
  ARRAY['combo', 'package']::VARCHAR[],
  1000,
  NOW() + INTERVAL '3 months'
),
-- Cupom premium
(
  'PREMIUM50',
  'Desconto Premium',
  '50% de desconto no primeiro mês de assinatura premium',
  'percentage', 50.00,
  ARRAY['subscription']::VARCHAR[],
  100,
  NOW() + INTERVAL '1 month'
),
-- Cupom teste grátis
(
  'TRIAL7DAYS',
  'Teste Grátis 7 Dias',
  'Teste grátis de 7 dias para novos usuários',
  'free_trial', 0.00,
  ARRAY['subscription']::VARCHAR[],
  500,
  NOW() + INTERVAL '6 months'
);

-- ===== 13. COMENTÁRIOS DE DOCUMENTAÇÃO =====

COMMENT ON TABLE public.promotion_combos IS 'Combos de promoções com múltiplos tipos e descontos';
COMMENT ON TABLE public.promotion_subscriptions IS 'Assinaturas para renovação automática de promoções';  
COMMENT ON TABLE public.promotion_subscription_executions IS 'Histórico de execução das assinaturas';
COMMENT ON TABLE public.promotion_templates IS 'Templates pré-definidos para facilitar criação de promoções';
COMMENT ON TABLE public.promotion_coupons IS 'Sistema de cupons de desconto';
COMMENT ON TABLE public.promotion_coupon_uses IS 'Histórico de uso dos cupons';

COMMENT ON COLUMN public.promotion_combos.discount_percentage IS 'Percentual de desconto calculado automaticamente';
COMMENT ON COLUMN public.promotion_subscriptions.cancel_at_period_end IS 'Se true, cancela no final do período atual';
COMMENT ON COLUMN public.promotion_coupons.first_time_users_only IS 'Cupom válido apenas para novos usuários';