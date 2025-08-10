-- Verificar quais tabelas estão na publicação real-time
SELECT 
  tablename,
  'ENABLED' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Verificar políticas RLS na tabela messages
SELECT 
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive,
  polroles,
  polqual as using_expression,
  polwithcheck as with_check_expression
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as force_rls
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('messages', 'conversations', 'typing_indicators');