-- SISTEMA DE MONETIZAÇÃO - Schema
-- Data: 2025-08-10
-- Objetivo: Implementar infraestrutura para cobrança futura

-- ===== 1. TABELA DE CONFIGURAÇÕES DO SISTEMA =====

CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações iniciais
INSERT INTO public.platform_settings (key, value, description) VALUES
('monetization_enabled', 'false', 'Flag para ativar sistema de cobrança'),
('commission_rate', '0.10', 'Taxa de comissão da plataforma (10%)'),
('subscription_price_eur', '10.00', 'Preço da assinatura mensal em euros'),
('free_bookings_limit', '5', 'Limite de agendamentos gratuitos por mês'),
('grace_period_days', '30', 'Período de aviso antes de ativar cobrança'),
('grandfathered_users', '[]', 'Lista de usuários com condições especiais');

-- ===== 2. TABELA DE MÉTRICAS POR TRANCISTA =====

CREATE TABLE public.braider_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- Primeiro dia do mês (2025-01-01)
  
  -- Métricas de agendamentos
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  
  -- Métricas financeiras
  total_revenue DECIMAL(10,2) DEFAULT 0, -- Valor total dos serviços
  potential_commission DECIMAL(10,2) DEFAULT 0, -- Comissão que seria gerada
  average_booking_value DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas de engajamento
  profile_views INTEGER DEFAULT 0,
  contact_attempts INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- % de views que viraram agendamentos
  
  -- Meta informações
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(braider_id, month_year)
);

-- ===== 3. TABELA DE TRANSAÇÕES (SIMULADAS INICIALMENTE) =====

CREATE TABLE public.platform_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- Valores
  service_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,3) NOT NULL, -- Ex: 0.100 para 10%
  commission_amount DECIMAL(10,2) NOT NULL,
  braider_payout DECIMAL(10,2) NOT NULL,
  
  -- Status
  is_simulated BOOLEAN DEFAULT true, -- Inicialmente todas são simuladas
  status VARCHAR DEFAULT 'simulated' CHECK (status IN ('simulated', 'pending', 'completed', 'failed')),
  
  -- Pagamento
  stripe_payment_intent_id VARCHAR,
  stripe_transfer_id VARCHAR,
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 4. TABELA DE ASSINATURAS (FUTURO) =====

CREATE TABLE public.braider_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
  
  -- Plano
  plan_type VARCHAR NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium')),
  monthly_price DECIMAL(8,2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended', 'trial')),
  
  -- Limites
  monthly_booking_limit INTEGER, -- NULL = ilimitado
  featured_listing BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  
  -- Datas
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  cancelled_at TIMESTAMPTZ,
  
  -- Stripe
  stripe_subscription_id VARCHAR,
  stripe_customer_id VARCHAR,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(braider_id)
);

-- ===== 5. ÍNDICES PARA PERFORMANCE =====

CREATE INDEX idx_braider_metrics_braider_month ON public.braider_metrics(braider_id, month_year);
CREATE INDEX idx_platform_transactions_braider ON public.platform_transactions(braider_id);
CREATE INDEX idx_platform_transactions_booking ON public.platform_transactions(booking_id);
CREATE INDEX idx_braider_subscriptions_braider ON public.braider_subscriptions(braider_id);
CREATE INDEX idx_platform_settings_key ON public.platform_settings(key);

-- ===== 6. RLS POLICIES =====

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_subscriptions ENABLE ROW LEVEL SECURITY;

-- Platform settings: apenas admins
CREATE POLICY "Admin can manage platform settings" ON public.platform_settings
  FOR ALL USING (EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Braider metrics: trancistas podem ver suas próprias métricas
CREATE POLICY "Braiders can view own metrics" ON public.braider_metrics
  FOR SELECT USING (braider_id IN (
    SELECT id FROM public.braiders WHERE user_id = auth.uid()
  ));

-- Transactions: trancistas podem ver suas próprias transações
CREATE POLICY "Braiders can view own transactions" ON public.platform_transactions
  FOR SELECT USING (braider_id IN (
    SELECT id FROM public.braiders WHERE user_id = auth.uid()
  ));

-- Subscriptions: trancistas podem ver sua própria assinatura
CREATE POLICY "Braiders can view own subscription" ON public.braider_subscriptions
  FOR SELECT USING (braider_id IN (
    SELECT id FROM public.braiders WHERE user_id = auth.uid()
  ));

-- ===== 7. TRIGGERS PARA UPDATED_AT =====

CREATE TRIGGER update_platform_settings_updated_at 
  BEFORE UPDATE ON public.platform_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_braider_metrics_updated_at 
  BEFORE UPDATE ON public.braider_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_transactions_updated_at 
  BEFORE UPDATE ON public.platform_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_braider_subscriptions_updated_at 
  BEFORE UPDATE ON public.braider_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 8. FUNÇÕES AUXILIARES =====

-- Função para obter configuração da plataforma
CREATE OR REPLACE FUNCTION get_platform_setting(setting_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT (value #>> '{}')::TEXT 
    FROM public.platform_settings 
    WHERE key = setting_key AND is_active = true
  );
END;
$$ language 'plpgsql';

-- Função para verificar se monetização está ativa
CREATE OR REPLACE FUNCTION is_monetization_enabled()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (get_platform_setting('monetization_enabled'))::BOOLEAN;
END;
$$ language 'plpgsql';

-- Função para obter taxa de comissão
CREATE OR REPLACE FUNCTION get_commission_rate()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (get_platform_setting('commission_rate'))::DECIMAL;
END;
$$ language 'plpgsql';

-- ===== 9. INSERIR ASSINATURAS INICIAIS GRATUITAS =====

-- Criar assinatura gratuita para todos os braiders existentes
INSERT INTO public.braider_subscriptions (braider_id, plan_type, monthly_price, monthly_booking_limit)
SELECT 
  id as braider_id,
  'free' as plan_type,
  0 as monthly_price,
  NULL as monthly_booking_limit -- Ilimitado durante fase gratuita
FROM public.braiders
ON CONFLICT (braider_id) DO NOTHING;

-- ===== 10. COMENTÁRIOS =====

COMMENT ON TABLE public.platform_settings IS 'Configurações globais da plataforma';
COMMENT ON TABLE public.braider_metrics IS 'Métricas mensais por trancista para analytics';
COMMENT ON TABLE public.platform_transactions IS 'Transações da plataforma (inicialmente simuladas)';
COMMENT ON TABLE public.braider_subscriptions IS 'Assinaturas das trancistas';

COMMENT ON COLUMN public.platform_transactions.is_simulated IS 'True = transação simulada, False = transação real';
COMMENT ON COLUMN public.braider_metrics.potential_commission IS 'Comissão que seria gerada se monetização estivesse ativa';

\echo '✅ Schema de monetização criado!'
\echo '📊 Configurações iniciais inseridas'
\echo '🔒 RLS policies implementadas' 
\echo '⚙️ Sistema pronto para coleta de métricas'