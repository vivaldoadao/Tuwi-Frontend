-- =====================================================
-- ÍNDICES PARA PERFORMANCE EM PRODUÇÃO (VERSÃO CORRIGIDA)
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- IMPORTANTE: Execute linha por linha ou em pequenos blocos
-- Não use CONCURRENTLY se executar como transação

\echo '🚀 ADICIONANDO ÍNDICES DE PERFORMANCE...';
\echo '';

-- =====================================================
-- ÍNDICES PARA SISTEMA DE USUÁRIOS
-- =====================================================

\echo '👤 Índices para tabela users...';

-- Índice para consultas por email (muito comum no NextAuth)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON public.users (email);

-- Índice para consultas por role (usado no middleware)
CREATE INDEX IF NOT EXISTS idx_users_role 
ON public.users (role);

-- Índice para usuários verificados
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON public.users (email_verified) WHERE email_verified = true;

-- =====================================================
-- ÍNDICES PARA SISTEMA DE PROMOÇÕES
-- =====================================================

\echo '🎯 Índices para sistema de promoções...';

-- Índice para consultas por usuário (dashboard do usuário)
CREATE INDEX IF NOT EXISTS idx_promotions_user_id 
ON public.promotions (user_id);

-- Índice para consultas por status e data (promoções ativas)
CREATE INDEX IF NOT EXISTS idx_promotions_active 
ON public.promotions (status, start_date, end_date) 
WHERE status = 'active';

-- Índice para consultas por tipo (diferentes tipos de promoção)
CREATE INDEX IF NOT EXISTS idx_promotions_type 
ON public.promotions (type);

-- Índice para ordenação por data de criação
CREATE INDEX IF NOT EXISTS idx_promotions_created_at 
ON public.promotions (created_at DESC);

-- Índice para consultas de analytics (views, clicks)
CREATE INDEX IF NOT EXISTS idx_promotions_analytics 
ON public.promotions (views_count, clicks_count, contacts_count);

-- =====================================================
-- ÍNDICES PARA SISTEMA DE TRANCISTAS
-- =====================================================

\echo '💇‍♀️ Índices para sistema de trancistas...';

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_braiders_user_id 
ON public.braiders (user_id);

-- Índice para consultas por status (aprovados, pendentes)
CREATE INDEX IF NOT EXISTS idx_braiders_status 
ON public.braiders (status);

-- Índice para consultas por localização
CREATE INDEX IF NOT EXISTS idx_braiders_location 
ON public.braiders (district, concelho) WHERE district IS NOT NULL;

-- Índice para ordenação por rating
CREATE INDEX IF NOT EXISTS idx_braiders_rating 
ON public.braiders (average_rating DESC, total_reviews DESC);

-- =====================================================
-- ÍNDICES PARA SISTEMA DE CHAT
-- =====================================================

\echo '💬 Índices para sistema de chat...';

-- Índices para conversas por participante
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 
ON public.conversations (participant_1_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 
ON public.conversations (participant_2_id, status);

-- Índice para ordenação por última mensagem
CREATE INDEX IF NOT EXISTS idx_conversations_last_message 
ON public.conversations (last_message_timestamp DESC);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON public.messages (sender_id);

-- Índice para mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages (conversation_id, is_read, created_at) 
WHERE is_read = false;

-- =====================================================
-- ÍNDICES PARA SISTEMA DE PRODUTOS E PEDIDOS
-- =====================================================

\echo '🛍️ Índices para produtos e pedidos...';

-- Índice para produtos ativos
CREATE INDEX IF NOT EXISTS idx_products_active 
ON public.products (is_active, created_at DESC) WHERE is_active = true;

-- Índice para pedidos por email (já que não usa user_id)
CREATE INDEX IF NOT EXISTS idx_orders_email 
ON public.orders (customer_email);

-- Índice para pedidos por status
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON public.orders (status, created_at DESC);

-- Índice para número do pedido (consultas de tracking)
CREATE INDEX IF NOT EXISTS idx_orders_number 
ON public.orders (order_number);

-- =====================================================
-- ÍNDICES COMPOSTOS PARA CONSULTAS COMPLEXAS
-- =====================================================

\echo '🔍 Índices compostos para consultas complexas...';

-- Promoções ativas por usuário
CREATE INDEX IF NOT EXISTS idx_promotions_user_active 
ON public.promotions (user_id, status, end_date) 
WHERE status = 'active';

-- Trancistas ativos por localização
CREATE INDEX IF NOT EXISTS idx_braiders_location_active 
ON public.braiders (status, district, average_rating DESC) 
WHERE status = 'approved';

-- =====================================================
-- VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- =====================================================

\echo '';
\echo '🔍 VERIFICANDO ÍNDICES CRIADOS...';

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo '';
\echo '📊 RESUMO DE ÍNDICES POR TABELA:';

SELECT 
    tablename,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as custom_indexes
FROM pg_indexes 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY custom_indexes DESC, tablename;

\echo '';
\echo '✅ ÍNDICES DE PERFORMANCE ADICIONADOS!';
\echo 'Sistema otimizado para consultas em produção.';
\echo '';
\echo '💡 NOTA: Para produção de alto tráfego, considere usar:';
\echo '   CREATE INDEX CONCURRENTLY (executar individualmente)';
\echo '   para evitar bloqueios durante criação dos índices.';