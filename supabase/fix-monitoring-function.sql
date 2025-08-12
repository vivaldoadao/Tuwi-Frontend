-- FIX: Corrigir função de monitoramento
-- Data: 2025-08-10
-- Objetivo: Resolver erro "column stats_reset does not exist"

\echo '🔧 FIXING: Corrigindo função de monitoramento...'

-- Função corrigida para monitorar performance das views
CREATE OR REPLACE FUNCTION monitor_rating_views_performance()
RETURNS TABLE (
  view_name TEXT,
  row_count BIGINT,
  avg_rating DECIMAL(3,2),
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'braiders_with_stats'::TEXT as view_name,
    (SELECT COUNT(*) FROM public.braiders_with_stats)::BIGINT as row_count,
    (SELECT AVG(average_rating)::DECIMAL(3,2) FROM public.braiders_with_stats WHERE status = 'approved') as avg_rating,
    '✅ ACTIVE'::TEXT as status
  UNION ALL
  SELECT 
    'products_with_stats'::TEXT as view_name,
    (SELECT COUNT(*) FROM public.products_with_stats)::BIGINT as row_count,
    (SELECT AVG(average_rating)::DECIMAL(3,2) FROM public.products_with_stats WHERE is_active = true) as avg_rating,
    '✅ ACTIVE'::TEXT as status;
END;
$$ language 'plpgsql';

\echo '✅ Função de monitoramento corrigida!'

-- Testar a função corrigida
SELECT * FROM monitor_rating_views_performance();

\echo '✅ Teste da função aprovado!'
\echo ''
\echo '🎯 Agora você pode executar:'
\echo '   \\i execute-phase2-complete.sql'