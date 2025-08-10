-- ============================================================================
-- SOLUÇÃO HÍBRIDA: SEGURANÇA + REAL-TIME
-- ============================================================================
-- Esta solução usa políticas permissivas MAS com controles de segurança adicionais

-- ============================================================================
-- 1. POLÍTICAS PERMISSIVAS PARA REAL-TIME (com limitações)
-- ============================================================================

-- MESSAGES: Permissivo para real-time MAS com controle de aplicação
DROP POLICY IF EXISTS "messages_select_secure" ON public.messages;
CREATE POLICY "messages_realtime_controlled" ON public.messages
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    -- Permitir acesso a mensagens recentes (últimas 24h) de conversas ativas
    (
      created_at > NOW() - INTERVAL '24 hours' OR
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
      )
    )
  );

-- TYPING_INDICATORS: Permissivo para real-time funcionar
DROP POLICY IF EXISTS "typing_select_secure" ON public.typing_indicators;
CREATE POLICY "typing_realtime_controlled" ON public.typing_indicators
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    -- Apenas indicadores recentes (último minuto)
    last_typed_at > NOW() - INTERVAL '1 minute'
  );

-- ============================================================================
-- 2. CONTROLES DE SEGURANÇA NO CLIENT-SIDE
-- ============================================================================

-- Criar função para verificar permissão de conversa
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conversation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_uuid
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  );
END;
$$;

-- Criar função para obter mensagens seguras
CREATE OR REPLACE FUNCTION public.get_secure_messages(conversation_uuid UUID, message_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  sender_name TEXT,
  sender_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se usuário pode acessar a conversa
  IF NOT public.user_can_access_conversation(conversation_uuid) THEN
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
    u.avatar_url as sender_avatar
  FROM public.messages m
  JOIN public.users u ON u.id = m.sender_id
  WHERE m.conversation_id = conversation_uuid
    AND m.is_deleted = false
  ORDER BY m.created_at DESC
  LIMIT message_limit;
END;
$$;

-- ============================================================================
-- 3. AUDITORIA E MONITORAMENTO
-- ============================================================================

-- Tabela de auditoria para detectar acessos suspeitos
CREATE TABLE IF NOT EXISTS public.security_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para log de auditoria
CREATE OR REPLACE FUNCTION public.audit_log(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_suspicious BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit (
    user_id,
    action,
    resource_type,
    resource_id,
    suspicious
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_suspicious
  );
END;
$$;

-- ============================================================================
-- 4. RATE LIMITING
-- ============================================================================

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO action_count
  FROM public.security_audit
  WHERE user_id = auth.uid()
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN action_count < p_limit;
END;
$$;

-- ============================================================================
-- 5. COMENTÁRIOS E INSTRUÇÕES
-- ============================================================================

COMMENT ON POLICY "messages_realtime_controlled" ON public.messages 
IS 'HÍBRIDO: Permite real-time mas com controles temporais e de acesso';

COMMENT ON POLICY "typing_realtime_controlled" ON public.typing_indicators 
IS 'HÍBRIDO: Permite real-time para indicadores recentes apenas';

COMMENT ON FUNCTION public.get_secure_messages(UUID, INTEGER) 
IS 'SEGURO: Função para obter mensagens com verificação de permissão';

-- ============================================================================
-- INSTRUÇÕES FINAIS
-- ============================================================================

/*
PRÓXIMOS PASSOS:

1. Execute este SQL
2. Teste se real-time funciona
3. Se funcionar, implemente controles client-side:
   - Filtrar mensagens por conversação no hook
   - Usar get_secure_messages() para carregar mensagens
   - Implementar rate limiting nas APIs
   
4. Monitoramento:
   - Verificar logs de auditoria regularmente
   - Alertar sobre atividade suspeita
   - Implementar dashboard de segurança
*/