-- =====================================================
-- CORREÇÃO DA RECURSÃO INFINITA NAS POLÍTICAS RLS
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Corrige problema de recursão infinita nas políticas da tabela users

\echo '🔧 CORRIGINDO RECURSÃO INFINITA NAS POLÍTICAS RLS...';
\echo '';

-- =====================================================
-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS DA TABELA USERS
-- =====================================================

\echo '❌ Removendo políticas problemáticas da tabela users...';

-- Remover política que causa recursão
DROP POLICY IF EXISTS "users_admin_access" ON public.users;

-- =====================================================
-- 2. RECRIAR POLÍTICAS USERS SEM RECURSÃO
-- =====================================================

\echo '✅ Recriando políticas users sem recursão...';

-- Política simples: Usuários podem ver perfis públicos básicos
CREATE POLICY "users_public_read" ON public.users
FOR SELECT USING (true);

-- Política: Usuários podem editar apenas seus próprios dados
CREATE POLICY "users_own_update" ON public.users  
FOR UPDATE USING (auth.uid() = id::uuid);

-- Política: Admins têm acesso especial (sem recursão)
-- Em vez de consultar a própria tabela users, usa auth.jwt()
CREATE POLICY "users_admin_full_access" ON public.users
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.raw_user_meta_data ->> 'role' = 'admin'
  ))
);

-- =====================================================
-- 3. CORRIGIR POLÍTICAS PROMOTIONS (AMBIGUIDADE FK)
-- =====================================================

\echo '🔧 Corrigindo ambiguidade FK em promotions...';

-- Remover políticas existentes
DROP POLICY IF EXISTS "promotions_owner_management" ON public.promotions;
DROP POLICY IF EXISTS "promotions_admin_management" ON public.promotions;

-- Recriar com especificação clara da relação
CREATE POLICY "promotions_owner_access" ON public.promotions
FOR ALL USING (auth.uid() = user_id::uuid);

-- Admin policy sem recursão para promotions
CREATE POLICY "promotions_admin_access" ON public.promotions
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- =====================================================
-- 4. CORRIGIR POLÍTICAS BRAIDERS
-- =====================================================

\echo '🔧 Corrigindo políticas braiders...';

-- Remover política admin problemática
DROP POLICY IF EXISTS "braiders_admin_management" ON public.braiders;

-- Recriar sem recursão
CREATE POLICY "braiders_admin_access" ON public.braiders
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- =====================================================
-- 5. CORRIGIR POLÍTICAS PRODUCTS
-- =====================================================

\echo '🔧 Corrigindo políticas products...';

-- Remover política admin problemática  
DROP POLICY IF EXISTS "products_admin_management" ON public.products;

-- Recriar sem recursão
CREATE POLICY "products_admin_access" ON public.products
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- =====================================================
-- VERIFICAÇÃO DO RESULTADO
-- =====================================================

\echo '';
\echo '🔍 VERIFICANDO POLÍTICAS CORRIGIDAS...';

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.jwt()%' THEN '✅ USA JWT (sem recursão)'
        WHEN qual LIKE '%users%' AND tablename = 'users' THEN '❌ POSSÍVEL RECURSÃO'
        ELSE '✅ OK'
    END as recursion_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'promotions', 'braiders', 'products')
ORDER BY tablename, policyname;

\echo '';
\echo '✅ CORREÇÃO DE RECURSÃO RLS CONCLUÍDA!';
\echo 'Políticas agora usam auth.jwt() em vez de consultar users recursivamente.';
\echo 'Teste o sistema para confirmar que os erros foram resolvidos.';