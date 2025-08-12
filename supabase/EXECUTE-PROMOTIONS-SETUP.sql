-- =====================================================
-- 🚀 SETUP SISTEMA DE PROMOÇÕES - EXECUÇÃO MANUAL
-- =====================================================
-- Execute este arquivo completo no Supabase SQL Editor
-- OU execute seção por seção conforme instruções abaixo

-- =====================================================
-- FASE 1: CRIAÇÃO DAS TABELAS PRINCIPAIS
-- =====================================================

-- TABELA PRINCIPAL DE PROMOÇÕES
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

-- TABELA DE CONFIGURAÇÕES DO SISTEMA
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

-- TABELA DE ANALYTICS DETALHADAS
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

-- TABELA DE PLANOS/PACOTES DISPONÍVEIS
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

-- TABELA DE HISTÓRICO DE TRANSAÇÕES
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

-- TABELA DE NOTIFICAÇÕES RELACIONADAS
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
-- FASE 2: ÍNDICES PARA PERFORMANCE
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
-- FASE 3: TRIGGERS PARA UPDATED_AT
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
DROP TRIGGER IF EXISTS promotions_updated_at ON public.promotions;
CREATE TRIGGER promotions_updated_at 
  BEFORE UPDATE ON public.promotions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS promotion_settings_updated_at ON public.promotion_settings;
CREATE TRIGGER promotion_settings_updated_at 
  BEFORE UPDATE ON public.promotion_settings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS promotion_packages_updated_at ON public.promotion_packages;
CREATE TRIGGER promotion_packages_updated_at 
  BEFORE UPDATE ON public.promotion_packages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS promotion_transactions_updated_at ON public.promotion_transactions;
CREATE TRIGGER promotion_transactions_updated_at 
  BEFORE UPDATE ON public.promotion_transactions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- FASE 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_notifications ENABLE ROW LEVEL SECURITY;

-- Promotions policies
DROP POLICY IF EXISTS "Users can view own promotions" ON public.promotions;
CREATE POLICY "Users can view own promotions" ON public.promotions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own promotions" ON public.promotions;
CREATE POLICY "Users can create own promotions" ON public.promotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own promotions" ON public.promotions;
CREATE POLICY "Users can update own promotions" ON public.promotions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all promotions" ON public.promotions;
CREATE POLICY "Admins can view all promotions" ON public.promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Settings policies (Admin apenas)
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.promotion_settings;
CREATE POLICY "Only admins can manage settings" ON public.promotion_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Public settings can be read by anyone" ON public.promotion_settings;
CREATE POLICY "Public settings can be read by anyone" ON public.promotion_settings
  FOR SELECT USING (is_public = true);

-- Analytics policies
DROP POLICY IF EXISTS "Users can view own analytics" ON public.promotion_analytics;
CREATE POLICY "Users can view own analytics" ON public.promotion_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions p 
      WHERE p.id = promotion_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert analytics" ON public.promotion_analytics;
CREATE POLICY "System can insert analytics" ON public.promotion_analytics
  FOR INSERT WITH CHECK (true); -- Permitir inserção para tracking

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.promotion_analytics;
CREATE POLICY "Admins can view all analytics" ON public.promotion_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Packages policies (Todos podem ler pacotes ativos)
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.promotion_packages;
CREATE POLICY "Anyone can view active packages" ON public.promotion_packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage packages" ON public.promotion_packages;
CREATE POLICY "Only admins can manage packages" ON public.promotion_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.promotion_transactions;
CREATE POLICY "Users can view own transactions" ON public.promotion_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON public.promotion_transactions;
CREATE POLICY "Users can create own transactions" ON public.promotion_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.promotion_transactions;
CREATE POLICY "Admins can view all transactions" ON public.promotion_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.promotion_notifications;
CREATE POLICY "Users can view own notifications" ON public.promotion_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.promotion_notifications;
CREATE POLICY "Users can update own notifications" ON public.promotion_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.promotion_notifications;
CREATE POLICY "System can create notifications" ON public.promotion_notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.promotion_notifications;
CREATE POLICY "Admins can view all notifications" ON public.promotion_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- FASE 5: FUNÇÕES ÚTEIS
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

-- Função para obter configurações públicas
CREATE OR REPLACE FUNCTION public.get_public_promotion_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings JSONB;
BEGIN
  SELECT json_object_agg(key, value) INTO settings
  FROM public.promotion_settings
  WHERE is_public = true;
  
  RETURN COALESCE(settings, '{}'::jsonb);
END;
$$;

-- Função para ativar modo pago (apenas admin)
CREATE OR REPLACE FUNCTION public.enable_paid_mode()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas admins podem executar
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem ativar modo pago';
  END IF;
  
  -- Ativar pagamentos
  UPDATE public.promotion_settings 
  SET value = 'true', updated_at = NOW() 
  WHERE key = 'payments_enabled';
  
  -- Desativar trial gratuito
  UPDATE public.promotion_settings 
  SET value = 'false', updated_at = NOW() 
  WHERE key = 'free_trial_enabled';
  
  RETURN 'Modo pago ativado com sucesso! 💰';
END;
$$;

-- =====================================================
-- FASE 6: CONFIGURAÇÕES INICIAIS (DADOS SEED)
-- =====================================================

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

-- Notificações
('email_notifications', 'true', 'Envio de notificações por email', 'notifications', false),
('reminder_days_before_expiry', '[2, 7]', 'Dias antes do vencimento para enviar lembretes', 'notifications', false),

-- Analytics e relatórios
('analytics_retention_days', '90', 'Dias para manter dados de analytics', 'analytics', false),
('public_stats_enabled', 'false', 'Mostrar estatísticas públicas do sistema', 'analytics', true),

-- Funcionalidades avançadas
('combo_packages_enabled', 'true', 'Pacotes combo disponíveis', 'features', true),
('geographic_targeting', 'false', 'Segmentação geográfica (futuro)', 'features', false),
('scheduling_promotions', 'true', 'Agendamento de promoções futuras', 'features', false),

-- Interface e UX
('show_promotion_badge', 'true', 'Mostrar badges de destaque nos perfis', 'ui', true),
('badge_animation', 'true', 'Animações nos badges de destaque', 'ui', true),
('hero_rotation_interval', '8', 'Intervalo de rotação dos banners hero (segundos)', 'ui', true)

ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- FASE 7: PACOTES DE PROMOÇÃO INICIAIS
-- =====================================================

INSERT INTO public.promotion_packages (
  name, 
  description, 
  type, 
  duration_days, 
  price, 
  original_price,
  features, 
  is_active, 
  is_featured, 
  sort_order, 
  color, 
  icon
) VALUES 

-- PERFIL EM DESTAQUE
('Destaque Básico', 
 'Seu perfil aparece nas primeiras posições da lista de trancistas por uma semana completa.',
 'profile_highlight', 
 7, 
 5.00, 
 7.00,
 '["badge_destaque", "posicao_prioritaria", "analytics_basicas", "visibilidade_aumentada"]',
 true, 
 false, 
 1, 
 '#3B82F6', 
 'star'),

('Destaque Popular', 
 'Duas semanas de visibilidade máxima com badge especial e estatísticas detalhadas.',
 'profile_highlight', 
 15, 
 12.00, 
 15.00,
 '["badge_destaque", "posicao_prioritaria", "analytics_detalhadas", "suporte_prioritario", "badge_popular"]',
 true, 
 true, 
 2, 
 '#10B981', 
 'trending-up'),

('Destaque Premium', 
 'Um mês completo de máxima visibilidade com todos os benefícios incluídos.',
 'profile_highlight', 
 30, 
 20.00, 
 25.00,
 '["badge_destaque", "posicao_prioritaria", "analytics_avancadas", "suporte_prioritario", "badge_premium", "destaque_geografico", "relatorio_mensal"]',
 true, 
 false, 
 3, 
 '#8B5CF6', 
 'crown'),

-- BANNER NO HERO
('Banner Semanal', 
 'Seu serviço ou produto em destaque na página principal por 7 dias.',
 'hero_banner', 
 7, 
 15.00, 
 20.00,
 '["banner_homepage", "analytics_clicks", "design_personalizado", "aproval_rapida"]',
 true, 
 false, 
 4, 
 '#F59E0B', 
 'megaphone'),

('Banner Premium', 
 'Duas semanas de exposição máxima na homepage com design diferenciado.',
 'hero_banner', 
 14, 
 25.00, 
 35.00,
 '["banner_homepage", "analytics_avancadas", "design_premium", "posicao_prioritaria", "cta_personalizado"]',
 true, 
 true, 
 5, 
 '#EF4444', 
 'zap'),

-- PACOTES COMBO
('Visibilidade Total', 
 'Combo completo: perfil em destaque + banner hero. Máxima exposição garantida!',
 'combo', 
 30, 
 35.00, 
 45.00,
 '["perfil_destaque_30d", "banner_hero_14d", "analytics_premium", "suporte_prioritario", "badge_vip", "relatorios_personalizados"]',
 true, 
 true, 
 6, 
 '#EC4899', 
 'gift')

ON CONFLICT DO NOTHING;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

SELECT '🎉 Sistema de promoções configurado com sucesso!' as message,
       '💡 Sistema iniciado em MODO GRATUITO para testes' as note,
       '🔥 Para ativar cobrança: SELECT public.enable_paid_mode()' as next_step;