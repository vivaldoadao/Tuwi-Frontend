-- ============================================================================
-- CORRIGIR PUBLICAÇÃO REAL-TIME PARA CHAT
-- ============================================================================

-- IMPORTANTE: Execute este SQL no Supabase SQL Editor

-- Verificar publicações real-time existentes
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete 
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Verificar quais tabelas estão na publicação
SELECT 
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- ============================================================================
-- ADICIONAR TABELAS À PUBLICAÇÃO REAL-TIME
-- ============================================================================

-- Adicionar messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Adicionar conversations table  
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Adicionar typing_indicators table
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Adicionar user_presence table (se ainda não estiver)
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- ============================================================================
-- VERIFICAR SE FOI ADICIONADO COM SUCESSO
-- ============================================================================

-- Verificar novamente quais tabelas estão na publicação
SELECT 
  tablename,
  'ENABLED' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'conversations', 'typing_indicators', 'user_presence')
ORDER BY tablename;

-- Se não aparecer nada, significa que não foi adicionado
-- Nesse caso, pode ser necessário recriar a publicação

-- ============================================================================
-- ALTERNATIVA: RECRIAR PUBLICAÇÃO SE NECESSÁRIO
-- ============================================================================

-- ATENÇÃO: Só execute se as tabelas não foram adicionadas acima!

-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime FOR TABLE 
--   messages, 
--   conversations, 
--   typing_indicators, 
--   user_presence;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

-- Após executar, testar com:
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Deve mostrar:
-- conversations
-- messages  
-- typing_indicators
-- user_presence