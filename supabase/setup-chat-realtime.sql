-- ============================================================================
-- SETUP COMPLETO PARA CHAT REAL-TIME (MENSAGENS E TYPING INDICATORS)
-- ============================================================================

-- ============================================================================
-- CRIAR TABELA TYPING INDICATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  last_typed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one typing indicator per user per conversation
  UNIQUE(conversation_id, user_id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON public.typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_last_typed ON public.typing_indicators(last_typed_at);

-- ============================================================================
-- RLS POLICIES PARA TYPING INDICATORS
-- ============================================================================

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view typing indicators for their conversations" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.typing_indicators;
DROP POLICY IF EXISTS "Service role full access typing" ON public.typing_indicators;

-- Política para VIEW - usuários podem ver typing indicators das suas conversas
CREATE POLICY "Users can view typing indicators for their conversations" ON public.typing_indicators
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- Política para INSERT/UPDATE/DELETE - usuários só podem gerenciar seus próprios indicators
CREATE POLICY "Users can manage their own typing indicators" ON public.typing_indicators
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    user_id = auth.uid()
  );

-- Política para service role (APIs)
CREATE POLICY "Service role full access typing" ON public.typing_indicators
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICAR E CORRIGIR RLS POLICIES PARA MENSAGENS
-- ============================================================================

-- Remover políticas restritivas de mensagens se existirem
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Service role full access messages" ON public.messages;

-- Políticas mais permissivas para mensagens (necessárias para real-time)
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON public.messages
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

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    sender_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    sender_id = auth.uid()
  );

-- Service role para mensagens
CREATE POLICY "Service role full access messages" ON public.messages
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- HABILITAR REAL-TIME PARA TODAS AS TABELAS NECESSÁRIAS
-- ============================================================================

-- Adicionar tabelas à publicação real-time
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table typing_indicators already in realtime publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table messages already in realtime publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table conversations already in realtime publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table user_presence already in realtime publication';
  END;
END $$;

-- ============================================================================
-- TRIGGER PARA AUTO-CLEANUP DE TYPING INDICATORS ANTIGOS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE last_typed_at < NOW() - INTERVAL '10 seconds';
END;
$$;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_typing_indicators_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS typing_indicators_updated_at ON public.typing_indicators;
CREATE TRIGGER typing_indicators_updated_at
  BEFORE UPDATE ON public.typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_indicators_updated_at();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.typing_indicators IS 'Tabela para indicadores de digitação em tempo real';
COMMENT ON POLICY "Users can view typing indicators for their conversations" ON public.typing_indicators IS 'Usuários podem ver typing indicators das suas conversas';
COMMENT ON POLICY "Users can manage their own typing indicators" ON public.typing_indicators IS 'Usuários podem gerenciar apenas seus próprios typing indicators';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se as tabelas estão habilitadas para real-time
SELECT 
  schemaname,
  tablename,
  CASE WHEN tablename IN (
    SELECT tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
  ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END as realtime_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'conversations', 'typing_indicators', 'user_presence')
ORDER BY tablename;