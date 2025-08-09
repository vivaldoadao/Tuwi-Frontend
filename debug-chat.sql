-- ============================================================================
-- DEBUG SCRIPT - Verificar estado atual do banco para chat
-- ============================================================================

-- Verificar usuários
SELECT 'USUÁRIOS EXISTENTES:' AS info;
SELECT id, name, email, role, created_at 
FROM public.users 
ORDER BY created_at 
LIMIT 10;

-- Verificar braiders
SELECT 'BRAIDERS EXISTENTES:' AS info;
SELECT b.id, b.user_id, u.name, u.email, b.status, b.created_at
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id
ORDER BY b.created_at
LIMIT 10;

-- Verificar o braider específico do erro
SELECT 'BRAIDER ESPECÍFICO (ec4f8487-db41-4f3e-ba82-95558b6bb4a7):' AS info;
SELECT b.id, b.user_id, u.name, u.email, b.status
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id
WHERE b.id = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7';

-- Verificar conversas existentes
SELECT 'CONVERSAS EXISTENTES:' AS info;
SELECT c.id, c.participant_1_id, c.participant_2_id, 
       u1.name as p1_name, u2.name as p2_name,
       c.last_message_content, c.created_at
FROM public.conversations c
LEFT JOIN public.users u1 ON c.participant_1_id = u1.id
LEFT JOIN public.users u2 ON c.participant_2_id = u2.id
ORDER BY c.created_at DESC
LIMIT 10;

-- Verificar mensagens existentes
SELECT 'MENSAGENS EXISTENTES:' AS info;
SELECT m.id, m.conversation_id, m.sender_id, u.name as sender_name, 
       m.content, m.created_at
FROM public.messages m
LEFT JOIN public.users u ON m.sender_id = u.id
ORDER BY m.created_at DESC
LIMIT 10;