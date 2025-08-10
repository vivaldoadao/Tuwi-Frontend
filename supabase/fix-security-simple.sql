-- ============================================================================
-- CORRIGIR VULNERABILIDADES DE SEGURANÇA (VERSÃO CORRIGIDA)
-- ============================================================================

-- ============================================================================
-- 1. CORRIGIR TYPING_INDICATORS (CRÍTICO)
-- ============================================================================

-- Remover políticas inseguras
DROP POLICY IF EXISTS "Users can view typing indicators for their conversations" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.typing_indicators;
DROP POLICY IF EXISTS "Service role full access typing" ON public.typing_indicators;
DROP POLICY IF EXISTS "realtime_select_policy" ON public.typing_indicators;
DROP POLICY IF EXISTS "realtime_insert_policy" ON public.typing_indicators;
DROP POLICY IF EXISTS "service_role_policy" ON public.typing_indicators;

-- Políticas SEGURAS para typing_indicators
CREATE POLICY "typing_select_secure" ON public.typing_indicators
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "typing_insert_secure" ON public.typing_indicators
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "typing_update_secure" ON public.typing_indicators
  FOR UPDATE 
  USING (auth.role() = 'authenticated' AND user_id = auth.uid())
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "typing_delete_secure" ON public.typing_indicators
  FOR DELETE 
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "typing_service_secure" ON public.typing_indicators
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. CORRIGIR MESSAGES (SEGURO)
-- ============================================================================

-- Remover políticas inseguras
DROP POLICY IF EXISTS "messages_select_realtime" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_service" ON public.messages;

-- Política SELECT segura para messages
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

CREATE POLICY "messages_update_secure" ON public.messages
  FOR UPDATE 
  USING (auth.role() = 'authenticated' AND sender_id = auth.uid())
  WITH CHECK (auth.role() = 'authenticated' AND sender_id = auth.uid());

CREATE POLICY "messages_service_secure" ON public.messages
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. CORRIGIR CONVERSATIONS (SEGURO)
-- ============================================================================

DROP POLICY IF EXISTS "conversations_select_all" ON public.conversations;

CREATE POLICY "conversations_select_secure" ON public.conversations
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  );

-- ============================================================================
-- 4. VERIFICAÇÃO FINAL DE SEGURANÇA
-- ============================================================================

-- Verificar se as políticas foram aplicadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'conversations', 'typing_indicators')
ORDER BY tablename, policyname;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "typing_select_secure" ON public.typing_indicators 
IS 'SEGURO: Usuários só veem typing indicators de suas conversas';

COMMENT ON POLICY "messages_select_secure" ON public.messages 
IS 'SEGURO: Usuários só veem mensagens de suas conversas';

COMMENT ON POLICY "conversations_select_secure" ON public.conversations 
IS 'SEGURO: Usuários só veem suas próprias conversas';

-- ============================================================================
-- TESTE DE SEGURANÇA APÓS EXECUÇÃO
-- ============================================================================

-- Execute estes comandos depois para testar:
-- SELECT COUNT(*) FROM messages;  (deve mostrar apenas mensagens de suas conversas)
-- SELECT COUNT(*) FROM typing_indicators;  (deve mostrar apenas indicadores de suas conversas)
-- SELECT COUNT(*) FROM conversations;  (deve mostrar apenas suas conversas)