-- ============================================================================
-- TESTE: DESABILITAR RLS TEMPORARIAMENTE PARA DIAGNÓSTICO
-- ============================================================================
-- ⚠️ ATENÇÃO: Isso é apenas para teste, não deixe em produção!

-- 1. Primeiro, vamos ver o status atual
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename = 'messages';

-- 2. Desabilitar RLS temporariamente para teste
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename = 'messages';

-- ============================================================================
-- IMPORTANTE: APÓS O TESTE, REABILITAR RLS!
-- ============================================================================

-- Para reabilitar depois do teste:
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INSTRUÇÕES PARA TESTE:
-- ============================================================================

-- 1. Execute este SQL
-- 2. Teste o chat em tempo real
-- 3. Se funcionar, o problema são as políticas RLS
-- 4. REABILITE o RLS imediatamente:
--    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;