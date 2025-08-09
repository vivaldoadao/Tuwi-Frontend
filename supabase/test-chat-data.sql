-- ============================================================================
-- CRIAR DADOS DE TESTE PARA O SISTEMA DE MENSAGENS
-- ============================================================================
-- Este script cria conversas e mensagens de teste para verificar se o sistema funciona
-- ============================================================================

-- Verificar usuários existentes
SELECT 'Usuários existentes:' AS info;
SELECT id, name, email, role FROM public.users ORDER BY created_at LIMIT 10;

-- Criar algumas conversas de teste entre usuários existentes
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    conv1_id UUID;
    conv2_id UUID;
BEGIN
    -- Pegar os primeiros usuários disponíveis
    SELECT id INTO user1_id FROM public.users WHERE role = 'customer' ORDER BY created_at LIMIT 1;
    SELECT id INTO user2_id FROM public.users WHERE role = 'braider' ORDER BY created_at LIMIT 1;
    SELECT id INTO user3_id FROM public.users WHERE role = 'customer' ORDER BY created_at LIMIT 1 OFFSET 1;
    
    -- Se encontrarmos usuários, criar conversas
    IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
        -- Conversa 1: Cliente e Trancista
        INSERT INTO public.conversations (participant_1_id, participant_2_id, status)
        VALUES (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id), 'active')
        ON CONFLICT (participant_1_id, participant_2_id) DO NOTHING
        RETURNING id INTO conv1_id;
        
        -- Se a conversa foi criada, adicionar mensagens
        IF conv1_id IS NOT NULL THEN
            -- Mensagem do cliente
            INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
            VALUES (conv1_id, user1_id, 'Olá! Gostaria de agendar um serviço de tranças.', 'text');
            
            -- Mensagem da trancista
            INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
            VALUES (conv1_id, user2_id, 'Olá! Claro, que tipo de tranças você gostaria?', 'text');
            
            -- Mais uma mensagem do cliente
            INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
            VALUES (conv1_id, user1_id, 'Estou interessada em tranças box braids. Qual o preço?', 'text');
        END IF;
    END IF;
    
    -- Conversa 2: Se houver um terceiro usuário
    IF user1_id IS NOT NULL AND user3_id IS NOT NULL AND user1_id != user3_id THEN
        INSERT INTO public.conversations (participant_1_id, participant_2_id, status)
        VALUES (LEAST(user1_id, user3_id), GREATEST(user1_id, user3_id), 'active')
        ON CONFLICT (participant_1_id, participant_2_id) DO NOTHING
        RETURNING id INTO conv2_id;
        
        IF conv2_id IS NOT NULL THEN
            INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
            VALUES (conv2_id, user1_id, 'Oi! Como está?', 'text');
            
            INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
            VALUES (conv2_id, user3_id, 'Oi! Tudo bem e você?', 'text');
        END IF;
    END IF;
    
    RAISE NOTICE 'Dados de teste criados com sucesso!';
    RAISE NOTICE 'User1: %, User2: %, User3: %', user1_id, user2_id, user3_id;
    RAISE NOTICE 'Conv1: %, Conv2: %', conv1_id, conv2_id;
END $$;

-- Verificar dados criados
SELECT 'Conversas criadas:' AS info;
SELECT 
    c.id,
    c.participant_1_id,
    c.participant_2_id,
    u1.name as participant_1_name,
    u2.name as participant_2_name,
    c.last_message_content,
    c.created_at
FROM public.conversations c
JOIN public.users u1 ON c.participant_1_id = u1.id
JOIN public.users u2 ON c.participant_2_id = u2.id
ORDER BY c.created_at DESC;

SELECT 'Mensagens criadas:' AS info;
SELECT 
    m.id,
    m.conversation_id,
    u.name as sender_name,
    m.content,
    m.created_at
FROM public.messages m
JOIN public.users u ON m.sender_id = u.id
ORDER BY m.conversation_id, m.created_at;

-- Testar função get_or_create_conversation
SELECT 'Testando função get_or_create_conversation:' AS info;
SELECT get_or_create_conversation(
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.users LIMIT 1 OFFSET 1)
) AS conversation_id;