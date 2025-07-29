-- ============================================================================
-- TABELAS DO SISTEMA DE MENSAGENS
-- ============================================================================
-- Adiciona suporte completo para chat entre usuários e trancistas
-- ============================================================================

-- Tipos customizados para mensagens
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'booking_request', 'booking_confirmation');
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'blocked');

-- ============================================================================
-- TABELA DE CONVERSAS
-- ============================================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participantes da conversa
  participant_1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  participant_2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Metadata da conversa
  status conversation_status DEFAULT 'active',
  title VARCHAR(255), -- Título personalizado da conversa (opcional)
  
  -- Informações da última mensagem (para performance)
  last_message_id UUID, -- Será referência para messages(id)
  last_message_content TEXT,
  last_message_timestamp TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES public.users(id),
  
  -- Controle de leitura
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
-- TABELA DE MENSAGENS
-- ============================================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamentos
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo da mensagem
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  
  -- Arquivos anexos (URLs para storage)
  attachments TEXT[], -- Array de URLs de arquivos
  
  -- Metadata especial para tipos específicos
  metadata JSONB, -- Para booking_request, booking_confirmation, etc.
  
  -- Controle de entrega e leitura
  is_delivered BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Mensagem de resposta (threading)
  reply_to_message_id UUID REFERENCES public.messages(id),
  
  -- Controle de edição/exclusão
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA DE STATUS DE LEITURA (para conversas em grupo futuras)
-- ============================================================================
CREATE TABLE public.message_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================================================
-- TABELA DE NOTIFICAÇÕES DE MENSAGENS
-- ============================================================================
CREATE TABLE public.message_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para conversas
CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_timestamp DESC);
CREATE INDEX idx_conversations_status ON public.conversations(status);

-- Índices para mensagens
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_timestamp ON public.messages(created_at DESC);
CREATE INDEX idx_messages_type ON public.messages(message_type);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Índices para notificações
CREATE INDEX idx_message_notifications_user ON public.message_notifications(user_id);
CREATE INDEX idx_message_notifications_unread ON public.message_notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- TRIGGERS E FUNÇÕES
-- ============================================================================

-- Função para atualizar a última mensagem na conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nova mensagem: atualizar conversa
    UPDATE public.conversations 
    SET 
      last_message_id = NEW.id,
      last_message_content = NEW.content,
      last_message_timestamp = NEW.created_at,
      last_message_sender_id = NEW.sender_id,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    -- Criar notificação para o destinatário
    INSERT INTO public.message_notifications (user_id, conversation_id, message_id)
    SELECT 
      CASE 
        WHEN c.participant_1_id = NEW.sender_id THEN c.participant_2_id
        ELSE c.participant_1_id
      END,
      NEW.conversation_id,
      NEW.id
    FROM public.conversations c
    WHERE c.id = NEW.conversation_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar conversa quando nova mensagem é criada
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  messages_updated INTEGER;
BEGIN
  -- Marcar mensagens como lidas
  UPDATE public.messages 
  SET 
    is_read = TRUE,
    read_at = NOW()
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
  
  -- Marcar notificações como lidas
  UPDATE public.message_notifications
  SET is_read = TRUE
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id AND is_read = FALSE;
  
  RETURN messages_updated;
END;
$$ LANGUAGE plpgsql;

-- Função para criar ou obter conversa entre dois usuários
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Tentar encontrar conversa existente
  SELECT id INTO conversation_id
  FROM public.conversations 
  WHERE 
    (participant_1_id = p_user1_id AND participant_2_id = p_user2_id) OR
    (participant_1_id = p_user2_id AND participant_2_id = p_user1_id)
  LIMIT 1;
  
  -- Se não encontrou, criar nova
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (LEAST(p_user1_id, p_user2_id), GREATEST(p_user1_id, p_user2_id))
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

-- Políticas para mensagens
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Políticas para status de leitura
CREATE POLICY "Users can manage their own read status" ON public.message_read_status
  FOR ALL USING (user_id = auth.uid());

-- Políticas para notificações
CREATE POLICY "Users can view their own message notifications" ON public.message_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own message notifications" ON public.message_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON public.conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON public.messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();