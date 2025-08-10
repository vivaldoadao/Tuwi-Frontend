-- ============================================================================
-- CORREÇÃO EMERGENCIAL REAL-TIME
-- ============================================================================
-- Se as políticas balanceadas não funcionaram, vamos tentar a abordagem mais permissiva

-- ============================================================================
-- OPÇÃO 1: POLÍTICAS EXTREMAMENTE PERMISSIVAS (TEMPORÁRIO)
-- ============================================================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "messages_realtime_balanced" ON public.messages;
DROP POLICY IF EXISTS "typing_realtime_balanced" ON public.typing_indicators;

-- Criar políticas MUITO permissivas apenas para testar real-time
CREATE POLICY "messages_realtime_emergency" ON public.messages
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "typing_realtime_emergency" ON public.typing_indicators
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- GARANTIR PUBLICAÇÃO REAL-TIME
-- ============================================================================

-- Forçar adição das tabelas à publicação
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ============================================================================
-- VERIFICAR CONFIGURAÇÃO
-- ============================================================================

-- Verificar se tabelas estão na publicação
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'typing_indicators', 'conversations')
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'typing_indicators')
  AND policyname LIKE '%emergency%'
ORDER BY tablename, policyname;

-- ============================================================================
-- INSTRUÇÕES CRÍTICAS
-- ============================================================================

/*
APÓS EXECUTAR ESTE SQL:

1. TESTE IMEDIATAMENTE se real-time funciona
2. Envie uma mensagem no chat
3. Observe os logs do console

SE FUNCIONAR:
- Real-time está funcionando!
- Problema confirmado: políticas muito restritivas
- Implemente filtragem no client-side para segurança
- Substitua por políticas menos permissivas gradualmente

SE NÃO FUNCIONAR:
- O problema NÃO são as políticas RLS
- Problema pode ser: configuração Supabase, WebSocket, rede
- Prosseguir com implementação de polling como fallback

IMPORTANTE:
- Estas políticas são MUITO permissivas
- Use apenas para teste
- Implemente segurança adicional no client-side
- Monitore acesso cuidadosamente
*/