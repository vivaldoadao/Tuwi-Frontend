-- ============================================================================
-- CORREÇÃO EMERGENCIAL REAL-TIME (SINTAXE CORRIGIDA)
-- ============================================================================

-- ============================================================================
-- PASSO 1: LIMPAR POLÍTICAS EXISTENTES
-- ============================================================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "messages_realtime_balanced" ON public.messages;
DROP POLICY IF EXISTS "messages_realtime_emergency" ON public.messages;
DROP POLICY IF EXISTS "typing_realtime_balanced" ON public.typing_indicators;
DROP POLICY IF EXISTS "typing_realtime_emergency" ON public.typing_indicators;

-- ============================================================================
-- PASSO 2: CRIAR POLÍTICAS ULTRA-PERMISSIVAS PARA TESTE
-- ============================================================================

-- Criar políticas MUITO permissivas apenas para testar real-time
CREATE POLICY "messages_realtime_emergency" ON public.messages
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "typing_realtime_emergency" ON public.typing_indicators
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- PASSO 3: GARANTIR PUBLICAÇÃO REAL-TIME (SINTAXE CORRETA)
-- ============================================================================

-- Adicionar tabelas à publicação real-time (ignora se já existir)
DO $$ 
BEGIN
  -- Adicionar messages
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    RAISE NOTICE 'Tabela messages adicionada à publicação real-time';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Tabela messages já existe na publicação real-time';
  END;
  
  -- Adicionar typing_indicators
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
    RAISE NOTICE 'Tabela typing_indicators adicionada à publicação real-time';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Tabela typing_indicators já existe na publicação real-time';
  END;
  
  -- Adicionar conversations
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    RAISE NOTICE 'Tabela conversations adicionada à publicação real-time';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Tabela conversations já existe na publicação real-time';
  END;
END $$;

-- ============================================================================
-- PASSO 4: VERIFICAR CONFIGURAÇÃO
-- ============================================================================

-- Verificar se tabelas estão na publicação
SELECT 
  'PUBLICAÇÃO REAL-TIME:' as status,
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'typing_indicators', 'conversations')
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
  'POLÍTICAS EMERGENCIAIS:' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'typing_indicators')
  AND policyname LIKE '%emergency%'
ORDER BY tablename, policyname;

-- Verificar se há outras políticas que possam interferir
SELECT 
  'OUTRAS POLÍTICAS:' as status,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'typing_indicators')
  AND policyname NOT LIKE '%emergency%'
ORDER BY tablename, policyname;

-- ============================================================================
-- COMENTÁRIOS E STATUS FINAL
-- ============================================================================

COMMENT ON POLICY "messages_realtime_emergency" ON public.messages 
IS 'EMERGENCIAL: Política ultra-permissiva para testar real-time';

COMMENT ON POLICY "typing_realtime_emergency" ON public.typing_indicators 
IS 'EMERGENCIAL: Política ultra-permissiva para testar real-time';

-- Mostrar resumo final
SELECT 
  'RESUMO:' as info,
  'Políticas ultra-permissivas criadas. TESTE REAL-TIME AGORA!' as message;