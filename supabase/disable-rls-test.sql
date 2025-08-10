-- ============================================================================
-- TESTE: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================================================
-- ⚠️ APENAS PARA TESTE - REABILITAR DEPOIS!

-- 1. Verificar status atual
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'messages';

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'messages';

-- ============================================================================
-- INSTRUÇÕES:
-- ============================================================================
-- 1. Execute este SQL
-- 2. Teste o chat real-time IMEDIATAMENTE
-- 3. Se funcionar, o problema são as políticas RLS
-- 4. REABILITE IMEDIATAMENTE: ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;