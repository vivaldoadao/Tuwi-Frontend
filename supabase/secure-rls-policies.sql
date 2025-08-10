-- ============================================================================
-- POLÍTICAS RLS SEGURAS PARA REAL-TIME
-- ============================================================================
-- Esta solução permite real-time funcionar MAS mantém a segurança

-- 1. REMOVER A POLÍTICA INSEGURA ATUAL
DROP POLICY IF EXISTS "messages_select_realtime" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_service" ON public.messages;

-- ============================================================================
-- POLÍTICAS SEGURAS
-- ============================================================================

-- 2. POLÍTICA SELECT SEGURA - Usuários só veem mensagens de suas conversas
CREATE POLICY "messages_select_secure" ON public.messages
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- 3. POLÍTICA INSERT SEGURA
CREATE POLICY "messages_insert_secure" ON public.messages
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- 4. POLÍTICA UPDATE SEGURA
CREATE POLICY "messages_update_secure" ON public.messages
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    sender_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    sender_id = auth.uid()
  );

-- 5. SERVICE ROLE (para APIs)
CREATE POLICY "messages_service_secure" ON public.messages
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICAR SE REAL-TIME AINDA FUNCIONA
-- ============================================================================
-- Após executar, teste o chat. Se não funcionar, vamos para a solução alternativa

-- ============================================================================
-- SOLUÇÃO ALTERNATIVA (se real-time parar)
-- ============================================================================
-- Se o real-time parar de funcionar, podemos usar esta abordagem:

/*
-- Criar uma view que filtra mensagens por usuário
CREATE OR REPLACE VIEW public.user_messages AS
SELECT m.*
FROM public.messages m
JOIN public.conversations c ON c.id = m.conversation_id
WHERE c.participant_1_id = auth.uid() 
   OR c.participant_2_id = auth.uid();

-- Habilitar RLS na view
ALTER VIEW public.user_messages SET (security_barrier = true);

-- Então usar real-time na view em vez da tabela:
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;
*/

-- ============================================================================
-- COMENTÁRIOS DE SEGURANÇA
-- ============================================================================

COMMENT ON POLICY "messages_select_secure" ON public.messages 
IS 'Usuários só podem ler mensagens de conversas que participam - SEGURO para real-time';

COMMENT ON POLICY "messages_insert_secure" ON public.messages 
IS 'Usuários só podem inserir mensagens em conversas que participam';

COMMENT ON POLICY "messages_update_secure" ON public.messages 
IS 'Usuários só podem atualizar suas próprias mensagens';

-- ============================================================================
-- TESTE DE SEGURANÇA
-- ============================================================================
-- Para testar a segurança, tente acessar mensagens de outras conversas:
-- SELECT * FROM messages WHERE conversation_id = 'conversa-que-nao-participo';
-- Deve retornar 0 resultados se a política estiver funcionando