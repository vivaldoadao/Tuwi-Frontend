-- ============================================================================
-- SCRIPT: Desativar RLS nas tabelas de ratings e estatísticas
-- ============================================================================

-- 1. Remover todas as políticas RLS da tabela ratings
DROP POLICY IF EXISTS "Users can view own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON ratings;
DROP POLICY IF EXISTS "Braiders can view ratings about them" ON ratings;
DROP POLICY IF EXISTS "Braiders can respond to ratings" ON ratings;
DROP POLICY IF EXISTS "System can manage all ratings" ON ratings;
DROP POLICY IF EXISTS "Enable read access for all users" ON ratings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ratings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON ratings;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON ratings;
DROP POLICY IF EXISTS "Allow public read access to ratings" ON ratings;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON ratings;
DROP POLICY IF EXISTS "Allow update for rating owners" ON ratings;
DROP POLICY IF EXISTS "Allow delete for rating owners" ON ratings;

-- 2. Remover políticas RLS da tabela braider_rating_stats
DROP POLICY IF EXISTS "Users can view braider stats" ON braider_rating_stats;
DROP POLICY IF EXISTS "System can update braider stats" ON braider_rating_stats;
DROP POLICY IF EXISTS "Enable read access for all users" ON braider_rating_stats;
DROP POLICY IF EXISTS "Enable update for system only" ON braider_rating_stats;
DROP POLICY IF EXISTS "Allow public read access" ON braider_rating_stats;
DROP POLICY IF EXISTS "Allow system updates" ON braider_rating_stats;

-- 3. Desativar RLS nas tabelas
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_rating_stats DISABLE ROW LEVEL SECURITY;

-- 4. Verificar status final de ambas as tabelas
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ativo'
        ELSE '✅ RLS Desativado'
    END as status
FROM pg_tables 
WHERE tablename IN ('ratings', 'braider_rating_stats') AND schemaname = 'public'
ORDER BY tablename;

-- 5. Verificar se não há políticas restantes
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('ratings', 'braider_rating_stats')
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTA: Após executar este script, a segurança será garantida exclusivamente
-- através da validação por email na API em /app/api/ratings/route.ts
-- 
-- Tabelas afetadas:
-- - ratings: Desabilitado RLS, protegido via API
-- - braider_rating_stats: Desabilitado RLS, atualizado via RPC system
-- ============================================================================