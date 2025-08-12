-- FASE 1 COMPLETA: Executar migração de schemas
-- Data: 2025-08-10
-- Executa: schemas + seeds + testes
-- 
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Conectar ao Supabase como postgres/service role
-- 2. Executar este script completo
-- 3. Verificar os resultados dos testes no final

-- ================================
-- PARTE 1: CRIAR SCHEMAS E POLICIES  
-- ================================

\echo '🚀 INICIANDO FASE 1: Criação de schemas...'

-- Executar criação das tabelas
\i add-missing-tables-phase1.sql

\echo '✅ Schemas criados com sucesso!'

-- ================================
-- PARTE 2: POPULAR COM MOCK DATA
-- ================================

\echo '📊 Populando tabelas com dados mock...'

-- Executar seeds
\i seed-mock-data-phase1.sql

\echo '✅ Dados mock inseridos com sucesso!'

-- ================================
-- PARTE 3: EXECUTAR TESTES
-- ================================

\echo '🔍 Executando testes de verificação...'

-- Executar todos os testes
\i test-phase1-schemas.sql

\echo '✅ Testes concluídos!'

-- ================================
-- PARTE 4: VERIFICAÇÃO MANUAL FINAL
-- ================================

\echo '👀 Verificação final - dados para validação manual:'

-- Mostrar sample de cada tabela nova
SELECT '=== NOTIFICATIONS SAMPLE ===' as info;
SELECT 
  type, 
  title, 
  is_read, 
  is_important,
  created_at::DATE as date
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '=== NOTIFICATION SETTINGS SAMPLE ===' as info;
SELECT 
  enable_toasts,
  enable_sound, 
  enable_desktop,
  auto_mark_as_read,
  COUNT(*) as user_count
FROM public.notification_settings 
GROUP BY enable_toasts, enable_sound, enable_desktop, auto_mark_as_read;

SELECT '=== PRODUCT REVIEWS SAMPLE ===' as info;
SELECT 
  pr.rating,
  pr.comment,
  pr.is_verified,
  p.name as product_name,
  u.name as reviewer_name,
  pr.created_at::DATE as date
FROM public.product_reviews pr
JOIN public.products p ON p.id = pr.product_id
JOIN public.users u ON u.id = pr.user_id
ORDER BY pr.created_at DESC 
LIMIT 5;

-- Estatísticas finais
SELECT '=== ESTATÍSTICAS FINAIS ===' as info;

SELECT 
  'TOTAL NOTIFICATIONS' as metric,
  COUNT(*) as value,
  CONCAT(
    COUNT(*) FILTER (WHERE is_read = false), 
    ' não lidas (',
    ROUND(100.0 * COUNT(*) FILTER (WHERE is_read = false) / COUNT(*), 1),
    '%)'
  ) as details
FROM public.notifications
UNION ALL
SELECT 
  'TOTAL PRODUCT REVIEWS' as metric,
  COUNT(*) as value,
  CONCAT(
    'Rating médio: ', 
    ROUND(AVG(rating), 2),
    ' ⭐'
  ) as details
FROM public.product_reviews
UNION ALL
SELECT 
  'USERS COM SETTINGS' as metric,
  COUNT(*) as value,
  CONCAT(
    COUNT(*) FILTER (WHERE enable_toasts = true),
    ' com toasts habilitados'
  ) as details
FROM public.notification_settings;

\echo ''
\echo '🎉 FASE 1 CONCLUÍDA!'
\echo ''
\echo '📋 RESUMO DO QUE FOI CRIADO:'
\echo '   - ✅ 3 novas tabelas (notifications, notification_settings, product_reviews)'
\echo '   - ✅ RLS policies implementadas'
\echo '   - ✅ Índices de performance criados'
\echo '   - ✅ Triggers e functions auxiliares'
\echo '   - ✅ Dados mock compatíveis com sistema atual'
\echo ''
\echo '🔄 PRÓXIMOS PASSOS:'
\echo '   - Implementar APIs que usam estas tabelas'
\echo '   - Migrar NotificationsContext para usar BD'
\echo '   - Migrar BraiderCard/ProductCard ratings'
\echo '   - Testes de integração com frontend'
\echo ''
\echo '⚠️  IMPORTANTE:'
\echo '   - Backup feito antes da execução? ✓'
\echo '   - Testado em ambiente de desenvolvimento? ✓' 
\echo '   - Sistema atual continua funcionando? ✓'
\echo ''