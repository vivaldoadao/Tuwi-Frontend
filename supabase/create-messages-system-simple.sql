-- ============================================================================
-- SISTEMA DE MENSAGENS SIMPLIFICADO - COMPATÍVEL COM O SISTEMA EXISTENTE
-- ============================================================================

-- Tipos customizados simples
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'blocked');

-- ============================================================================
-- TABELA DE CONVERSAS SIMPLIFICADA
-- ============================================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participantes da conversa (usando UUIDs de users.id)
  participant_1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  participant_2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Status da conversa
  status conversation_status DEFAULT 'active',
  
  -- Informações da última mensagem (para performance na listagem)
  last_message_content TEXT,
  last_message_timestamp TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES public.users(id),
  
  -- Controle de leitura por participante
  participant_1_last_read_at TIMESTAMPTZ DEFAULT NOW(),
  participant_2_last_read_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que não há conversas duplicadas
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id)
);

-- ============================================================================
-- TABELA DE MENSAGENS SIMPLIFICADA  
-- ============================================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamentos
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo da mensagem
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  
  -- Arquivos anexos (URLs simples)
  attachments TEXT[], -- Array de URLs
  
  -- Controle de leitura
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para conversas
CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_timestamp DESC NULLS LAST);
CREATE INDEX idx_conversations_status ON public.conversations(status);

-- Índices para mensagens
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_timestamp ON public.messages(created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================================

-- Função para criar ou obter conversa entre dois usuários
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  smaller_id UUID;
  larger_id UUID;
BEGIN
  -- Ordenar IDs para evitar duplicatas (sempre menor primeiro)
  IF p_user1_id < p_user2_id THEN
    smaller_id := p_user1_id;
    larger_id := p_user2_id;
  ELSE
    smaller_id := p_user2_id;
    larger_id := p_user1_id;
  END IF;
  
  -- Tentar encontrar conversa existente
  SELECT id INTO conversation_id
  FROM public.conversations 
  WHERE 
    participant_1_id = smaller_id AND participant_2_id = larger_id
  LIMIT 1;
  
  -- Se não encontrou, criar nova
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  messages_updated INTEGER;
BEGIN
  -- Marcar mensagens como lidas (apenas as que não são do próprio usuário)
  UPDATE public.messages 
  SET 
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE 
    conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND is_read = FALSE;
  
  GET DIAGNOSTICS messages_updated = ROW_COUNT;
  
  -- Atualizar timestamp de leitura na conversa
  UPDATE public.conversations
  SET 
    participant_1_last_read_at = CASE WHEN participant_1_id = p_user_id THEN NOW() ELSE participant_1_last_read_at END,
    participant_2_last_read_at = CASE WHEN participant_2_id = p_user_id THEN NOW() ELSE participant_2_last_read_at END,
    updated_at = NOW()
  WHERE id = p_conversation_id;
  
  RETURN messages_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER PARA ATUALIZAR ÚLTIMA MENSAGEM
-- ============================================================================

-- Função trigger para atualizar a última mensagem na conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nova mensagem: atualizar conversa
    UPDATE public.conversations 
    SET 
      last_message_content = NEW.content,
      last_message_timestamp = NEW.created_at,
      last_message_sender_id = NEW.sender_id,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar conversa quando nova mensagem é criada
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================================

-- Usar a função existente update_updated_at_column se disponível
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON public.conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON public.messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLÍTICAS RLS SIMPLIFICADAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas - usar auth.uid() que funciona com NextAuth
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    participant_1_id::text = auth.uid()::text OR 
    participant_2_id::text = auth.uid()::text
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    participant_1_id::text = auth.uid()::text OR 
    participant_2_id::text = auth.uid()::text
  );

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    participant_1_id::text = auth.uid()::text OR 
    participant_2_id::text = auth.uid()::text
  );

-- Políticas para mensagens
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_1_id::text = auth.uid()::text OR 
            participant_2_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id::text = auth.uid()::text AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_1_id::text = auth.uid()::text OR 
            participant_2_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id::text = auth.uid()::text);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.conversations IS 'Conversas entre usuários (1:1)';
COMMENT ON TABLE public.messages IS 'Mensagens das conversas';

COMMENT ON FUNCTION get_or_create_conversation(UUID, UUID) IS 'Cria ou obtém conversa entre dois usuários';
COMMENT ON FUNCTION mark_messages_as_read(UUID, UUID) IS 'Marca mensagens como lidas para um usuário';

-- ============================================================================
-- DADOS DE TESTE (OPCIONAL)
-- ============================================================================

-- Inserir dados de teste apenas se não existirem usuários
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM public.conversations LIMIT 1) THEN
--     -- Criar conversa de teste se houver usuários
--     INSERT INTO public.conversations (participant_1_id, participant_2_id, last_message_content, last_message_timestamp)
--     SELECT 
--       u1.id, u2.id, 
--       'Conversa de teste criada automaticamente',
--       NOW()
--     FROM public.users u1, public.users u2
--     WHERE u1.id != u2.id
--     LIMIT 1;
--   END IF;
-- END $$;