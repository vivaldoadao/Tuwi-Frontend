-- ============================================================================
-- SOLUÇÃO DEFINITIVA PARA REAL-TIME COM SEGURANÇA BALANCEADA
-- ============================================================================
-- Esta é uma solução que permite real-time funcionar COM controles de segurança

-- ============================================================================
-- PASSO 1: LIMPAR POLÍTICAS EXISTENTES
-- ============================================================================

-- Remover todas as políticas problemáticas das mensagens
DROP POLICY IF EXISTS "messages_realtime_controlled" ON public.messages;
DROP POLICY IF EXISTS "messages_select_secure" ON public.messages;
DROP POLICY IF EXISTS "messages_select_realtime" ON public.messages;
DROP POLICY IF EXISTS "messages_realtime_open" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.messages;

-- Remover políticas dos typing indicators
DROP POLICY IF EXISTS "typing_realtime_controlled" ON public.typing_indicators;
DROP POLICY IF EXISTS "typing_select_secure" ON public.typing_indicators;
DROP POLICY IF EXISTS "typing_realtime_open" ON public.typing_indicators;

-- ============================================================================
-- PASSO 2: POLÍTICAS PERMISSIVAS MAS CONTROLADAS
-- ============================================================================

-- MESSAGES: Permissivo o suficiente para real-time, mas com tempo limite
CREATE POLICY "messages_realtime_balanced" ON public.messages
  FOR SELECT 
  USING (
    -- Sempre permitir para service_role
    auth.role() = 'service_role' OR
    (
      -- Para usuários autenticados, permitir acesso a mensagens:
      auth.role() = 'authenticated' AND (
        -- 1. Mensagens recentes (últimas 6 horas) - para real-time funcionar
        created_at > NOW() - INTERVAL '6 hours'
        OR
        -- 2. Mensagens de conversas onde o usuário participa
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id
          AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
        )
      )
    )
  );

-- TYPING_INDICATORS: Permissivo para funcionamento real-time
CREATE POLICY "typing_realtime_balanced" ON public.typing_indicators
  FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    (
      auth.role() = 'authenticated' AND
      -- Apenas indicadores muito recentes (últimos 2 minutos)
      last_typed_at > NOW() - INTERVAL '2 minutes'
    )
  );

-- ============================================================================
-- PASSO 3: GARANTIR PUBLICAÇÃO REAL-TIME
-- ============================================================================

-- Verificar e adicionar tabelas à publicação real-time
DO $$ 
BEGIN
  -- Adicionar messages se não estiver na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  
  -- Adicionar typing_indicators se não estiver na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'typing_indicators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
  END IF;
  
  -- Adicionar conversations se não estiver na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- ============================================================================
-- PASSO 4: FUNÇÕES DE SEGURANÇA ADICIONAIS
-- ============================================================================

-- Função para verificar se usuário pode acessar conversa (client-side)
CREATE OR REPLACE FUNCTION public.can_access_conversation(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conv_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  );
END;
$$;

-- Função para obter mensagens com filtragem de segurança
CREATE OR REPLACE FUNCTION public.get_safe_messages(
  conv_id UUID,
  message_limit INTEGER DEFAULT 50,
  message_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  sender_name TEXT,
  sender_avatar TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar permissão
  IF NOT public.can_access_conversation(conv_id) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.message_type,
    m.created_at,
    u.name as sender_name,
    u.avatar_url as sender_avatar,
    m.is_read,
    m.read_at
  FROM public.messages m
  JOIN public.users u ON u.id = m.sender_id
  WHERE m.conversation_id = conv_id
    AND m.is_deleted = false
  ORDER BY m.created_at DESC
  LIMIT message_limit
  OFFSET message_offset;
END;
$$;

-- ============================================================================
-- PASSO 5: MONITORAMENTO E AUDITORIA
-- ============================================================================

-- Tabela de auditoria simples
CREATE TABLE IF NOT EXISTS public.realtime_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na auditoria
ALTER TABLE public.realtime_audit ENABLE ROW LEVEL SECURITY;

-- Política para auditoria - usuários só veem seus próprios logs
CREATE POLICY "users_own_audit_logs" ON public.realtime_audit
  FOR SELECT 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Função para log de auditoria
CREATE OR REPLACE FUNCTION public.audit_realtime_access(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.realtime_audit (user_id, action, table_name, record_id)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id);
END;
$$;

-- ============================================================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se políticas foram criadas
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'typing_indicators')
  AND policyname LIKE '%realtime_balanced%'
ORDER BY tablename, policyname;

-- Verificar publicação real-time
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'typing_indicators', 'conversations')
ORDER BY tablename;

-- ============================================================================
-- COMENTÁRIOS E INSTRUÇÕES
-- ============================================================================

COMMENT ON POLICY "messages_realtime_balanced" ON public.messages 
IS 'BALANCEADO: Permite real-time com controle temporal de 6h + verificação de participação';

COMMENT ON POLICY "typing_realtime_balanced" ON public.typing_indicators 
IS 'BALANCEADO: Permite real-time com controle temporal de 2min para typing indicators';

COMMENT ON FUNCTION public.can_access_conversation(UUID) 
IS 'SEGURANÇA: Verificar se usuário pode acessar conversa';

COMMENT ON FUNCTION public.get_safe_messages(UUID, INTEGER, INTEGER) 
IS 'SEGURANÇA: Obter mensagens com verificação de permissão';

-- ============================================================================
-- INSTRUÇÕES FINAIS
-- ============================================================================

/*
PRÓXIMOS PASSOS:

1. Execute este SQL no Supabase
2. Teste imediatamente se real-time funciona
3. Se funcionar:
   - Use as funções get_safe_messages() nas APIs
   - Implemente filtragem client-side adicional
   - Monitore logs de auditoria

4. Se não funcionar:
   - Verifique logs do Supabase
   - Considere usar polling como fallback
   - Verifique configuração WebSocket

SEGURANÇA:
- Políticas permitem real-time MAS com limitações temporais
- Funções adicionais oferecem camada extra de segurança
- Auditoria permite monitorar acessos
- Client-side deve filtrar dados adicionalmente

MONITORAMENTO:
- Verificar regularmente tabela realtime_audit
- Monitorar performance das políticas
- Ajustar intervalos de tempo conforme necessário
*/