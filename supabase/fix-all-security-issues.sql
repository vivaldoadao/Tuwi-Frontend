-- ============================================================================
-- CORRIGIR TODAS AS VULNERABILIDADES DE SEGURANÇA
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
-- 2. VERIFICAR E CORRIGIR USER_PRESENCE
-- ============================================================================

-- Verificar políticas atuais
SELECT polname, polusing::text FROM pg_policy WHERE polrelid = 'user_presence'::regclass;

-- Se houver políticas muito permissivas, substituir por:
DROP POLICY IF EXISTS "Authenticated users can view all presence" ON public.user_presence;
DROP POLICY IF EXISTS "Allow authenticated users to read all presence" ON public.user_presence;

-- Política mais restritiva para user_presence (opcional - pode impactar funcionalidade)
CREATE POLICY "presence_select_limited" ON public.user_presence
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    (
      user_id = auth.uid() OR  -- Própria presença
      EXISTS (  -- Ou usuários com quem tem conversas
        SELECT 1 FROM public.conversations c
        WHERE (c.participant_1_id = auth.uid() AND c.participant_2_id = user_presence.user_id::uuid)
           OR (c.participant_2_id = auth.uid() AND c.participant_1_id = user_presence.user_id::uuid)
      )
    )
  );

-- ============================================================================
-- 3. VERIFICAR CONVERSATIONS TABLE
-- ============================================================================

-- Verificar políticas de conversas
SELECT polname, polusing::text FROM pg_policy WHERE polrelid = 'conversations'::regclass;

-- Se necessário, criar política segura para conversations
DROP POLICY IF EXISTS "conversations_select_all" ON public.conversations;

CREATE POLICY "conversations_select_secure" ON public.conversations
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  );

-- ============================================================================
-- 4. CORRIGIR MESSAGES (VERSÃO MAIS SEGURA)
-- ============================================================================

-- Remover políticas inseguras
DROP POLICY IF EXISTS "messages_select_realtime" ON public.messages;

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

-- ============================================================================
-- 5. VERIFICAR SEGURANÇA GERAL
-- ============================================================================

-- Listar todas as políticas suspeitas (que usam 'true')
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND qual LIKE '%true%'
  AND tablename IN ('messages', 'conversations', 'typing_indicators', 'user_presence');

-- ============================================================================
-- COMENTÁRIOS DE SEGURANÇA
-- ============================================================================

COMMENT ON POLICY "typing_select_secure" ON public.typing_indicators 
IS 'SEGURO: Usuários só veem typing indicators de suas conversas';

COMMENT ON POLICY "messages_select_secure" ON public.messages 
IS 'SEGURO: Usuários só veem mensagens de suas conversas';

COMMENT ON POLICY "presence_select_limited" ON public.user_presence 
IS 'LIMITADO: Usuários só veem presença de contatos com conversas';

-- ============================================================================
-- INSTRUÇÕES PÓS-EXECUÇÃO
-- ============================================================================

-- 1. Execute este SQL
-- 2. Teste se o real-time ainda funciona
-- 3. Se parar de funcionar, temos soluções alternativas
-- 4. Verifique se não há vazamento de dados com:
--    SELECT COUNT(*) FROM messages;  (deve mostrar apenas suas mensagens)
--    SELECT COUNT(*) FROM typing_indicators;  (deve mostrar apenas suas conversas)