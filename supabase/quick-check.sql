-- ============================================================================
-- VERIFICAÇÃO RÁPIDA - EXECUTE NO DASHBOARD SUPABASE
-- ============================================================================

-- CONTAGEM SIMPLES DE TODAS AS TABELAS
SELECT 
    'users' as tabela, 
    COUNT(*) as registros,
    'Usuários (admin, braiders, customers)' as descricao
FROM public.users

UNION ALL

SELECT 
    'braiders', 
    COUNT(*),
    'Perfis de trancistas'
FROM public.braiders

UNION ALL

SELECT 
    'products', 
    COUNT(*),
    'Produtos de tranças/extensões'
FROM public.products

UNION ALL

SELECT 
    'services', 
    COUNT(*),
    'Serviços oferecidos pelas trancistas'
FROM public.services

UNION ALL

SELECT 
    'bookings', 
    COUNT(*),
    'Agendamentos de serviços'
FROM public.bookings

UNION ALL

SELECT 
    'availability', 
    COUNT(*),
    'Slots de disponibilidade'
FROM public.braider_availability

UNION ALL

SELECT 
    'conversations', 
    COUNT(*),
    'Conversas entre usuários'
FROM public.conversations

UNION ALL

SELECT 
    'messages', 
    COUNT(*),
    'Mensagens no chat'
FROM public.messages

ORDER BY tabela;

-- ============================================================================

-- VERIFICAÇÃO DE INTEGRIDADE (deve retornar 0 para todos)
SELECT 
    'ORPHANED RECORDS' as tipo,
    'braiders_without_users' as tabela,
    COUNT(*) as problemas
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id  
WHERE u.id IS NULL

UNION ALL

SELECT 
    'ORPHANED RECORDS',
    'services_without_braiders',
    COUNT(*)
FROM public.services s
LEFT JOIN public.braiders b ON s.braider_id = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 
    'ORPHANED RECORDS', 
    'messages_without_conversations',
    COUNT(*)
FROM public.messages m
LEFT JOIN public.conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;

-- ============================================================================

-- STATUS FINAL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.users) >= 11 
         AND (SELECT COUNT(*) FROM public.braiders) >= 7
         AND (SELECT COUNT(*) FROM public.products) >= 6  
         AND (SELECT COUNT(*) FROM public.services) >= 13
         AND (SELECT COUNT(*) FROM public.conversations) >= 3
         AND (SELECT COUNT(*) FROM public.messages) >= 12
        THEN '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!'
        ELSE '⚠️ ALGUNS DADOS PODEM ESTAR FALTANDO'
    END as status_final;