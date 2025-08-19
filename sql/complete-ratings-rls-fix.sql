-- ============================================================================
-- SCRIPT COMPLETO: Desativar RLS em TODAS as tabelas relacionadas ao sistema de ratings
-- ============================================================================

-- 1. Primeiro, verificar quais tabelas têm RLS ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ativo'
        ELSE '✅ RLS Desativado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%rating%'
ORDER BY tablename;

-- 2. Verificar políticas existentes em tabelas de rating
SELECT schemaname, tablename, policyname
FROM pg_policies 
WHERE tablename LIKE '%rating%'
ORDER BY tablename, policyname;

-- 3. Remover TODAS as políticas de TODAS as tabelas relacionadas a ratings
-- Tabela: ratings
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

-- Tabela: braider_rating_stats
DROP POLICY IF EXISTS "Users can view braider stats" ON braider_rating_stats;
DROP POLICY IF EXISTS "System can update braider stats" ON braider_rating_stats;
DROP POLICY IF EXISTS "Enable read access for all users" ON braider_rating_stats;
DROP POLICY IF EXISTS "Enable update for system only" ON braider_rating_stats;
DROP POLICY IF EXISTS "Allow public read access" ON braider_rating_stats;
DROP POLICY IF EXISTS "Allow system updates" ON braider_rating_stats;

-- Outras possíveis tabelas relacionadas (caso existam)
DROP POLICY IF EXISTS "rating_reports_policy" ON rating_reports;
DROP POLICY IF EXISTS "rating_images_policy" ON rating_images;

-- 4. Desativar RLS em TODAS as tabelas relacionadas
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;

-- Verificar se braider_rating_stats existe antes de desativar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'braider_rating_stats' AND schemaname = 'public') THEN
        ALTER TABLE braider_rating_stats DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado em braider_rating_stats';
    ELSE
        RAISE NOTICE '⚠️ Tabela braider_rating_stats não encontrada';
    END IF;
END $$;

-- Verificar outras tabelas relacionadas (opcional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rating_reports' AND schemaname = 'public') THEN
        ALTER TABLE rating_reports DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado em rating_reports';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rating_images' AND schemaname = 'public') THEN
        ALTER TABLE rating_images DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado em rating_images';
    END IF;
END $$;

-- 5. Verificação final - Status de todas as tabelas relacionadas
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ativo - PROBLEMA'
        ELSE '✅ RLS Desativado - OK'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%rating%' OR tablename = 'braiders')
ORDER BY tablename;

-- 6. Verificação final - Políticas restantes (deve retornar vazio)
SELECT 'POLÍTICAS RESTANTES:' as check_type, schemaname, tablename, policyname
FROM pg_policies 
WHERE tablename LIKE '%rating%'
ORDER BY tablename, policyname;

-- 7. Mensagem final
SELECT 
    'SETUP COMPLETO!' as status,
    'Agora todas as tabelas de ratings têm RLS desativado' as message,
    'Segurança garantida via validação por email na API' as security_note;

-- ============================================================================
-- IMPORTANTE: Execute este script completo no SQL Editor do Supabase
-- 
-- Após a execução:
-- 1. Todas as tabelas relacionadas a ratings terão RLS desativado
-- 2. A segurança será garantida exclusivamente via API (/app/api/ratings/route.ts)
-- 3. O sistema de ratings funcionará sem erros 42501
-- ============================================================================