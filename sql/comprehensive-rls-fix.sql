-- ============================================================================
-- SCRIPT SEGURO: Desativar RLS para corrigir problemas de rating e chat
-- ============================================================================

-- 1. Verificar quais tabelas problemáticas existem
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
AND (
    tablename LIKE '%rating%' OR 
    tablename = 'messages' OR 
    tablename = 'conversations' OR 
    tablename = 'typing_indicators'
)
ORDER BY tablename;

-- 2. Verificar políticas existentes
SELECT 
    'POLÍTICAS ENCONTRADAS:' as info,
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE (
    tablename LIKE '%rating%' OR 
    tablename = 'messages' OR 
    tablename = 'conversations' OR 
    tablename = 'typing_indicators'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. RATINGS: Remover políticas e desativar RLS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ratings' AND schemaname = 'public') THEN
        RAISE NOTICE '🔧 Processando tabela: ratings';
        
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
        RAISE NOTICE '✅ RLS desativado para: ratings';
    ELSE
        RAISE NOTICE '⚠️ Tabela não encontrada: ratings';
    END IF;
END $$;

-- ============================================================================
-- 4. BRAIDER_RATING_STATS: Remover políticas e desativar RLS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'braider_rating_stats' AND schemaname = 'public') THEN
        RAISE NOTICE '🔧 Processando tabela: braider_rating_stats';
        
        -- Remover políticas possíveis
        DROP POLICY IF EXISTS "Enable read access for all users" ON braider_rating_stats;
        DROP POLICY IF EXISTS "Enable select for authenticated users" ON braider_rating_stats;
        DROP POLICY IF EXISTS "Allow public read" ON braider_rating_stats;
        
        -- Desativar RLS
        ALTER TABLE braider_rating_stats DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado para: braider_rating_stats';
    ELSE
        RAISE NOTICE '⚠️ Tabela não encontrada: braider_rating_stats';
    END IF;
END $$;

-- ============================================================================
-- 5. CONVERSATIONS: Remover políticas e desativar RLS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'conversations' AND schemaname = 'public') THEN
        RAISE NOTICE '🔧 Processando tabela: conversations';
        
        -- Remover políticas possíveis
        DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
        DROP POLICY IF EXISTS "Enable read for participants" ON conversations;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;
        DROP POLICY IF EXISTS "Enable update for participants" ON conversations;
        DROP POLICY IF EXISTS "Allow participants to view" ON conversations;
        DROP POLICY IF EXISTS "Allow authenticated users to create" ON conversations;
        
        -- Desativar RLS
        ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado para: conversations';
    ELSE
        RAISE NOTICE '⚠️ Tabela não encontrada: conversations';
    END IF;
END $$;

-- ============================================================================
-- 6. MESSAGES: Remover políticas e desativar RLS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages' AND schemaname = 'public') THEN
        RAISE NOTICE '🔧 Processando tabela: messages';
        
        -- Remover políticas possíveis
        DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
        DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
        DROP POLICY IF EXISTS "Users can update own messages" ON messages;
        DROP POLICY IF EXISTS "Enable read for conversation participants" ON messages;
        DROP POLICY IF EXISTS "Enable insert for conversation participants" ON messages;
        DROP POLICY IF EXISTS "Enable update for message sender" ON messages;
        DROP POLICY IF EXISTS "Allow participants to view messages" ON messages;
        DROP POLICY IF EXISTS "Allow participants to send messages" ON messages;
        DROP POLICY IF EXISTS "Allow sender to update messages" ON messages;
        
        -- Desativar RLS
        ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado para: messages';
    ELSE
        RAISE NOTICE '⚠️ Tabela não encontrada: messages';
    END IF;
END $$;

-- ============================================================================
-- 7. TYPING_INDICATORS: Remover políticas e desativar RLS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'typing_indicators' AND schemaname = 'public') THEN
        RAISE NOTICE '🔧 Processando tabela: typing_indicators';
        
        -- Remover políticas possíveis
        DROP POLICY IF EXISTS "Users can manage typing indicators" ON typing_indicators;
        DROP POLICY IF EXISTS "Enable all for conversation participants" ON typing_indicators;
        DROP POLICY IF EXISTS "Allow participants to manage typing" ON typing_indicators;
        
        -- Desativar RLS
        ALTER TABLE typing_indicators DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desativado para: typing_indicators';
    ELSE
        RAISE NOTICE '⚠️ Tabela não encontrada: typing_indicators';
    END IF;
END $$;

-- ============================================================================
-- 8. Verificação final - mostrar status das tabelas
-- ============================================================================
SELECT 
    '🎯 STATUS FINAL:' as info,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ainda Ativo'
        ELSE '✅ RLS Desativado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
    tablename LIKE '%rating%' OR 
    tablename = 'messages' OR 
    tablename = 'conversations' OR 
    tablename = 'typing_indicators'
)
ORDER BY tablename;

-- ============================================================================
-- 9. Limpeza de políticas órfãs (opcional)
-- ============================================================================
SELECT 
    '🧹 POLÍTICAS RESTANTES:' as info,
    tablename, 
    policyname
FROM pg_policies 
WHERE (
    tablename LIKE '%rating%' OR 
    tablename = 'messages' OR 
    tablename = 'conversations' OR 
    tablename = 'typing_indicators'
)
ORDER BY tablename, policyname;

RAISE NOTICE '🎉 Script concluído! Verifique os resultados acima.';
RAISE NOTICE '💡 Lembre-se: A segurança agora é gerida a nível da API.';
RAISE NOTICE '🔄 Reinicie as subscrições real-time para aplicar as mudanças.';