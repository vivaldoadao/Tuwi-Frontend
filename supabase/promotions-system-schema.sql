-- =====================================================
-- WILNARA TRANÇAS - SISTEMA DE PROMOÇÕES E DESTAQUES
-- =====================================================
-- Criado em: 2025-01-11
-- Objetivo: Sistema completo de monetização com promoções
-- Funcionalidades: Perfil destaque, Hero banners, Analytics

-- =====================================================
-- 1. TABELA PRINCIPAL DE PROMOÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de promoção
  type VARCHAR NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package')),
  title VARCHAR NOT NULL,
  description TEXT,
  
  -- Configurações temporais
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status e controle
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'rejected')),
  is_paid BOOLEAN DEFAULT false,
  
  -- Dados específicos por tipo de promoção
  content_data JSONB DEFAULT '{}', -- Hero: imagem, texto, CTA / Profile: badge, posição
  
  -- Financeiro
  price DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR DEFAULT 'EUR',
  payment_id VARCHAR, -- Stripe Payment Intent ID
  stripe_session_id VARCHAR, -- Stripe Checkout Session ID
  
  -- Analytics básicas
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0, -- Contactos recebidos durante promoção
  
  -- Controle administrativo
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 2. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotion_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR DEFAULT 'general',
  is_public BOOLEAN DEFAULT false, -- Se pode ser acessado via API pública
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 3. TABELA DE ANALYTICS DETALHADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotion_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  
  -- Tipo de evento
  event_type VARCHAR NOT NULL CHECK (event_type IN ('view', 'click', 'contact', 'booking', 'message', 'profile_visit')),
  
  -- Quem fez a ação (pode ser null para usuários não logados)
  user_id UUID REFERENCES auth.users(id),
  visitor_id VARCHAR, -- Para tracking de usuários anônimos
  
  -- Metadados do evento
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA DE PLANOS/PACOTES DISPONÍVEIS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotion_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo')),
  
  -- Configurações do pacote
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- Para mostrar desconto
  
  -- Funcionalidades incluídas
  features JSONB DEFAULT '[]',
  
  -- Controle e exibição
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Pacote em destaque
  sort_order INTEGER DEFAULT 0,
  
  -- Visual
  color VARCHAR DEFAULT '#3B82F6', -- Cor do card
  icon VARCHAR DEFAULT 'star',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. TABELA DE HISTÓRICO DE TRANSAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotion_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.promotion_packages(id),
  
  -- Detalhes financeiros
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'EUR',
  
  -- Stripe
  stripe_payment_intent_id VARCHAR,
  stripe_session_id VARCHAR,
  stripe_status VARCHAR,
  
  -- Status da transação
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Metadados
  payment_method VARCHAR, -- card, bank_transfer, etc
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. TABELA DE NOTIFICAÇÕES RELACIONADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotion_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  
  -- Tipo de notificação
  type VARCHAR NOT NULL CHECK (type IN (
    'promotion_approved', 
    'promotion_rejected', 
    'promotion_expiring', 
    'promotion_expired',
    'new_contact_received',
    'payment_successful',
    'payment_failed'
  )),
  
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  
  -- Canal de envio
  channels JSONB DEFAULT '["in_app"]', -- ["in_app", "email", "sms"]
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Promotions
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(status, start_date, end_date) 
  WHERE status = 'active';

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_promotion_id ON public.promotion_analytics(promotion_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.promotion_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.promotion_analytics(created_at);

-- Settings
CREATE INDEX IF NOT EXISTS idx_promotion_settings_key ON public.promotion_settings(key);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_category ON public.promotion_settings(category);

-- Packages
CREATE INDEX IF NOT EXISTS idx_packages_active ON public.promotion_packages(is_active, sort_order);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.promotion_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.promotion_transactions(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.promotion_notifications(user_id, is_read);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER promotions_updated_at 
  BEFORE UPDATE ON public.promotions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER promotion_settings_updated_at 
  BEFORE UPDATE ON public.promotion_settings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER promotion_packages_updated_at 
  BEFORE UPDATE ON public.promotion_packages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER promotion_transactions_updated_at 
  BEFORE UPDATE ON public.promotion_transactions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_notifications ENABLE ROW LEVEL SECURITY;

-- Promotions policies
CREATE POLICY "Users can view own promotions" ON public.promotions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promotions" ON public.promotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promotions" ON public.promotions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all promotions" ON public.promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Settings policies (Admin apenas)
CREATE POLICY "Only admins can manage settings" ON public.promotion_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Public settings can be read by anyone" ON public.promotion_settings
  FOR SELECT USING (is_public = true);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.promotion_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions p 
      WHERE p.id = promotion_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics" ON public.promotion_analytics
  FOR INSERT WITH CHECK (true); -- Permitir inserção para tracking

CREATE POLICY "Admins can view all analytics" ON public.promotion_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Packages policies (Todos podem ler pacotes ativos)
CREATE POLICY "Anyone can view active packages" ON public.promotion_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage packages" ON public.promotion_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.promotion_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.promotion_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.promotion_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.promotion_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.promotion_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.promotion_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all notifications" ON public.promotion_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para buscar promoções ativas
CREATE OR REPLACE FUNCTION public.get_active_promotions(promotion_type TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type VARCHAR,
  title VARCHAR,
  content_data JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  user_name TEXT,
  user_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.type,
    p.title,
    p.content_data,
    p.start_date,
    p.end_date,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
    u.email as user_email
  FROM public.promotions p
  JOIN auth.users u ON u.id = p.user_id
  WHERE 
    p.status = 'active' 
    AND p.start_date <= NOW() 
    AND p.end_date > NOW()
    AND (promotion_type IS NULL OR p.type = promotion_type)
  ORDER BY p.created_at DESC;
END;
$$;

-- Função para atualizar status expirado
CREATE OR REPLACE FUNCTION public.expire_old_promotions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.promotions 
  SET status = 'expired'
  WHERE status = 'active' 
    AND end_date <= NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Função para obter estatísticas de uma promoção
CREATE OR REPLACE FUNCTION public.get_promotion_stats(promo_id UUID)
RETURNS TABLE (
  total_views BIGINT,
  total_clicks BIGINT,
  total_contacts BIGINT,
  daily_views JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END) as total_views,
    COUNT(CASE WHEN pa.event_type = 'click' THEN 1 END) as total_clicks,
    COUNT(CASE WHEN pa.event_type IN ('contact', 'message') THEN 1 END) as total_contacts,
    COALESCE(
      json_agg(
        json_build_object(
          'date', DATE(pa.created_at),
          'views', COUNT(CASE WHEN pa.event_type = 'view' THEN 1 END)
        )
      ) FILTER (WHERE pa.id IS NOT NULL), 
      '[]'::jsonb
    ) as daily_views
  FROM public.promotion_analytics pa
  WHERE pa.promotion_id = promo_id
  GROUP BY pa.promotion_id;
END;
$$;

SELECT 'Schema de promoções criado com sucesso! 🎉' as message;