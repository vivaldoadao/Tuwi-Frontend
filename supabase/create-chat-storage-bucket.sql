-- ============================================================================
-- CONFIGURAÇÃO DO STORAGE PARA CHAT
-- ============================================================================
-- Cria bucket e políticas para arquivos de mensagens (imagens, documentos)
-- ============================================================================

-- Criar bucket para arquivos de mensagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  false, -- Não público por segurança
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS RLS PARA STORAGE
-- ============================================================================

-- Política para permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid() IS NOT NULL AND
  -- O path deve seguir o padrão: conversations/{conversation_id}/{user_id}/{filename}
  (storage.foldername(name))[1] = 'conversations'
);

-- Política para permitir visualização apenas para participantes da conversa
CREATE POLICY "Users can view files from their conversations" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-files' AND
  auth.uid() IS NOT NULL AND
  -- Extrair conversation_id do path e verificar se o usuário é participante
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Política para permitir remoção apenas do próprio arquivo
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-files' AND
  auth.uid() IS NOT NULL AND
  -- O usuário deve ser o dono do arquivo (baseado no path)
  (storage.foldername(name))[3] = auth.uid()::text
);

-- ============================================================================
-- FUNÇÃO AUXILIAR PARA GERAR PATHS SEGUROS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_chat_file_path(
  p_conversation_id UUID,
  p_user_id UUID,
  p_filename TEXT
) RETURNS TEXT AS $$
DECLARE
  timestamp_str TEXT;
  safe_filename TEXT;
BEGIN
  -- Gerar timestamp único
  timestamp_str := EXTRACT(epoch FROM NOW())::bigint::text;
  
  -- Sanitizar nome do arquivo
  safe_filename := regexp_replace(p_filename, '[^a-zA-Z0-9._-]', '_', 'g');
  
  -- Retornar path seguro
  RETURN 'conversations/' || p_conversation_id::text || '/' || 
         p_user_id::text || '/' || timestamp_str || '_' || safe_filename;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO PARA UPLOAD DE ARQUIVO DE MENSAGEM
-- ============================================================================

CREATE OR REPLACE FUNCTION upload_message_file(
  p_conversation_id UUID,
  p_filename TEXT,
  p_content_type TEXT DEFAULT 'application/octet-stream'
) RETURNS JSON AS $$
DECLARE
  file_path TEXT;
  result JSON;
BEGIN
  -- Verificar se o usuário é participante da conversa
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = p_conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para fazer upload nesta conversa';
  END IF;
  
  -- Gerar path seguro para o arquivo
  file_path := generate_chat_file_path(p_conversation_id, auth.uid(), p_filename);
  
  -- Retornar informações para o frontend fazer o upload
  result := json_build_object(
    'path', file_path,
    'bucket', 'chat-files',
    'conversation_id', p_conversation_id,
    'uploader_id', auth.uid(),
    'content_type', p_content_type
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO PARA OBTER URL ASSINADA DE ARQUIVO
-- ============================================================================

CREATE OR REPLACE FUNCTION get_chat_file_url(
  p_file_path TEXT,
  p_expires_in INTEGER DEFAULT 3600 -- 1 hora
) RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Verificar se o usuário tem acesso ao arquivo
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects o
    JOIN public.conversations c ON c.id::text = (storage.foldername(o.name))[2]
    WHERE o.name = p_file_path
    AND o.bucket_id = 'chat-files'
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para acessar este arquivo';
  END IF;
  
  -- Gerar URL assinada (esta função precisa ser implementada no frontend)
  -- Por enquanto retornamos o path para ser processado no cliente
  RETURN 'storage/chat-files/' || p_file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- ============================================================================

-- View para arquivos de conversa com informações dos usuários
CREATE OR REPLACE VIEW chat_files_with_users AS
SELECT 
  o.name as file_path,
  o.id as file_id,
  o.created_at as uploaded_at,
  o.updated_at,
  (storage.foldername(o.name))[2]::uuid as conversation_id,
  (storage.foldername(o.name))[3]::uuid as uploader_id,
  u.name as uploader_name,
  u.email as uploader_email,
  c.participant_1_id,
  c.participant_2_id
FROM storage.objects o
JOIN public.conversations c ON c.id::text = (storage.foldername(o.name))[2]
JOIN public.users u ON u.id::text = (storage.foldername(o.name))[3]
WHERE o.bucket_id = 'chat-files';

COMMENT ON VIEW chat_files_with_users IS 'View que mostra arquivos de chat com informações dos usuários e conversas';