-- ============================================================================
-- FIX FOREIGN KEY CONSTRAINT FOR USER PRESENCE
-- ============================================================================
-- Remove foreign key constraint temporariamente para permitir presença 
-- de usuários que podem vir de diferentes sistemas de auth

-- Remover constraint existente
ALTER TABLE public.user_presence DROP CONSTRAINT IF EXISTS user_presence_user_id_fkey;

-- Recriar tabela sem foreign key constraint (mais flexível)
-- Isso permite que usuários de NextAuth tenham presença mesmo se não estão na tabela users
CREATE TABLE IF NOT EXISTS public.user_presence_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE, -- Removido REFERENCES para maior flexibilidade
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar dados existentes
INSERT INTO public.user_presence_new 
SELECT * FROM public.user_presence 
ON CONFLICT (user_id) DO NOTHING;

-- Trocar as tabelas
DROP TABLE public.user_presence;
ALTER TABLE public.user_presence_new RENAME TO user_presence;

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity ON public.user_presence(last_activity DESC);

-- Recriar trigger
CREATE TRIGGER update_user_presence_updated_at 
  BEFORE UPDATE ON public.user_presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS novamente
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS
CREATE POLICY "Users can view all user presence" ON public.user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Habilitar real-time novamente
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- ============================================================================
-- ATUALIZAR FUNÇÃO update_user_presence (agora sem restrições FK)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_is_online BOOLEAN DEFAULT TRUE,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Inserir ou atualizar presença do usuário (sem verificar FK)
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
    
  -- Log sucesso
  RAISE NOTICE 'User presence updated successfully for user_id: %', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;