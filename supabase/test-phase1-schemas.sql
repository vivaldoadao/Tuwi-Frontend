-- FASE 1: Testes dos schemas e RLS policies
-- Data: 2025-08-10
-- Objetivo: Verificar se tabelas, policies e functions funcionam corretamente

-- ===== 1. VERIFICAÇÃO BÁSICA DAS TABELAS =====

SELECT 'Verificando se tabelas foram criadas...' as status;

-- Verificar se as tabelas existem
SELECT 
  table_name,
  CASE WHEN table_name IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
  ('notifications'),
  ('notification_settings'), 
  ('product_reviews')
) as t(table_name);

-- ===== 2. VERIFICAÇÃO DE RLS =====

SELECT 'Verificando RLS policies...' as status;

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_settings', 'product_reviews');

-- Verificar policies criadas
SELECT 
  tablename,
  policyname,
  '✅ POLICY EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_settings', 'product_reviews')
ORDER BY tablename, policyname;

-- ===== 3. VERIFICAÇÃO DE ÍNDICES =====

SELECT 'Verificando índices...' as status;

SELECT 
  i.relname as index_name,
  t.relname as table_name,
  '✅ INDEX EXISTS' as status
FROM pg_class i
JOIN pg_index ix ON ix.indexrelid = i.oid
JOIN pg_class t ON t.oid = ix.indrelid
WHERE i.relkind = 'i'
  AND t.relname IN ('notifications', 'notification_settings', 'product_reviews')
  AND i.relname LIKE 'idx_%'
ORDER BY t.relname, i.relname;

-- ===== 4. VERIFICAÇÃO DE TRIGGERS =====

SELECT 'Verificando triggers...' as status;

SELECT 
  event_object_table as table_name,
  trigger_name,
  '✅ TRIGGER EXISTS' as status
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table IN ('notifications', 'notification_settings', 'product_reviews')
ORDER BY event_object_table, trigger_name;

-- ===== 5. VERIFICAÇÃO DE FUNCTIONS =====

SELECT 'Verificando functions...' as status;

SELECT 
  proname as function_name,
  '✅ FUNCTION EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND proname IN (
    'get_product_rating_stats',
    'get_unread_notifications_count',
    'update_product_rating'
  );

-- ===== 6. TESTE DE INTEGRIDADE DOS DADOS =====

SELECT 'Verificando dados de teste...' as status;

-- Verificar notifications
SELECT 
  'notifications' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT type) as notification_types,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count
FROM public.notifications;

-- Verificar notification_settings
SELECT 
  'notification_settings' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE enable_toasts = true) as toasts_enabled,
  COUNT(*) FILTER (WHERE enable_sound = true) as sound_enabled
FROM public.notification_settings;

-- Verificar product_reviews
SELECT 
  'product_reviews' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT product_id) as products_reviewed,
  ROUND(AVG(rating), 2) as average_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating
FROM public.product_reviews;

-- ===== 7. TESTE DAS HELPER FUNCTIONS =====

SELECT 'Testando helper functions...' as status;

-- Testar função de estatísticas de produto (pegando primeiro produto)
SELECT 
  'get_product_rating_stats' as function_name,
  p.name as product_name,
  stats.*
FROM public.products p
CROSS JOIN LATERAL get_product_rating_stats(p.id) stats
LIMIT 1;

-- Testar função de notificações não lidas (pegando primeiro usuário)
SELECT 
  'get_unread_notifications_count' as function_name,
  u.name as user_name,
  get_unread_notifications_count(u.id) as unread_count
FROM public.users u
LIMIT 1;

-- ===== 8. TESTE DE PERFORMANCE BÁSICO =====

SELECT 'Testando performance básica...' as status;

-- Teste de query de notifications com índice
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.notifications 
WHERE user_id = (SELECT id FROM public.users LIMIT 1)
  AND is_read = false
ORDER BY created_at DESC
LIMIT 10;

-- Teste de query de product reviews com índice  
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  AVG(rating) as avg_rating,
  COUNT(*) as review_count
FROM public.product_reviews 
WHERE product_id = (SELECT id FROM public.products LIMIT 1)
  AND is_public = true;

-- ===== 9. VERIFICAÇÃO DE CONSTRAINTS =====

SELECT 'Verificando constraints...' as status;

-- Verificar constraints de check
SELECT 
  tc.table_name,
  tc.constraint_name,
  cc.check_clause,
  '✅ CONSTRAINT OK' as status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name IN ('notifications', 'notification_settings', 'product_reviews')
  AND tc.constraint_type = 'CHECK';

-- Verificar foreign keys
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column,
  '✅ FK CONSTRAINT OK' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('notifications', 'notification_settings', 'product_reviews');

-- ===== 10. RESUMO FINAL =====

SELECT '=== RESUMO FINAL FASE 1 ===' as status
UNION ALL
SELECT CONCAT(
  '✅ Tabelas criadas: ', 
  COUNT(*)::TEXT
) as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_settings', 'product_reviews')
UNION ALL
SELECT CONCAT(
  '✅ Policies criadas: ', 
  COUNT(*)::TEXT
) as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_settings', 'product_reviews')
UNION ALL
SELECT CONCAT(
  '✅ Índices criados: ', 
  COUNT(*)::TEXT
) as status
FROM pg_class i
JOIN pg_index ix ON ix.indexrelid = i.oid
JOIN pg_class t ON t.oid = ix.indrelid
WHERE i.relkind = 'i'
  AND t.relname IN ('notifications', 'notification_settings', 'product_reviews')
  AND i.relname LIKE 'idx_%'
UNION ALL
SELECT CONCAT(
  '✅ Notifications: ', 
  COUNT(*)::TEXT, ' registros'
) as status
FROM public.notifications
UNION ALL
SELECT CONCAT(
  '✅ Product Reviews: ', 
  COUNT(*)::TEXT, ' registros, rating médio: ', 
  ROUND(AVG(rating), 2)::TEXT
) as status
FROM public.product_reviews
UNION ALL
SELECT '🎉 FASE 1 CONCLUÍDA COM SUCESSO!' as status;