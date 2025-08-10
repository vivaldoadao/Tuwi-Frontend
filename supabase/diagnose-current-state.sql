-- ============================================================================
-- DIAGNÓSTICO COMPLETO DO ESTADO ATUAL
-- ============================================================================

-- 1. Verificar todas as políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'conversations', 'typing_indicators')
ORDER BY tablename, policyname;

-- 2. Verificar se RLS está habilitado nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'conversations', 'typing_indicators');

-- 3. Verificar publicação real-time
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'conversations', 'typing_indicators')
ORDER BY tablename;

-- 4. Verificar se existe alguma política com USING(true) - perigosa
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND qual = 'true'
  AND tablename IN ('messages', 'conversations', 'typing_indicators', 'user_presence');

-- 5. Verificar estrutura da tabela messages
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 6. Verificar se há mensagens na tabela (teste básico)
SELECT COUNT(*) as total_messages FROM public.messages;

-- 7. Verificar últimas mensagens criadas
SELECT 
  id,
  sender_id,
  conversation_id,
  content,
  created_at
FROM public.messages 
ORDER BY created_at DESC 
LIMIT 5;