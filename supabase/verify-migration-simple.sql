-- ============================================================================
-- VERIFICAÇÃO SIMPLES DA MIGRAÇÃO - COMPATÍVEL COM SUPABASE DASHBOARD
-- ============================================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- 1. CONTAGENS GERAIS
SELECT 
    'CONTAGENS GERAIS' as verificacao,
    '' as tabela, 
    0 as total,
    '' as status
WHERE FALSE

UNION ALL

SELECT 
    'Contagem',
    'users' as tabela, 
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) >= 11 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM public.users

UNION ALL

SELECT 
    'Contagem',
    'braiders', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 7 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.braiders

UNION ALL

SELECT 
    'Contagem',
    'products', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.products

UNION ALL

SELECT 
    'Contagem',
    'services', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 13 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.services

UNION ALL

SELECT 
    'Contagem',
    'bookings', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.bookings

UNION ALL

SELECT 
    'Contagem',
    'availability', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 1000 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.braider_availability

UNION ALL

SELECT 
    'Contagem',
    'conversations', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.conversations

UNION ALL

SELECT 
    'Contagem',
    'messages', 
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 12 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.messages

ORDER BY tabela;

-- ============================================================================

-- 2. VERIFICAR ROLES
SELECT 
    'ROLES' as verificacao,
    role as tabela,
    COUNT(*) as total,
    CASE 
        WHEN role = 'admin' AND COUNT(*) >= 1 THEN '✅ OK'
        WHEN role = 'braider' AND COUNT(*) >= 7 THEN '✅ OK'
        WHEN role = 'customer' AND COUNT(*) >= 3 THEN '✅ OK'
        ELSE '⚠️ VERIFICAR'
    END as status
FROM public.users
GROUP BY role
ORDER BY role;

-- ============================================================================

-- 3. VERIFICAR STATUS DOS TRANCISTAS
SELECT 
    'STATUS BRAIDERS' as verificacao,
    status as tabela,
    COUNT(*) as total,
    CASE 
        WHEN status = 'approved' AND COUNT(*) >= 6 THEN '✅ OK'
        WHEN status = 'pending' AND COUNT(*) >= 1 THEN '✅ OK'
        ELSE '⚠️ VERIFICAR'
    END as status_verificacao
FROM public.braiders
GROUP BY status
ORDER BY status;

-- ============================================================================

-- 4. VERIFICAR INTEGRIDADE REFERENCIAL
SELECT 
    'INTEGRIDADE' as verificacao,
    'Braiders órfãos' as tabela,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDADE',
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

SELECT 
    'INTEGRIDADE',
    'Bookings órfãos',
    COUNT(*),
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.bookings bk
LEFT JOIN public.users u ON bk.client_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDADE',
    'Mensagens órfãs',
    COUNT(*),
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END
FROM public.messages m
LEFT JOIN public.conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;

-- ============================================================================

-- 5. VERIFICAR PRODUTOS
SELECT 
    'PRODUTOS' as verificacao,
    name as tabela,
    CONCAT('€', price::text) as total,
    CASE 
        WHEN price > 0 AND stock_quantity >= 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM public.products
ORDER BY price;

-- ============================================================================

-- 6. VERIFICAR TRANCISTAS E SERVIÇOS
SELECT 
    'BRAIDERS' as verificacao,
    u.name as tabela,
    COUNT(s.id) as total,
    CASE 
        WHEN COUNT(s.id) >= 1 AND b.status = 'approved' THEN '✅ OK'
        WHEN COUNT(s.id) = 0 AND b.status = 'pending' THEN '✅ OK'
        ELSE '⚠️ VERIFICAR'
    END as status
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.services s ON b.id = s.braider_id
GROUP BY u.name, b.status
ORDER BY COUNT(s.id) DESC;

-- ============================================================================

-- 7. VERIFICAR CONVERSAS E MENSAGENS
SELECT 
    'CONVERSAS' as verificacao,
    CONCAT(u1.name, ' ↔ ', u2.name) as tabela,
    COUNT(m.id) as total,
    CASE 
        WHEN COUNT(m.id) >= 3 THEN '✅ OK'
        ELSE '⚠️ POUCAS MENSAGENS'
    END as status
FROM public.conversations c
JOIN public.users u1 ON c.participant_1_id = u1.id
JOIN public.users u2 ON c.participant_2_id = u2.id
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY u1.name, u2.name, c.id
ORDER BY COUNT(m.id) DESC;

-- ============================================================================

-- 8. RESUMO FINAL
SELECT 
    'RESUMO FINAL' as verificacao,
    'Status Geral' as tabela,
    (
        SELECT COUNT(*) FROM (
            SELECT CASE WHEN COUNT(*) >= 11 THEN 1 ELSE 0 END FROM public.users
            UNION ALL
            SELECT CASE WHEN COUNT(*) >= 7 THEN 1 ELSE 0 END FROM public.braiders
            UNION ALL
            SELECT CASE WHEN COUNT(*) >= 6 THEN 1 ELSE 0 END FROM public.products
            UNION ALL
            SELECT CASE WHEN COUNT(*) >= 13 THEN 1 ELSE 0 END FROM public.services
            UNION ALL
            SELECT CASE WHEN COUNT(*) >= 3 THEN 1 ELSE 0 END FROM public.conversations
            UNION ALL
            SELECT CASE WHEN COUNT(*) >= 12 THEN 1 ELSE 0 END FROM public.messages
        ) checks
        WHERE checks.case = 1
    ) as total,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM (
                SELECT CASE WHEN COUNT(*) >= 11 THEN 1 ELSE 0 END FROM public.users
                UNION ALL
                SELECT CASE WHEN COUNT(*) >= 7 THEN 1 ELSE 0 END FROM public.braiders
                UNION ALL
                SELECT CASE WHEN COUNT(*) >= 6 THEN 1 ELSE 0 END FROM public.products
                UNION ALL
                SELECT CASE WHEN COUNT(*) >= 13 THEN 1 ELSE 0 END FROM public.services
                UNION ALL
                SELECT CASE WHEN COUNT(*) >= 3 THEN 1 ELSE 0 END FROM public.conversations
                UNION ALL
                SELECT CASE WHEN COUNT(*) >= 12 THEN 1 ELSE 0 END FROM public.messages
            ) checks
            WHERE checks.case = 1
        ) = 6 THEN '🎉 MIGRAÇÃO CONCLUÍDA!'
        ELSE '⚠️ VERIFICAR PROBLEMAS ACIMA'
    END as status;