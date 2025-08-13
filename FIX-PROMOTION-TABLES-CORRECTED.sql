-- =====================================================
-- CORREÇÃO DAS TABELAS DE PROMOÇÃO (VERSÃO CORRIGIDA)
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Adiciona colunas em falta e corrige estrutura das tabelas

\echo '🔧 CORRIGINDO ESTRUTURA DAS TABELAS DE PROMOÇÃO...';
\echo '';

-- =====================================================
-- 1. ADICIONAR COLUNA sort_order À TABELA promotion_combos
-- =====================================================

\echo '📋 Adicionando sort_order à promotion_combos...';

-- Adicionar coluna sort_order se não existir
ALTER TABLE public.promotion_combos 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Adicionar outras colunas que podem estar em falta
ALTER TABLE public.promotion_combos 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

ALTER TABLE public.promotion_combos 
ADD COLUMN IF NOT EXISTS min_subscription_months integer DEFAULT 1;

ALTER TABLE public.promotion_combos 
ADD COLUMN IF NOT EXISTS max_uses_per_user integer;

-- Atualizar sort_order baseado na ordem de criação (usando subquery)
WITH numbered_combos AS (
  SELECT id, row_number() OVER (ORDER BY created_at) as new_sort_order
  FROM public.promotion_combos
  WHERE sort_order = 0
)
UPDATE public.promotion_combos 
SET sort_order = numbered_combos.new_sort_order
FROM numbered_combos
WHERE promotion_combos.id = numbered_combos.id;

-- =====================================================
-- 2. CRIAR COLUNAS EM FALTA PARA promotion_subscriptions
-- =====================================================

\echo '📋 Verificando estrutura promotion_subscriptions...';

-- Garantir que todas as colunas necessárias existem
ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS cycle_price decimal(10,2) DEFAULT 0;

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start timestamptz DEFAULT NOW();

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS current_period_end timestamptz DEFAULT NOW() + interval '1 month';

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

ALTER TABLE public.promotion_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- =====================================================
-- 3. CRIAR COLUNAS EM FALTA PARA promotion_analytics
-- =====================================================

\echo '📋 Verificando estrutura promotion_analytics...';

-- Garantir que todas as colunas necessárias existem
ALTER TABLE public.promotion_analytics 
ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'view';

ALTER TABLE public.promotion_analytics 
ADD COLUMN IF NOT EXISTS promotion_type text;

ALTER TABLE public.promotion_analytics 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE public.promotion_analytics 
ADD COLUMN IF NOT EXISTS session_id text;

-- =====================================================
-- 4. GARANTIR QUE promotion_settings TEM ESTRUTURA CORRETA
-- =====================================================

\echo '📋 Verificando promotion_settings...';

-- Garantir coluna sort_order se necessária para ordenação de settings
ALTER TABLE public.promotion_settings 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- =====================================================
-- 5. VERIFICAR E CRIAR ÍNDICES NECESSÁRIOS
-- =====================================================

\echo '📊 Adicionando índices para performance...';

-- Índices para promotion_combos
CREATE INDEX IF NOT EXISTS idx_promotion_combos_active_featured 
ON public.promotion_combos (is_active, is_featured, sort_order);

-- Índices para promotion_subscriptions  
CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_user_status
ON public.promotion_subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_promotion_subscriptions_stripe
ON public.promotion_subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Índices para promotion_analytics
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_user_event
ON public.promotion_analytics (user_id, event_type, created_at);

-- =====================================================
-- 6. ADICIONAR CONSTRAINTS DE VALIDAÇÃO (SEM IF NOT EXISTS)
-- =====================================================

\echo '🛡️ Adicionando constraints de validação...';

-- Constraints para promotion_combos (usar blocos DO para evitar erros)
DO $$
BEGIN
    ALTER TABLE public.promotion_combos 
    ADD CONSTRAINT promotion_combos_prices_positive 
    CHECK (regular_price > 0 AND combo_price > 0 AND combo_price <= regular_price);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Constraints para promotion_subscriptions
DO $$
BEGIN
    ALTER TABLE public.promotion_subscriptions 
    ADD CONSTRAINT promotion_subscriptions_billing_cycle_valid 
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.promotion_subscriptions 
    ADD CONSTRAINT promotion_subscriptions_status_valid 
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended', 'expired'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.promotion_subscriptions 
    ADD CONSTRAINT promotion_subscriptions_price_positive 
    CHECK (cycle_price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Constraints para promotion_analytics
DO $$
BEGIN
    ALTER TABLE public.promotion_analytics 
    ADD CONSTRAINT promotion_analytics_event_type_valid 
    CHECK (event_type IN ('view', 'click', 'contact', 'purchase', 'share'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

\echo '';
\echo '🔍 VERIFICANDO CORREÇÕES APLICADAS...';

-- Verificar se sort_order foi adicionado onde necessário
SELECT 
    t.table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.table_name 
            AND column_name = 'sort_order' 
            AND table_schema = 'public'
        ) 
        THEN '✅ TEM sort_order'
        ELSE '❌ SEM sort_order'
    END as sort_order_status
FROM (
    VALUES 
    ('promotion_combos'), 
    ('promotion_packages'), 
    ('promotion_settings')
) AS t(table_name);

\echo '';
\echo '📊 RESUMO DE CONSTRAINTS ADICIONADOS:';

SELECT 
    tc.table_name,
    COUNT(*) as total_constraints
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
  AND tc.table_name LIKE 'promotion_%'
  AND tc.constraint_type = 'CHECK'
GROUP BY tc.table_name
ORDER BY tc.table_name;

\echo '';
\echo '✅ CORREÇÃO DAS TABELAS DE PROMOÇÃO CONCLUÍDA!';
\echo 'Estrutura das tabelas agora está consistente com o código.';
\echo 'Teste as APIs de promoção para confirmar que os erros foram resolvidos.';