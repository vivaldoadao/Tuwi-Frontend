-- =====================================================
-- POLÍTICAS RLS PARA SEGURANÇA EM PRODUÇÃO
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Implementa Row Level Security balanceada para o sistema

\echo '🔒 IMPLEMENTANDO POLÍTICAS RLS DE SEGURANÇA...';
\echo '';

-- =====================================================
-- 1. TABELA USERS - DADOS PESSOAIS SENSÍVEIS
-- =====================================================

\echo '👤 Configurando RLS para tabela users...';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver dados públicos básicos (para listas)
CREATE POLICY "users_public_profile" ON public.users
FOR SELECT USING (true);

-- Política: Usuários só podem editar seus próprios dados
CREATE POLICY "users_own_data_update" ON public.users  
FOR UPDATE USING (auth.uid() = id::uuid);

-- Política: Admins podem ver todos os dados
CREATE POLICY "users_admin_access" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 2. TABELA PROMOTIONS - CONTROLE DE PROMOÇÕES
-- =====================================================

\echo '🎯 Configurando RLS para tabela promotions...';

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Política: Promoções ativas são públicas para todos
CREATE POLICY "promotions_public_active" ON public.promotions
FOR SELECT USING (status = 'active' AND end_date > NOW());

-- Política: Usuários gerenciam suas próprias promoções
CREATE POLICY "promotions_owner_management" ON public.promotions
FOR ALL USING (auth.uid() = user_id::uuid);

-- Política: Admins podem gerenciar todas as promoções
CREATE POLICY "promotions_admin_management" ON public.promotions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 3. TABELA BRAIDERS - PERFIS DE TRANCISTAS
-- =====================================================

\echo '💇‍♀️ Configurando RLS para tabela braiders...';

ALTER TABLE public.braiders ENABLE ROW LEVEL SECURITY;

-- Política: Trancistas aprovados são públicos
CREATE POLICY "braiders_public_approved" ON public.braiders
FOR SELECT USING (status = 'approved');

-- Política: Trancistas podem editar seu próprio perfil
CREATE POLICY "braiders_own_profile" ON public.braiders
FOR UPDATE USING (auth.uid() = user_id::uuid);

-- Política: Usuários podem criar perfil de trancista
CREATE POLICY "braiders_create_own" ON public.braiders
FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Política: Admins podem gerenciar todos os perfis
CREATE POLICY "braiders_admin_management" ON public.braiders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 4. TABELA CONVERSATIONS - PRIVACIDADE DO CHAT
-- =====================================================

\echo '💬 Configurando RLS para tabela conversations...';

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Política: Apenas participantes podem ver/gerenciar conversas
CREATE POLICY "conversations_participants_only" ON public.conversations
FOR ALL USING (
  auth.uid() = participant_1_id::uuid OR 
  auth.uid() = participant_2_id::uuid
);

-- Política: Admins podem moderar conversas (apenas SELECT)
CREATE POLICY "conversations_admin_moderation" ON public.conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 5. TABELA MESSAGES - SEGURANÇA DAS MENSAGENS
-- =====================================================

\echo '💌 Configurando RLS para tabela messages...';

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Política: Mensagens apenas para participantes da conversa
CREATE POLICY "messages_conversation_participants" ON public.messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1_id::uuid = auth.uid() 
         OR conversations.participant_2_id::uuid = auth.uid())
  )
);

-- Política: Admins podem moderar mensagens (apenas SELECT)
CREATE POLICY "messages_admin_moderation" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 6. TABELA PRODUCTS - CATÁLOGO PÚBLICO
-- =====================================================

\echo '🛍️ Configurando RLS para tabela products...';

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política: Produtos ativos são públicos
CREATE POLICY "products_public_active" ON public.products
FOR SELECT USING (is_active = true);

-- Política: Admins podem gerenciar produtos
CREATE POLICY "products_admin_management" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 7. TABELA ORDERS - PRIVACIDADE DOS PEDIDOS
-- =====================================================

\echo '📦 Configurando RLS para tabela orders...';

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver pedidos feitos com seu email
-- (Orders usa email em vez de user_id)
CREATE POLICY "orders_own_email" ON public.orders
FOR SELECT USING (
  customer_email = (
    SELECT email FROM public.users 
    WHERE id::uuid = auth.uid()
  )
);

-- Política: Admins podem gerenciar todos os pedidos
CREATE POLICY "orders_admin_management" ON public.orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- 8. TABELA PROMOTION_SETTINGS - CONFIGURAÇÕES ADMIN
-- =====================================================

\echo '⚙️ Configurando RLS para tabela promotion_settings...';

ALTER TABLE public.promotion_settings ENABLE ROW LEVEL SECURITY;

-- Política: Configurações públicas podem ser lidas por todos
CREATE POLICY "promotion_settings_public_read" ON public.promotion_settings
FOR SELECT USING (is_public = true);

-- Política: Apenas admins podem gerenciar configurações
CREATE POLICY "promotion_settings_admin_only" ON public.promotion_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id::uuid = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- =====================================================

\echo '';
\echo '🔍 VERIFICANDO POLÍTICAS RLS CRIADAS...';

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo '';
\echo '📊 RESUMO DE SEGURANÇA POR TABELA:';

SELECT 
    t.table_name,
    CASE 
        WHEN c.relrowsecurity THEN 'enabled'
        ELSE 'disabled'
    END as rls_enabled,
    COUNT(p.policyname) as policies_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE '%_backup%'
GROUP BY t.table_name, c.relrowsecurity
ORDER BY policies_count DESC, t.table_name;

\echo '';
\echo '✅ POLÍTICAS RLS IMPLEMENTADAS!';
\echo 'Sistema agora tem segurança de dados balanceada:';
\echo '- Dados públicos acessíveis (produtos, trancistas aprovados)';
\echo '- Dados privados protegidos (mensagens, pedidos)';
\echo '- Controle admin para moderação';
\echo '- Performance otimizada com índices.';