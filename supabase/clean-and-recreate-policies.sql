-- ============================================================================
-- LIMPEZA COMPLETA E RECRIAÇÃO DAS POLÍTICAS RLS
-- ============================================================================

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Service role full access messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow users to update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Service role full access" ON public.messages;

-- 2. VERIFICAR SE TODAS FORAM REMOVIDAS
SELECT COUNT(*) as remaining_policies FROM pg_policy WHERE polrelid = 'messages'::regclass;

-- 3. RECRIAR POLÍTICAS LIMPAS
CREATE POLICY "realtime_select_policy" ON public.messages
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "realtime_insert_policy" ON public.messages
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid()
  );

CREATE POLICY "realtime_update_policy" ON public.messages
  FOR UPDATE 
  USING (auth.role() = 'authenticated' AND sender_id = auth.uid())
  WITH CHECK (auth.role() = 'authenticated' AND sender_id = auth.uid());

CREATE POLICY "service_role_policy" ON public.messages
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. VERIFICAR POLÍTICAS CRIADAS
SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'messages'::regclass;