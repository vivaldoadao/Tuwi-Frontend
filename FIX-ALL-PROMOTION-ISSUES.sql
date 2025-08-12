-- ==========================================
-- FIX ALL PROMOTION SYSTEM ISSUES
-- Execute este SQL para corrigir todos os problemas
-- ==========================================

-- 1. Primeiro, criar a tabela promotion_packages se não existir
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

-- 2. Criar tabela promotions se não existir (com relacionamento correto)
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

-- 3. Criar tabela promotion_transactions se não existir
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

-- 4. Criar tabela promotion_analytics se não existir
CREATE TABLE IF NOT EXISTS public.promotion_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL CHECK (event_type IN ('view', 'click', 'contact', 'message')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer VARCHAR,
  metadata JSONB DEFAULT '{}'
);

-- 5. Inserir pacotes de exemplo se não existirem
INSERT INTO public.promotion_packages (name, description, type, duration_days, price, features, color, icon) VALUES 
('Destaque Perfil Básico', 'Destaque seu perfil por 7 dias', 'profile_highlight', 7, 9.99, '["Aparece no topo da lista", "Badge de destaque", "Maior visibilidade"]', '#10B981', 'crown'),
('Destaque Perfil Premium', 'Destaque seu perfil por 30 dias', 'profile_highlight', 30, 29.99, '["Aparece no topo da lista", "Badge premium", "Destaque especial", "Analytics detalhados"]', '#8B5CF6', 'star'),
('Banner Hero Básico', 'Banner na página principal por 7 dias', 'hero_banner', 7, 19.99, '["Banner na página inicial", "Máxima visibilidade", "Call-to-action personalizado"]', '#F59E0B', 'megaphone'),
('Banner Hero Premium', 'Banner na página principal por 30 dias', 'hero_banner', 30, 59.99, '["Banner premium na página inicial", "Posição privilegiada", "Design personalizado", "Analytics avançados"]', '#EF4444', 'zap')
ON CONFLICT (id) DO NOTHING;

-- 6. Criar índices necessários
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_package_id ON public.promotions(package_id);

CREATE INDEX IF NOT EXISTS idx_promotion_packages_type ON public.promotion_packages(type);
CREATE INDEX IF NOT EXISTS idx_promotion_packages_active ON public.promotion_packages(is_active);

CREATE INDEX IF NOT EXISTS idx_promotion_transactions_user ON public.promotion_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_transactions_status ON public.promotion_transactions(status);

CREATE INDEX IF NOT EXISTS idx_promotion_analytics_promotion ON public.promotion_analytics(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_type ON public.promotion_analytics(event_type);

-- 7. Habilitar RLS em todas as tabelas
ALTER TABLE public.promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS simples

-- Packages: todos podem ver ativos
CREATE POLICY "Packages are viewable by everyone" ON public.promotion_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access to packages" ON public.promotion_packages
  FOR ALL USING (true);

-- Promotions: usuários veem suas próprias
CREATE POLICY "Users can view own promotions" ON public.promotions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promotions" ON public.promotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promotions" ON public.promotions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to promotions" ON public.promotions
  FOR ALL USING (true);

-- Transactions: usuários veem suas próprias
CREATE POLICY "Users can view own transactions" ON public.promotion_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.promotion_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to transactions" ON public.promotion_transactions
  FOR ALL USING (true);

-- Analytics: sistema pode inserir, usuários podem ver suas próprias
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

-- 9. Conceder permissões
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.promotion_packages TO anon, authenticated;
GRANT ALL ON public.promotions TO authenticated;
GRANT ALL ON public.promotion_transactions TO authenticated;
GRANT ALL ON public.promotion_analytics TO authenticated;

-- 10. Verificar se tudo foi criado corretamente
SELECT 
  'Promotion system tables created successfully! ✅' as result,
  'Tables: ' || COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('promotion_packages', 'promotions', 'promotion_transactions', 'promotion_analytics');

-- 11. Mostrar estatísticas
SELECT 
  'promotion_packages' as table_name, 
  COUNT(*) as records 
FROM public.promotion_packages

UNION ALL

SELECT 
  'promotions' as table_name, 
  COUNT(*) as records 
FROM public.promotions

UNION ALL

SELECT 
  'promotion_settings' as table_name, 
  COUNT(*) as records 
FROM public.promotion_settings;