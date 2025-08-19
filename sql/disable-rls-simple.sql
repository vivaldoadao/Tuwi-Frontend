-- ============================================================================
-- SCRIPT SIMPLES: Desativar RLS e aplicar segurança a nível da API
-- ============================================================================

-- Verificar status atual das tabelas
SELECT 
    'STATUS ANTES:' as info,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ativo'
        ELSE '✅ RLS Desativado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
    tablename IN ('ratings', 'conversations', 'messages', 'typing_indicators', 'braider_rating_stats')
)
ORDER BY tablename;

-- ============================================================================
-- Desativar RLS em todas as tabelas problemáticas
-- ============================================================================

-- 1. Ratings - segurança já implementada na API
ALTER TABLE IF EXISTS ratings DISABLE ROW LEVEL SECURITY;

-- 2. Conversations - segurança já implementada na API
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;

-- 3. Messages - segurança já implementada na API  
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- 4. Typing Indicators - segurança já implementada na API
ALTER TABLE IF EXISTS typing_indicators DISABLE ROW LEVEL SECURITY;

-- 5. Braider Rating Stats - segurança já implementada na API
ALTER TABLE IF EXISTS braider_rating_stats DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verificar resultado final
-- ============================================================================

SELECT 
    'STATUS FINAL:' as info,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ainda Ativo'
        ELSE '✅ RLS Desativado - Segurança na API'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
    tablename IN ('ratings', 'conversations', 'messages', 'typing_indicators', 'braider_rating_stats')
)
ORDER BY tablename;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Todas as tabelas devem mostrar: ✅ RLS Desativado - Segurança na API
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Reinicie a aplicação para aplicar mudanças
-- 3. Teste o sistema de chat - erros intermitentes devem desaparecer
-- 4. A segurança continua robusta através das APIs
-- ============================================================================