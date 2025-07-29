-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO DA MIGRAÇÃO
-- ============================================================================
-- Execute este script após a migração para validar que tudo foi migrado corretamente
-- ============================================================================

-- ============================================================================
-- VERIFICAÇÃO DA MIGRAÇÃO DE DADOS MOCK PARA SUPABASE
-- ============================================================================
-- Este script verifica se todos os dados foram migrados corretamente
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR CONTAGENS GERAIS
-- ============================================================================

SELECT '📊 CONTAGENS GERAIS' as secao, '' as info, '' as detalhes;

SELECT 'Verificação' as tipo, 'Tabela' as nome, 'Total' as contagem, 'Status' as resultado;

SELECT 
    'users' as tabela, 
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) >= 11 THEN '✅'
        ELSE '❌'
    END as status
FROM public.users

UNION ALL

SELECT 
    'braiders', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 7 THEN '✅'
        ELSE '❌'
    END
FROM public.braiders

UNION ALL

SELECT 
    'products', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅'
        ELSE '❌'
    END
FROM public.products

UNION ALL

SELECT 
    'services', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 13 THEN '✅'
        ELSE '❌'
    END
FROM public.services

UNION ALL

SELECT 
    'bookings', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅'
        ELSE '❌'
    END
FROM public.bookings

UNION ALL

SELECT 
    'availability', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 1000 THEN '✅'
        ELSE '❌'
    END
FROM public.braider_availability

UNION ALL

SELECT 
    'conversations', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅'
        ELSE '❌'
    END
FROM public.conversations

UNION ALL

SELECT 
    'messages', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 12 THEN '✅'
        ELSE '❌'
    END
FROM public.messages;

-- ============================================================================
-- 2. VERIFICAR INTEGRIDADE DE ROLES
-- ============================================================================

SELECT '👥 DISTRIBUIÇÃO DE ROLES' as secao;

SELECT 
    role,
    COUNT(*) as quantidade,
    CASE 
        WHEN role = 'admin' AND COUNT(*) >= 1 THEN '✅'
        WHEN role = 'braider' AND COUNT(*) >= 7 THEN '✅'
        WHEN role = 'customer' AND COUNT(*) >= 3 THEN '✅'
        ELSE '⚠️'
    END as status
FROM public.users
GROUP BY role
ORDER BY role;

-- ============================================================================
-- 3. VERIFICAR STATUS DOS TRANCISTAS
-- ============================================================================

\echo ''
\echo '💇‍♀️ 3. STATUS DOS TRANCISTAS:'
\echo '------------------------------'

SELECT 
    status,
    COUNT(*) as quantidade,
    CASE 
        WHEN status = 'approved' AND COUNT(*) >= 6 THEN '✅'
        WHEN status = 'pending' AND COUNT(*) >= 1 THEN '✅'
        ELSE '⚠️'
    END as verificacao
FROM public.braiders
GROUP BY status
ORDER BY status;

-- ============================================================================
-- 4. VERIFICAR RELACIONAMENTOS
-- ============================================================================

\echo ''
\echo '🔗 4. INTEGRIDADE DOS RELACIONAMENTOS:'
\echo '--------------------------------------'

-- Braiders sem usuário
SELECT 
    'Braiders órfãos' as verificacao,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id
WHERE u.id IS NULL

UNION ALL

-- Serviços sem braider
SELECT 
    'Serviços órfãos',
    COUNT(*),
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.services s
LEFT JOIN public.braiders b ON s.braider_id = b.id
WHERE b.id IS NULL

UNION ALL

-- Bookings sem cliente
SELECT 
    'Bookings sem cliente',
    COUNT(*),
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.bookings bk
LEFT JOIN public.users u ON bk.client_id = u.id
WHERE u.id IS NULL;

-- ============================================================================
-- 5. VERIFICAR DADOS DOS PRODUTOS
-- ============================================================================

\echo ''
\echo '📦 5. PRODUTOS MIGRADOS:'
\echo '------------------------'

SELECT 
    name,
    CONCAT('€', price::text) as preco,
    category,
    stock_quantity as estoque,
    CASE 
        WHEN price > 0 AND stock_quantity >= 0 THEN '✅'
        ELSE '❌'
    END as valido
FROM public.products
ORDER BY price;

-- ============================================================================
-- 6. VERIFICAR TRANCISTAS E SEUS SERVIÇOS
-- ============================================================================

\echo ''
\echo '💼 6. TRANCISTAS E SERVIÇOS:'
\echo '----------------------------'

SELECT 
    u.name as trancista,
    COUNT(s.id) as servicos,
    CONCAT('€', MIN(s.price)::text, ' - €', MAX(s.price)::text) as faixa_preco,
    b.status,
    CASE 
        WHEN COUNT(s.id) >= 1 AND b.status = 'approved' THEN '✅'
        WHEN COUNT(s.id) = 0 AND b.status = 'pending' THEN '✅'
        ELSE '⚠️'
    END as verificacao
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.services s ON b.id = s.braider_id
GROUP BY u.name, b.status
ORDER BY COUNT(s.id) DESC;

-- ============================================================================
-- 7. VERIFICAR AGENDAMENTOS
-- ============================================================================

\echo ''
\echo '📅 7. AGENDAMENTOS:'
\echo '-------------------'

SELECT 
    b.booking_date as data_agendamento,
    b.booking_time as horario,
    u_braider.name as trancista,
    u_client.name as cliente,
    s.name as servico,
    CONCAT('€', b.total_amount::text) as valor,
    b.status,
    CASE 
        WHEN b.booking_date > CURRENT_DATE THEN '✅ Futuro'
        ELSE '⚠️ Passado'
    END as validade
FROM public.bookings b
JOIN public.users u_client ON b.client_id = u_client.id
JOIN public.braiders br ON b.braider_id = br.id
JOIN public.users u_braider ON br.user_id = u_braider.id
JOIN public.services s ON b.service_id = s.id
ORDER BY b.booking_date, b.booking_time;

-- ============================================================================
-- 8. VERIFICAR DISPONIBILIDADES
-- ============================================================================

\echo ''
\echo '⏰ 8. DISPONIBILIDADES (AMOSTRA):'
\echo '---------------------------------'

SELECT 
    u.name as trancista,
    COUNT(ba.id) as slots_disponiveis,
    MIN(ba.available_date) as primeira_data,
    MAX(ba.available_date) as ultima_data,
    CASE 
        WHEN COUNT(ba.id) >= 100 THEN '✅'
        ELSE '⚠️'
    END as suficiente
FROM public.braider_availability ba
JOIN public.braiders b ON ba.braider_id = b.id
JOIN public.users u ON b.user_id = u.id
WHERE ba.is_booked = FALSE
GROUP BY u.name
ORDER BY COUNT(ba.id) DESC;

-- ============================================================================
-- 9. VERIFICAR CONSTRAINTS E VALIDAÇÕES
-- ============================================================================

\echo ''
\echo '🔒 9. VALIDAÇÕES DE NEGÓCIO:'
\echo '----------------------------'

-- Preços válidos
SELECT 
    'Preços válidos' as validacao,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE price > 0) as validos,
    CASE 
        WHEN COUNT(*) = COUNT(*) FILTER (WHERE price > 0) THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM (
    SELECT price FROM public.products
    UNION ALL
    SELECT price FROM public.services
) precos

UNION ALL

-- Emails únicos
SELECT 
    'Emails únicos',
    COUNT(*) as total,
    COUNT(DISTINCT email) as unicos,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT email) THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.users;

-- ============================================================================
-- 10. VERIFICAR SISTEMA DE MENSAGENS
-- ============================================================================

\echo ''
\echo '💬 10. SISTEMA DE MENSAGENS:'
\echo '----------------------------'

-- Conversas por usuário
SELECT 
    u.name as usuario,
    u.role,
    COUNT(DISTINCT CASE WHEN c.participant_1_id = u.id THEN c.id WHEN c.participant_2_id = u.id THEN c.id END) as conversas,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN c.participant_1_id = u.id THEN c.id WHEN c.participant_2_id = u.id THEN c.id END) >= 1 THEN '✅'
        ELSE '⚠️'
    END as status
FROM public.users u
LEFT JOIN public.conversations c ON u.id = c.participant_1_id OR u.id = c.participant_2_id
WHERE u.role IN ('braider', 'customer')
GROUP BY u.name, u.role
ORDER BY COUNT(DISTINCT CASE WHEN c.participant_1_id = u.id THEN c.id WHEN c.participant_2_id = u.id THEN c.id END) DESC;

\echo ''
\echo '📊 Detalhes das Conversas:'
\echo '-------------------------'

SELECT 
    c.id as conversa_id,
    u1.name as participante_1,
    u1.role as role_1,
    u2.name as participante_2,
    u2.role as role_2,
    COUNT(m.id) as total_mensagens,
    COUNT(m.id) FILTER (WHERE m.is_read = FALSE) as nao_lidas,
    c.status as status_conversa
FROM public.conversations c
JOIN public.users u1 ON c.participant_1_id = u1.id
JOIN public.users u2 ON c.participant_2_id = u2.id
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY c.id, u1.name, u1.role, u2.name, u2.role, c.status
ORDER BY COUNT(m.id) DESC;

-- ============================================================================
-- 11. VERIFICAR ÍNDICES CRIADOS
-- ============================================================================

\echo ''
\echo '📈 11. ÍNDICES CRIADOS:'
\echo '----------------------'

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 11. RESUMO FINAL
-- ============================================================================

\echo ''
\echo '📋 11. RESUMO FINAL:'
\echo '-------------------'

DO $$
DECLARE
    user_count INTEGER;
    braider_count INTEGER;
    product_count INTEGER;
    service_count INTEGER;
    booking_count INTEGER;
    availability_count INTEGER;
    orphaned_services INTEGER;
    orphaned_bookings INTEGER;
    status_text TEXT;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO braider_count FROM public.braiders;
    SELECT COUNT(*) INTO product_count FROM public.products;
    SELECT COUNT(*) INTO service_count FROM public.services;
    SELECT COUNT(*) INTO booking_count FROM public.bookings;
    SELECT COUNT(*) INTO availability_count FROM public.braider_availability;
    
    -- Verificar integridade
    SELECT COUNT(*) INTO orphaned_services FROM public.services s LEFT JOIN public.braiders b ON s.braider_id = b.id WHERE b.id IS NULL;
    SELECT COUNT(*) INTO orphaned_bookings FROM public.bookings bk LEFT JOIN public.users u ON bk.client_id = u.id WHERE u.id IS NULL;
    
    -- Determinar status geral
    IF user_count >= 11 AND braider_count >= 7 AND product_count >= 6 AND 
       service_count >= 13 AND orphaned_services = 0 AND orphaned_bookings = 0 THEN
        status_text := '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    ELSE
        status_text := '⚠️ MIGRAÇÃO PARCIAL - VERIFICAR PROBLEMAS ACIMA';
    END IF;
    
    RAISE NOTICE '%', status_text;
    RAISE NOTICE 'Usuários: % | Trancistas: % | Produtos: %', user_count, braider_count, product_count;
    RAISE NOTICE 'Serviços: % | Agendamentos: % | Disponibilidades: %', service_count, booking_count, availability_count;
    
    IF orphaned_services > 0 OR orphaned_bookings > 0 THEN
        RAISE NOTICE '❌ ATENÇÃO: Dados órfãos encontrados!';
    ELSE
        RAISE NOTICE '✅ Integridade referencial OK';
    END IF;
END $$;

-- ============================================================================
-- COMANDOS DE LIMPEZA (se necessário)
-- ============================================================================

\echo ''
\echo '🧹 COMANDOS DE LIMPEZA (apenas se necessário):'
\echo '----------------------------------------------'
\echo '-- Para limpar todos os dados:'
\echo '-- TRUNCATE public.bookings CASCADE;'
\echo '-- TRUNCATE public.braider_availability CASCADE;'
\echo '-- TRUNCATE public.services CASCADE;'
\echo '-- TRUNCATE public.braiders CASCADE;'
\echo '-- TRUNCATE public.products CASCADE;'
\echo '-- TRUNCATE public.users CASCADE;'

\echo ''
\echo '✅ VERIFICAÇÃO CONCLUÍDA!'
\echo '========================='