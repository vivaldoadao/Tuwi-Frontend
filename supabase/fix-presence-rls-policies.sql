-- ============================================================================
-- FIX RLS POLICIES FOR USER PRESENCE REAL-TIME SUBSCRIPTIONS
-- ============================================================================
-- As subscriptions real-time usam o token do usuário, precisamos de políticas
-- mais permissivas para permitir que funcionem corretamente

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view all user presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;

-- ============================================================================
-- POLÍTICAS MAIS PERMISSIVAS PARA REAL-TIME
-- ============================================================================

-- Política para SELECT - Permite que todos os usuários logados vejam presença de outros
CREATE POLICY "Authenticated users can view all presence" ON public.user_presence
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política para INSERT - Permite que usuários logados insiram sua própria presença
CREATE POLICY "Authenticated users can insert own presence" ON public.user_presence
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid()::text = user_id::text
  );

-- Política para UPDATE - Permite que usuários logados atualizem sua própria presença
CREATE POLICY "Authenticated users can update own presence" ON public.user_presence
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    auth.uid()::text = user_id::text
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid()::text = user_id::text
  );

-- Política para DELETE - Permite que usuários logados deletem sua própria presença
CREATE POLICY "Authenticated users can delete own presence" ON public.user_presence
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    auth.uid()::text = user_id::text
  );

-- ============================================================================
-- POLÍTICA ESPECIAL PARA SERVICE ROLE (APIs)
-- ============================================================================

-- Política para service role - permite todas as operações (para nossas APIs)
CREATE POLICY "Service role full access" ON public.user_presence
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICAR SE REAL-TIME ESTÁ HABILITADO
-- ============================================================================

-- Garantir que a tabela está na publicação real-time
-- (Se der erro, significa que já está adicionada)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table user_presence already in realtime publication';
  END;
END $$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view all presence" ON public.user_presence 
IS 'Permite usuários logados verem presença de outros (necessário para chat)';

COMMENT ON POLICY "Authenticated users can insert own presence" ON public.user_presence 
IS 'Permite usuários logados inserirem sua própria presença';

COMMENT ON POLICY "Authenticated users can update own presence" ON public.user_presence 
IS 'Permite usuários logados atualizarem sua própria presença';

COMMENT ON POLICY "Service role full access" ON public.user_presence 
IS 'Permite acesso completo via service role (para APIs)';