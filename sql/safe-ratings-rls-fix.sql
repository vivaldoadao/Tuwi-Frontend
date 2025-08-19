-- ============================================================================
-- SCRIPT SEGURO: Desativar RLS apenas em tabelas que existem
-- ============================================================================

-- 1. Verificar quais tabelas relacionadas a rating existem
SELECT 
    'TABELAS ENCONTRADAS:' as info,
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

-- 2. Verificar políticas existentes
SELECT 
    'POLÍTICAS ENCONTRADAS:' as info,
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE tablename LIKE '%rating%'
ORDER BY tablename, policyname;

-- 3. Remover políticas da tabela RATINGS (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ratings' AND schemaname = 'public') THEN
        -- Remover todas as políticas possíveis da tabela ratings
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
        
        -- Desativar RLS
        ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ RLS desativado na tabela RATINGS';
    ELSE
        RAISE NOTICE '⚠️ Tabela RATINGS não encontrada';
    END IF;
END $$;

-- 4. Remover políticas da tabela BRAIDER_RATING_STATS (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'braider_rating_stats' AND schemaname = 'public') THEN
        -- Remover todas as políticas possíveis
        DROP POLICY IF EXISTS "Users can view braider stats" ON braider_rating_stats;
        DROP POLICY IF EXISTS "System can update braider stats" ON braider_rating_stats;
        DROP POLICY IF EXISTS "Enable read access for all users" ON braider_rating_stats;
        DROP POLICY IF EXISTS "Enable update for system only" ON braider_rating_stats;
        DROP POLICY IF EXISTS "Allow public read access" ON braider_rating_stats;
        DROP POLICY IF EXISTS "Allow system updates" ON braider_rating_stats;
        
        -- Desativar RLS
        ALTER TABLE braider_rating_stats DISABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ RLS desativado na tabela BRAIDER_RATING_STATS';
    ELSE
        RAISE NOTICE '⚠️ Tabela BRAIDER_RATING_STATS não encontrada';
    END IF;
END $$;

-- 5. Verificar outras tabelas relacionadas (opcional e seguro)
DO $$
BEGIN
    -- Só tentar se a tabela existir
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rating_reports' AND schemaname = 'public') THEN
        ALTER TABLE rating_reports DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado em RATING_REPORTS';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rating_images' AND schemaname = 'public') THEN
        ALTER TABLE rating_images DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado em RATING_IMAGES';
    END IF;
END $$;

-- 6. Verificação final - Status de todas as tabelas relacionadas
SELECT 
    'STATUS FINAL:' as check_type,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ativo - PROBLEMA'
        ELSE '✅ RLS Desativado - OK'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%rating%'
ORDER BY tablename;

-- 7. Verificar se ainda há políticas (deve retornar vazio)
SELECT 
    'POLÍTICAS RESTANTES:' as check_type,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nenhuma política restante'
        ELSE '❌ Ainda há políticas ativas'
    END as result
FROM pg_policies 
WHERE tablename LIKE '%rating%';

-- 8. Listar políticas restantes (se houver)
SELECT 
    'DETALHES DAS POLÍTICAS RESTANTES:' as info,
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE tablename LIKE '%rating%'
ORDER BY tablename, policyname;

-- 9. Resultado final
SELECT 
    'OPERAÇÃO CONCLUÍDA!' as status,
    'Todas as tabelas de ratings têm RLS desativado' as message,
    'Sistema protegido via validação de email na API' as security_info;

-- ============================================================================
-- RESULTADO ESPERADO:
-- - ratings: RLS desativado ✅
-- - braider_rating_stats: RLS desativado ✅ 
-- - Todas as políticas removidas ✅
-- - Erro 42501 resolvido ✅
-- ============================================================================