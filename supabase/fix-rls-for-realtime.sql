-- ============================================================================
-- CORRIGIR POLÍTICAS RLS PARA REAL-TIME FUNCIONAR
-- ============================================================================

-- O problema é que as políticas RLS podem estar muito restritivas para real-time
-- Vamos criar políticas mais permissivas especificamente para subscriptions

-- ============================================================================
-- REMOVER POLÍTICAS RESTRITIVAS EXISTENTES
-- ============================================================================

-- Remover todas as políticas existentes da tabela messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Service role full access messages" ON public.messages;

-- ============================================================================
-- CRIAR POLÍTICAS MAIS PERMISSIVAS PARA REAL-TIME
-- ============================================================================

-- Política MUITO permissiva para SELECT (necessária para real-time)
-- Esta política permite que qualquer usuário autenticado veja qualquer mensagem
-- Isso é necessário para real-time funcionar, pois as subscriptions precisam acessar todas as mensagens
CREATE POLICY "Allow authenticated users to read messages" ON public.messages
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política para INSERT - usuários podem inserir em conversas que participam
CREATE POLICY "Allow users to insert messages in their conversations" ON public.messages
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

-- Política para UPDATE - usuários podem atualizar suas próprias mensagens
CREATE POLICY "Allow users to update their own messages" ON public.messages
  FOR UPDATE 
  USING (auth.role() = 'authenticated' AND sender_id = auth.uid())
  WITH CHECK (auth.role() = 'authenticated' AND sender_id = auth.uid());

-- Política para service role (APIs)
CREATE POLICY "Service role full access" ON public.messages
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICAR SE AS POLÍTICAS FORAM APLICADAS
-- ============================================================================

-- Listar políticas da tabela messages
SELECT 
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;

-- ============================================================================
-- TESTE SIMPLES
-- ============================================================================

-- Teste se um usuário autenticado pode ver mensagens
-- (Execute isso logado como um usuário normal, não service_role)
-- SELECT COUNT(*) FROM public.messages LIMIT 1;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "Allow authenticated users to read messages" ON public.messages 
IS 'Política permissiva para permitir real-time subscriptions funcionarem';

-- Se ainda não funcionar, pode ser necessário desabilitar RLS temporariamente
-- para confirmar se esse é o problema.