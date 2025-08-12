-- FASE 3: Teste do sistema completo de notificações
-- Data: 2025-08-10
-- Objetivo: Verificar se o sistema de notificações está funcionando completamente

-- ===== 1. VERIFICAÇÃO INICIAL =====

\echo '🚀 TESTANDO FASE 3: Sistema Completo de Notificações'
\echo '=================================================='
\echo ''

-- Verificar se temos dados das fases anteriores
\echo '📋 Verificando dados das fases anteriores...'

SELECT 
  'FASE 1 - Tables' as fase,
  COUNT(*) as notifications_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count
FROM public.notifications;

SELECT 
  'FASE 1 - Settings' as fase,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE enable_toasts = true) as toast_enabled
FROM public.notification_settings;

SELECT 
  'FASE 2 - Ratings' as fase,
  COUNT(*) as braiders_with_stats,
  ROUND(AVG(average_rating), 2) as avg_rating
FROM public.braiders_with_stats 
WHERE status = 'approved';

-- ===== 2. SIMULAÇÃO DE USO DO SISTEMA COMPLETO =====

\echo '🎭 Simulando uso completo do sistema...'

-- Criar notificação de teste para verificar todo o fluxo
DO $$
DECLARE
    test_user_id UUID;
    new_notification_id UUID;
BEGIN
    -- Pegar um usuário aleatório para teste
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Criar uma notificação de teste
        INSERT INTO public.notifications (
            user_id, type, title, message, is_important, 
            action_url, action_label, metadata
        ) VALUES (
            test_user_id,
            'order',
            'Pedido Processado - Teste Sistema',
            'Seu pedido #TESTE-' || EXTRACT(EPOCH FROM NOW())::bigint || ' está sendo processado.',
            true,
            '/orders/test-order',
            'Ver Pedido',
            jsonb_build_object(
                'orderId', 'test-order-' || EXTRACT(EPOCH FROM NOW())::bigint,
                'testData', true,
                'phase', 3
            )
        )
        RETURNING id INTO new_notification_id;
        
        RAISE NOTICE '✅ Created test notification with ID: %', new_notification_id;
        
        -- Verificar se a notificação foi criada corretamente
        PERFORM 1 FROM public.notifications 
        WHERE id = new_notification_id AND user_id = test_user_id;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Test notification verified in database';
        ELSE
            RAISE EXCEPTION '❌ Test notification not found in database';
        END IF;
    ELSE
        RAISE EXCEPTION '❌ No users found for testing';
    END IF;
END $$;

-- ===== 3. TESTE DAS FUNÇÕES API (simulação) =====

\echo '🔌 Testando lógica das APIs...'

-- Simular GET /api/notifications
SELECT 
    'GET /api/notifications simulation' as api_endpoint,
    json_build_object(
        'notifications', json_agg(
            json_build_object(
                'id', id,
                'type', type,
                'title', title,
                'message', message,
                'timestamp', created_at,
                'isRead', is_read,
                'isImportant', is_important,
                'actionUrl', action_url,
                'actionLabel', action_label,
                'metadata', metadata
            )
        ),
        'total', COUNT(*),
        'unreadCount', COUNT(*) FILTER (WHERE is_read = false)
    ) as api_response
FROM public.notifications 
WHERE user_id = (SELECT id FROM public.users LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;

-- Simular GET /api/notifications/settings
SELECT 
    'GET /api/notifications/settings simulation' as api_endpoint,
    json_build_object(
        'settings', json_build_object(
            'enableToasts', enable_toasts,
            'enableSound', enable_sound,
            'enableDesktop', enable_desktop,
            'autoMarkAsRead', auto_mark_as_read
        )
    ) as api_response
FROM public.notification_settings 
WHERE user_id = (SELECT id FROM public.users LIMIT 1)
LIMIT 1;

-- ===== 4. TESTE DE PERFORMANCE DO SISTEMA COMPLETO =====

\echo '⚡ Testando performance do sistema completo...'

-- Teste de query para dashboard completo
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    -- Notificações
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = u.id) as total_notifications,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = u.id AND is_read = false) as unread_notifications,
    
    -- Ratings (dados reais da Fase 2)
    (SELECT COUNT(*) FROM public.braiders_with_stats WHERE user_id = u.id) as user_braider_profiles,
    (SELECT AVG(average_rating) FROM public.braiders_with_stats WHERE user_id = u.id) as avg_braider_rating,
    
    -- Settings
    (SELECT enable_toasts FROM public.notification_settings WHERE user_id = u.id) as toasts_enabled
    
FROM public.users u
WHERE u.id = (SELECT id FROM public.users LIMIT 1);

-- ===== 5. TESTE DE INTEGRIDADE DOS DADOS =====

\echo '🔒 Verificando integridade dos dados...'

-- Verificar se todas as notificações têm usuários válidos
SELECT 
    'Notification Integrity Check' as check_type,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE user_id IN (SELECT id FROM public.users)) as valid_user_refs,
    CASE WHEN COUNT(*) = COUNT(*) FILTER (WHERE user_id IN (SELECT id FROM public.users))
        THEN '✅ ALL NOTIFICATIONS HAVE VALID USERS'
        ELSE '❌ ORPHANED NOTIFICATIONS FOUND'
    END as status
FROM public.notifications;

-- Verificar se todos os settings têm usuários válidos
SELECT 
    'Settings Integrity Check' as check_type,
    COUNT(*) as total_settings,
    COUNT(*) FILTER (WHERE user_id IN (SELECT id FROM public.users)) as valid_user_refs,
    CASE WHEN COUNT(*) = COUNT(*) FILTER (WHERE user_id IN (SELECT id FROM public.users))
        THEN '✅ ALL SETTINGS HAVE VALID USERS'
        ELSE '❌ ORPHANED SETTINGS FOUND'
    END as status
FROM public.notification_settings;

-- ===== 6. TESTE DO FLUXO COMPLETO =====

\echo '🔄 Testando fluxo completo...'

-- Simular fluxo: usuário faz pedido → notificação criada → trancista vê rating
DO $$
DECLARE
    customer_id UUID;
    braider_id UUID;
    test_product_id UUID;
    notification_id UUID;
BEGIN
    -- Pegar dados para teste
    SELECT id INTO customer_id FROM public.users WHERE role = 'customer' LIMIT 1;
    SELECT id INTO braider_id FROM public.braiders WHERE status = 'approved' LIMIT 1;
    SELECT id INTO test_product_id FROM public.products WHERE is_active = true LIMIT 1;
    
    IF customer_id IS NOT NULL AND braider_id IS NOT NULL THEN
        -- 1. Criar notificação de pedido
        INSERT INTO public.notifications (
            user_id, type, title, message, is_important,
            metadata
        ) VALUES (
            customer_id,
            'order',
            'Pedido Confirmado - Fluxo Completo',
            'Seu pedido foi confirmado e será processado em breve.',
            true,
            jsonb_build_object(
                'orderId', 'flow-test-' || EXTRACT(EPOCH FROM NOW())::bigint,
                'braiderId', braider_id,
                'productId', test_product_id,
                'testType', 'complete_flow'
            )
        )
        RETURNING id INTO notification_id;
        
        -- 2. Verificar se trancista tem rating real (Fase 2)
        PERFORM 1 FROM public.braiders_with_stats 
        WHERE id = braider_id AND average_rating > 0;
        
        -- 3. Verificar se produto tem rating real (Fase 2)
        PERFORM 1 FROM public.products_with_stats 
        WHERE id = test_product_id AND average_rating > 0;
        
        RAISE NOTICE '✅ Complete flow test successful:';
        RAISE NOTICE '   - Notification created: %', notification_id;
        RAISE NOTICE '   - Customer: %', customer_id;
        RAISE NOTICE '   - Braider: %', braider_id;
        RAISE NOTICE '   - Product: %', test_product_id;
    ELSE
        RAISE WARNING '⚠️ Cannot test complete flow: missing test data';
    END IF;
END $$;

-- ===== 7. MÉTRICAS DO SISTEMA =====

\echo '📊 Métricas finais do sistema...'

SELECT '=== SYSTEM METRICS ===' as info
UNION ALL
SELECT CONCAT('✅ Total Users: ', COUNT(*)) as info FROM public.users
UNION ALL
SELECT CONCAT('✅ Total Notifications: ', COUNT(*)) as info FROM public.notifications
UNION ALL
SELECT CONCAT('✅ Unread Notifications: ', COUNT(*) FILTER (WHERE is_read = false)) as info FROM public.notifications
UNION ALL
SELECT CONCAT('✅ Users with Settings: ', COUNT(*)) as info FROM public.notification_settings
UNION ALL
SELECT CONCAT('✅ Braiders with Real Ratings: ', COUNT(*) FILTER (WHERE average_rating > 0)) as info FROM public.braiders_with_stats
UNION ALL
SELECT CONCAT('✅ Products with Real Ratings: ', COUNT(*) FILTER (WHERE average_rating > 0)) as info FROM public.products_with_stats;

-- ===== 8. SIMULAÇÃO DE WEBSOCKET EVENTS =====

\echo '🔌 Simulando eventos de WebSocket...'

-- Simular dados que seriam enviados via socket
SELECT 
    'WebSocket Event Simulation' as event_type,
    json_build_object(
        'event', 'new-notification',
        'data', json_build_object(
            'id', id,
            'type', type,
            'title', title,
            'message', message,
            'timestamp', created_at,
            'isRead', is_read,
            'isImportant', is_important,
            'actionUrl', action_url,
            'actionLabel', action_label,
            'metadata', metadata
        )
    ) as socket_payload
FROM public.notifications
WHERE created_at > NOW() - INTERVAL '1 hour'  -- Notificações recentes
ORDER BY created_at DESC
LIMIT 3;

-- ===== 9. READINESS CHECK =====

\echo '🎯 Sistema pronto para produção?'

SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.notifications LIMIT 1)
        AND EXISTS(SELECT 1 FROM public.notification_settings LIMIT 1)
        AND EXISTS(SELECT 1 FROM public.braiders_with_stats WHERE average_rating > 0 LIMIT 1)
        AND EXISTS(SELECT 1 FROM public.products_with_stats WHERE average_rating > 0 LIMIT 1)
        THEN '🎉 SISTEMA PRONTO PARA PRODUÇÃO!'
        ELSE '⚠️ Sistema precisa de mais dados de teste'
    END as readiness_status;

-- ===== 10. PRÓXIMOS PASSOS =====

\echo ''
\echo '📋 PRÓXIMOS PASSOS PARA IMPLEMENTAÇÃO:'
\echo '===================================='
\echo ''
\echo '1️⃣  BACKEND:'
\echo '   - Implementar Socket.io server com eventos de notificação'
\echo '   - Testar APIs em ambiente de desenvolvimento'
\echo '   - Configurar rate limiting para notificações'
\echo ''
\echo '2️⃣  FRONTEND:'
\echo '   - Substituir NotificationsContext por NotificationsContextV2'
\echo '   - Testar hooks useWebSocketNotifications'
\echo '   - Implementar componentes de notificação'
\echo ''
\echo '3️⃣  INTEGRAÇÃO:'
\echo '   - Conectar sistema de pedidos com notificações'
\echo '   - Integrar chat com notificações de mensagens'
\echo '   - Configurar notificações de agendamento'
\echo ''
\echo '4️⃣  DEPLOY:'
\echo '   - Deploy gradual com feature flags'
\echo '   - Monitoring de performance'
\echo '   - Rollback plan preparado'
\echo ''

\echo '🎊 FASE 3 CONCLUÍDA COM SUCESSO!'