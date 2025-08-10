-- ============================================================================
-- SOLUÇÃO PARA REAL-TIME QUE PAROU DE FUNCIONAR
-- ============================================================================
-- Com base no problema relatado, vamos implementar uma solução definitiva

-- ============================================================================
-- OPÇÃO 1: POLÍTICAS MAIS PERMISSIVAS (TEMPORÁRIA PARA TESTE)
-- ============================================================================

-- Primeiro, vamos remover todas as políticas restritivas
DROP POLICY IF EXISTS "messages_realtime_controlled" ON public.messages;
DROP POLICY IF EXISTS "messages_select_secure" ON public.messages;
DROP POLICY IF EXISTS "typing_realtime_controlled" ON public.typing_indicators;
DROP POLICY IF EXISTS "typing_select_secure" ON public.typing_indicators;

-- Criar políticas permissivas para real-time funcionar
CREATE POLICY "messages_realtime_open" ON public.messages
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "typing_realtime_open" ON public.typing_indicators
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- GARANTIR QUE REAL-TIME ESTÁ HABILITADO
-- ============================================================================

-- Verificar se tabelas estão na publicação
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ============================================================================
-- TESTE IMEDIATO
-- ============================================================================

-- Execute este script e teste IMEDIATAMENTE se real-time voltou a funcionar
-- Se funcionar, sabemos que o problema são políticas muito restritivas

-- ============================================================================
-- INSTRUÇÕES APÓS TESTE
-- ============================================================================

/*
APÓS CONFIRMAR QUE FUNCIONA:

1. Se real-time funcionar com estas políticas, podemos implementar:
   - Filtragem no client-side para segurança adicional
   - Políticas levemente mais restritivas que ainda permitam real-time
   - Sistema de cache local para reduzir dados desnecessários

2. Se ainda não funcionar, o problema pode ser:
   - Configuração do Supabase real-time
   - Problemas na subscription do client
   - Configuração de rede/WebSocket

3. Próximos passos baseados no resultado:
   - FUNCIONA: Implementar segurança híbrida com filtros client-side
   - NÃO FUNCIONA: Investigar configuração de real-time ou usar polling
*/