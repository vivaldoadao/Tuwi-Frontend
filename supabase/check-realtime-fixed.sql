-- ============================================================================
-- VERIFICAR STATUS REAL-TIME (CORRIGIDO)
-- ============================================================================

-- 1. Verificar quais tabelas estão na publicação real-time
SELECT 
  tablename,
  'ENABLED' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 2. Verificar políticas RLS na tabela messages
SELECT 
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;

-- 3. Verificar se RLS está habilitado (corrigido)
SELECT 
  t.tablename,
  c.relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('messages', 'conversations', 'typing_indicators');