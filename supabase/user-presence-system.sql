-- ============================================================================
-- SISTEMA DE PRESENÇA E STATUS ONLINE DOS USUÁRIOS
-- ============================================================================

-- Tabela para rastrear presença online dos usuários
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity ON public.user_presence(last_activity DESC);

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR PRESENÇA DO USUÁRIO
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_is_online BOOLEAN DEFAULT TRUE,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Inserir ou atualizar presença do usuário
  INSERT INTO public.user_presence (
    user_id, 
    is_online, 
    last_seen, 
    last_activity,
    user_agent,
    ip_address,
    updated_at
  )
  VALUES (
    p_user_id, 
    p_is_online, 
    NOW(), 
    NOW(),
    p_user_agent,
    p_ip_address,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_online = p_is_online,
    last_seen = CASE WHEN p_is_online THEN NOW() ELSE user_presence.last_seen END,
    last_activity = NOW(),
    user_agent = COALESCE(p_user_agent, user_presence.user_agent),
    ip_address = COALESCE(p_ip_address, user_presence.ip_address),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO PARA MARCAR USUÁRIO COMO OFFLINE
-- ============================================================================

CREATE OR REPLACE FUNCTION set_user_offline(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.user_presence
  SET 
    is_online = FALSE,
    last_activity = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO PARA LIMPAR USUÁRIOS OFFLINE ANTIGOS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS VOID AS $$
BEGIN
  -- Marcar como offline usuários sem atividade há mais de 5 minutos
  UPDATE public.user_presence
  SET 
    is_online = FALSE,
    updated_at = NOW()
  WHERE 
    is_online = TRUE 
    AND last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_user_presence_updated_at 
  BEFORE UPDATE ON public.user_presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver a presença de outros usuários (necessário para chat)
CREATE POLICY "Users can view all user presence" ON public.user_presence
  FOR SELECT USING (true);

-- Usuários podem atualizar apenas sua própria presença
CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================================
-- FUNÇÃO PARA OBTER STATUS DE MÚLTIPLOS USUÁRIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_users_presence(
  p_user_ids UUID[]
) RETURNS TABLE(
  user_id UUID,
  is_online BOOLEAN,
  last_seen TIMESTAMPTZ,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.is_online,
    up.last_seen,
    up.last_activity
  FROM public.user_presence up
  WHERE up.user_id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.user_presence IS 'Rastreamento de presença online dos usuários';
COMMENT ON FUNCTION update_user_presence(UUID, BOOLEAN, TEXT, INET) IS 'Atualiza status online do usuário';
COMMENT ON FUNCTION set_user_offline(UUID) IS 'Marca usuário como offline';
COMMENT ON FUNCTION cleanup_offline_users() IS 'Limpa usuários offline antigos (executar periodicamente)';
COMMENT ON FUNCTION get_users_presence(UUID[]) IS 'Obtém status de presença de múltiplos usuários';

-- ============================================================================
-- HABILITAR REAL-TIME PARA PRESENÇA
-- ============================================================================

-- Adicionar tabela de presença à publicação real-time
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;