-- ============================================================================
-- MIGRAÇÃO COMPLETA DOS DADOS MOCK PARA SUPABASE
-- ============================================================================
-- Este script migra todos os dados mock da aplicação para as tabelas do Supabase
-- seguindo o schema definido e mantendo a integridade referencial
-- ============================================================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE public.message_notifications CASCADE;
TRUNCATE TABLE public.message_read_status CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.braider_availability CASCADE;
TRUNCATE TABLE public.services CASCADE;
TRUNCATE TABLE public.braiders CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- ============================================================================
-- 1. INSERIR USUÁRIOS
-- ============================================================================

-- Usuários Admin
INSERT INTO public.users (id, email, name, role, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@wilnara.com', 'Administrador Wilnara', 'admin', NULL);

-- Usuários Trancistas
INSERT INTO public.users (id, email, name, role, phone) VALUES
('22222222-2222-2222-2222-222222222222', 'ana.trancista@example.com', 'Ana Trancista', 'braider', '(351) 91234-5678'),
('33333333-3333-3333-3333-333333333333', 'bia.trancista@example.com', 'Bia Cachos & Tranças', 'braider', '(351) 93456-7890'),
('44444444-4444-4444-4444-444444444444', 'carla.estilos@example.com', 'Carla Estilos', 'braider', '(351) 91122-3344'),
('55555555-5555-5555-5555-555555555555', 'maria@example.com', 'Maria Silva', 'braider', '(11) 99999-1234'),
('66666666-6666-6666-6666-666666666666', 'ana@example.com', 'Ana Costa', 'braider', '(21) 99999-5678'),
('77777777-7777-7777-7777-777777777777', 'joana@example.com', 'Joana Santos', 'braider', '(71) 99999-9012'),
('88888888-8888-8888-8888-888888888888', 'camila@example.com', 'Camila Oliveira', 'braider', '(61) 99999-3456');

-- Usuários Clientes (exemplos)
INSERT INTO public.users (id, email, name, role, phone) VALUES
('99999999-9999-9999-9999-999999999999', 'cliente@exemplo.com', 'Cliente Exemplo', 'customer', '(11) 99999-0000'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'maria.s@example.com', 'Maria Silva Cliente', 'customer', '(351) 96123-4567'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'joana.s@example.com', 'Joana Santos Cliente', 'customer', '(351) 92345-6789');

-- ============================================================================
-- 2. INSERIR PRODUTOS
-- ============================================================================

INSERT INTO public.products (name, description, long_description, price, images, category, stock_quantity) VALUES
(
  'Trança Box Braids Clássica',
  'Cabelo sintético de alta qualidade para um visual clássico e duradouro.',
  'As Box Braids clássicas são uma escolha atemporal para quem busca um visual elegante e de baixa manutenção. Feitas com cabelo sintético premium, elas oferecem durabilidade e um acabamento impecável. Perfeitas para proteger seus fios naturais e experimentar um novo estilo.',
  150.00,
  ARRAY['/placeholder.svg?height=300&width=400&text=Box+Braids'],
  'Tranças',
  50
),
(
  'Crochet Braids Onduladas',
  'Fios ondulados para um estilo volumoso e natural.',
  'Nossas Crochet Braids onduladas são ideais para quem deseja volume e movimento. Com uma textura suave e cachos definidos, elas proporcionam um look natural e deslumbrante. Fáceis de instalar e remover, são a opção perfeita para uma transformação rápida e impactante.',
  180.00,
  ARRAY['/placeholder.svg?height=300&width=400&text=Crochet+Braids'],
  'Cachos',
  45
),
(
  'Twists Senegalesas Longas',
  'Twists elegantes e leves, perfeitas para qualquer ocasião.',
  'As Twists Senegalesas longas da Wilnara Tranças são sinônimo de elegância e leveza. Com um caimento perfeito e um brilho sutil, elas são versáteis para o dia a dia ou eventos especiais. Confeccionadas com material de alta qualidade para garantir conforto e um visual impecável.',
  220.00,
  ARRAY['/placeholder.svg?height=300&width=400&text=Twists+Senegalesas'],
  'Twists',
  35
),
(
  'Faux Locs Leves',
  'Locs sintéticas que imitam o cabelo natural, com conforto e estilo.',
  'Experimente a beleza das Faux Locs com a leveza e o conforto que você merece. Nossas locs sintéticas são cuidadosamente elaboradas para imitar a textura e o caimento do cabelo natural, oferecendo um estilo autêntico e protetor. Duráveis e fáceis de manter, são a escolha ideal para um visual ousado e sofisticado.',
  250.00,
  ARRAY['/placeholder.svg?height=300&width=400&text=Faux+Locs'],
  'Locs',
  25
),
(
  'Trança Nagô com Cachos',
  'Base nagô com cachos soltos para um look moderno.',
  'A Trança Nagô com Cachos combina a tradição das tranças nagô com a modernidade dos cachos soltos. Este estilo versátil é perfeito para quem busca um visual único, que valoriza a beleza natural e oferece praticidade no dia a dia. Feita com materiais de alta qualidade para garantir conforto e durabilidade.',
  190.00,
  ARRAY['/placeholder.svg?height=300&width=400&text=Nagô+Cachos'],
  'Nagô',
  40
),
(
  'Dreadlocks Sintéticos',
  'Dreadlocks sintéticos realistas e de fácil aplicação.',
  'Nossos Dreadlocks Sintéticos são a opção ideal para quem deseja um visual alternativo e cheio de personalidade sem comprometer o cabelo natural. Realistas e leves, são fáceis de aplicar e manter, proporcionando um estilo autêntico e duradouro. Disponíveis em diversas cores e comprimentos.',
  280.00,
  ARRAY['/placeholder.svg?height=300&width=400&text=Dreadlocks'],
  'Dreadlocks',
  20
);

-- ============================================================================
-- 3. INSERIR PERFIS DE TRANCISTAS
-- ============================================================================

INSERT INTO public.braiders (user_id, bio, location, contact_phone, status, portfolio_images, average_rating, total_reviews) VALUES
(
  '22222222-2222-2222-2222-222222222222',
  'Especialista em Box Braids e Twists Senegalesas com mais de 10 anos de experiência. Atendimento personalizado e com muito carinho.',
  'Lisboa, Portugal',
  '(351) 91234-5678',
  'approved',
  ARRAY[
    '/placeholder.svg?height=300&width=400&text=Portfolio+1',
    '/placeholder.svg?height=300&width=400&text=Portfolio+2',
    '/placeholder.svg?height=300&width=400&text=Portfolio+1-1',
    '/placeholder.svg?height=300&width=400&text=Portfolio+1-2'
  ],
  4.8,
  25
),
(
  '33333333-3333-3333-3333-333333333333',
  'Apaixonada por cabelos crespos e cacheados, especialista em Crochet Braids e Nagô. Crio estilos que realçam sua beleza natural.',
  'Porto, Portugal',
  '(351) 93456-7890',
  'approved',
  ARRAY[
    '/placeholder.svg?height=300&width=400&text=Portfolio+3',
    '/placeholder.svg?height=300&width=400&text=Portfolio+4',
    '/placeholder.svg?height=300&width=400&text=Portfolio+3-1',
    '/placeholder.svg?height=300&width=400&text=Portfolio+3-2'
  ],
  4.6,
  18
),
(
  '44444444-4444-4444-4444-444444444444',
  'Nova trancista na área, especializada em tranças infantis e penteados com extensão. Buscando expandir minha clientela!',
  'Faro, Portugal',
  '(351) 91122-3344',
  'pending',
  ARRAY['/placeholder.svg?height=300&width=400&text=Portfolio+5'],
  0.0,
  0
),
(
  '55555555-5555-5555-5555-555555555555',
  'Especialista em tranças africanas com mais de 10 anos de experiência.',
  'São Paulo, SP',
  '(11) 99999-1234',
  'approved',
  ARRAY['/placeholder.svg?height=300&width=300&text=Portfolio1'],
  4.8,
  45
),
(
  '66666666-6666-6666-6666-666666666666',
  'Trancista profissional especializada em box braids e twist braids.',
  'Rio de Janeiro, RJ',
  '(21) 99999-5678',
  'approved',
  ARRAY['/placeholder.svg?height=300&width=300&text=Portfolio2'],
  4.9,
  32
),
(
  '77777777-7777-7777-7777-777777777777',
  'Especialista em protective styles e tranças Nagô, com técnicas ancestrais.',
  'Salvador, BA',
  '(71) 99999-9012',
  'approved',
  ARRAY['/placeholder.svg?height=300&width=300&text=Portfolio3'],
  4.7,
  28
),
(
  '88888888-8888-8888-8888-888888888888',
  'Criadora de estilos únicos com foco em fulani braids e cornrows artísticas.',
  'Brasília, DF',
  '(61) 99999-3456',
  'approved',
  ARRAY['/placeholder.svg?height=300&width=300&text=Portfolio4'],
  4.9,
  41
);

-- ============================================================================
-- 4. INSERIR SERVIÇOS (vinculados aos braiders)
-- ============================================================================

-- Serviços da Ana Trancista (braider_id será obtido via subquery)
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  'Box Braids Médias',
  'Tranças médias com acabamento impecável.',
  300.00,
  240,
  '/placeholder.svg?height=150&width=200&text=Box+Braids+Medias'
),
(
  (SELECT id FROM public.braiders WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  'Twists Senegalesas Finas',
  'Twists leves e elegantes para um visual sofisticado.',
  350.00,
  300,
  '/placeholder.svg?height=150&width=200&text=Twists+Senegalesas+Finas'
);

-- Serviços da Bia Cachos & Tranças
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '33333333-3333-3333-3333-333333333333'),
  'Crochet Braids Volumosas',
  'Cachos volumosos e naturais com técnica de crochet.',
  280.00,
  180,
  '/placeholder.svg?height=150&width=200&text=Crochet+Braids+Volumosas'
),
(
  (SELECT id FROM public.braiders WHERE user_id = '33333333-3333-3333-3333-333333333333'),
  'Trança Nagô Lateral',
  'Penteado nagô moderno com detalhes laterais.',
  150.00,
  120,
  '/placeholder.svg?height=150&width=200&text=Tranca+Nago+Lateral'
);

-- Serviços da Carla Estilos
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '44444444-4444-4444-4444-444444444444'),
  'Tranças Infantis',
  'Tranças divertidas e seguras para crianças.',
  80.00,
  90,
  '/placeholder.svg?height=150&width=200&text=Trancas+Infantis'
);

-- Serviços da Maria Silva
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '55555555-5555-5555-5555-555555555555'),
  'Box Braids Clássicas',
  'Box braids tradicionais com acabamento profissional.',
  250.00,
  240,
  '/placeholder.svg?height=150&width=200&text=Box+Braids+Classicas'
),
(
  (SELECT id FROM public.braiders WHERE user_id = '55555555-5555-5555-5555-555555555555'),
  'Tranças Africanas Tradicionais',
  'Penteados tradicionais africanos com técnicas ancestrais.',
  180.00,
  180,
  '/placeholder.svg?height=150&width=200&text=Trancas+Africanas'
);

-- Serviços da Ana Costa
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '66666666-6666-6666-6666-666666666666'),
  'Box Braids Médias',
  'Box braids de tamanho médio para um visual equilibrado.',
  280.00,
  210,
  '/placeholder.svg?height=150&width=200&text=Box+Braids+Medias'
),
(
  (SELECT id FROM public.braiders WHERE user_id = '66666666-6666-6666-6666-666666666666'),
  'Twist Braids Modernas',
  'Twist braids com toque moderno e contemporâneo.',
  320.00,
  240,
  '/placeholder.svg?height=150&width=200&text=Twist+Braids'
);

-- Serviços da Joana Santos
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '77777777-7777-7777-7777-777777777777'),
  'Tranças Nagô Tradicionais',
  'Tranças nagô com técnicas tradicionais da Bahia.',
  200.00,
  180,
  '/placeholder.svg?height=150&width=200&text=Trancas+Nago'
),
(
  (SELECT id FROM public.braiders WHERE user_id = '77777777-7777-7777-7777-777777777777'),
  'Protective Styles',
  'Penteados protetivos para cuidar dos seus cabelos.',
  350.00,
  300,
  '/placeholder.svg?height=150&width=200&text=Protective+Styles'
);

-- Serviços da Camila Oliveira
INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url) VALUES
(
  (SELECT id FROM public.braiders WHERE user_id = '88888888-8888-8888-8888-888888888888'),
  'Fulani Braids Elegantes',
  'Fulani braids com decorações e estilo elegante.',
  380.00,
  270,
  '/placeholder.svg?height=150&width=200&text=Fulani+Braids'
),
(
  (SELECT id FROM public.braiders WHERE user_id = '88888888-8888-8888-8888-888888888888'),
  'Cornrows Artísticas',
  'Cornrows com padrões artísticos únicos e criativos.',
  220.00,
  150,
  '/placeholder.svg?height=150&width=200&text=Cornrows+Artisticas'
);

-- ============================================================================
-- 5. INSERIR AGENDAMENTOS DE EXEMPLO
-- ============================================================================

INSERT INTO public.bookings (
  service_id, 
  client_id, 
  braider_id, 
  booking_date, 
  booking_time, 
  service_type, 
  client_name, 
  client_email, 
  client_phone, 
  client_address, 
  status, 
  total_amount
) VALUES
(
  (SELECT id FROM public.services WHERE name = 'Box Braids Médias' AND braider_id = (SELECT id FROM public.braiders WHERE user_id = '22222222-2222-2222-2222-222222222222')),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM public.braiders WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  '2025-08-01',
  '10:00',
  'trancista',
  'Maria Silva Cliente',
  'maria.s@example.com',
  '(351) 96123-4567',
  'Rua da Liberdade, 10, Lisboa',
  'confirmed',
  300.00
),
(
  (SELECT id FROM public.services WHERE name = 'Twists Senegalesas Finas' AND braider_id = (SELECT id FROM public.braiders WHERE user_id = '22222222-2222-2222-2222-222222222222')),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  (SELECT id FROM public.braiders WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  '2025-08-05',
  '14:30',
  'domicilio',
  'Joana Santos Cliente',
  'joana.s@example.com',
  '(351) 92345-6789',
  'Avenida dos Aliados, 25, Porto',
  'pending',
  350.00
);

-- ============================================================================
-- 6. CRIAR DISPONIBILIDADES PARA AS TRANCISTAS (30 dias)
-- ============================================================================

-- Função para gerar disponibilidades (executar para cada trancista)
DO $$
DECLARE
    braider_record RECORD;
    date_counter DATE;
    time_slot TIME;
    end_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
    -- Loop através de todos os trancistas aprovados
    FOR braider_record IN 
        SELECT id FROM public.braiders WHERE status = 'approved'
    LOOP
        -- Loop através de 30 dias
        date_counter := CURRENT_DATE + INTERVAL '1 day';
        WHILE date_counter <= end_date LOOP
            -- Pular domingos (0 = domingo)
            IF EXTRACT(DOW FROM date_counter) != 0 THEN
                -- Horários de trabalho: 9:00 às 17:00
                FOR i IN 9..17 LOOP
                    time_slot := (i || ':00')::TIME;
                    
                    -- Inserir slot de disponibilidade
                    INSERT INTO public.braider_availability (
                        braider_id,
                        available_date,
                        start_time,
                        end_time,
                        is_booked
                    ) VALUES (
                        braider_record.id,
                        date_counter,
                        time_slot,
                        time_slot + INTERVAL '1 hour',
                        FALSE
                    );
                END LOOP;
            END IF;
            
            date_counter := date_counter + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 7. INSERIR CONVERSAS E MENSAGENS MOCK
-- ============================================================================

-- Conversas entre clientes e trancistas
INSERT INTO public.conversations (id, participant_1_id, participant_2_id, status, last_message_content, last_message_timestamp, last_message_sender_id) VALUES
-- Conversa 1: Cliente Ana Costa com Trancista Sofia (Ana Trancista)
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Maria Silva Cliente
  '22222222-2222-2222-2222-222222222222', -- Ana Trancista
  'active',
  'Tenho sim! Posso no sábado à tarde ou domingo de manhã. Qual prefere?',
  '2024-01-20T10:00:00Z',
  '22222222-2222-2222-2222-222222222222'
),
-- Conversa 2: Cliente Joana com Trancista Maria Silva
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- Joana Santos Cliente
  '55555555-5555-5555-5555-555555555555', -- Maria Silva
  'active',
  'Perfeito! Vou confirmar o agendamento para amanhã às 14h.',
  '2024-01-20T09:15:00Z',
  '55555555-5555-5555-5555-555555555555'
),
-- Conversa 3: Cliente exemplo com Bia Cachos
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '99999999-9999-9999-9999-999999999999', -- Cliente Exemplo
  '33333333-3333-3333-3333-333333333333', -- Bia Cachos & Tranças
  'active',
  'Obrigada pelas dicas! Ficaram lindas as tranças 😍',
  '2024-01-20T08:45:00Z',
  '99999999-9999-9999-9999-999999999999'
);

-- Mensagens da Conversa 1 (Ana Costa com Sofia/Ana Trancista)
INSERT INTO public.messages (conversation_id, sender_id, content, message_type, is_delivered, is_read, created_at) VALUES
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222', -- Ana Trancista
  'Olá! Vi que você tem interesse nos meus serviços de tranças. Como posso ajudar?',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T09:00:00Z'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Maria Silva Cliente
  'Oi Sofia! Gostaria de saber mais sobre o serviço de tranças nagô. Qual o valor e duração?',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T09:15:00Z'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222', -- Ana Trancista
  'As tranças nagô custam €45 e levam aproximadamente 3 horas para fazer. Posso fazer ao domicílio ou você pode vir até mim.',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T09:30:00Z'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Maria Silva Cliente
  'Perfeito! Prefiro ao domicílio. Você tem disponibilidade este final de semana?',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T09:45:00Z'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222', -- Ana Trancista
  'Tenho sim! Posso no sábado à tarde ou domingo de manhã. Qual prefere?',
  'text',
  TRUE,
  FALSE, -- Mensagem não lida
  '2024-01-20T10:00:00Z'
);

-- Mensagens da Conversa 2 (Joana com Maria Silva)
INSERT INTO public.messages (conversation_id, sender_id, content, message_type, is_delivered, is_read, created_at) VALUES
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- Joana Santos Cliente
  'Oi Maria! Gostei muito do seu trabalho. Gostaria de agendar um serviço de box braids.',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:30:00Z'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '55555555-5555-5555-5555-555555555555', -- Maria Silva
  'Olá Joana! Que bom que gostou! Para box braids clássicas o valor é €250 e demora cerca de 4 horas. Qual dia seria melhor para você?',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:45:00Z'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- Joana Santos Cliente
  'Amanhã à tarde estaria bom? Por volta das 14h?',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T09:00:00Z'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '55555555-5555-5555-5555-555555555555', -- Maria Silva
  'Perfeito! Vou confirmar o agendamento para amanhã às 14h.',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T09:15:00Z'
);

-- Mensagens da Conversa 3 (Cliente exemplo com Bia)
INSERT INTO public.messages (conversation_id, sender_id, content, message_type, is_delivered, is_read, created_at) VALUES
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '99999999-9999-9999-9999-999999999999', -- Cliente Exemplo
  'Oi Bia! Adorei as crochet braids que você fez. Ficaram perfeitas! 🤩',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:00:00Z'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '33333333-3333-3333-3333-333333333333', -- Bia Cachos & Tranças
  'Muito obrigada! Fico feliz que tenha gostado! Se precisar de dicas para manutenção, me chama.',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:15:00Z'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '99999999-9999-9999-9999-999999999999', -- Cliente Exemplo
  'Sim, por favor! Como faço para manter o volume dos cachos?',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:30:00Z'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '33333333-3333-3333-3333-333333333333', -- Bia Cachos & Tranças
  'Use um borrifador com água e leave-in pela manhã, e durma com uma touca de seda. Vai manter o caimento perfeito! 💕',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:35:00Z'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '99999999-9999-9999-9999-999999999999', -- Cliente Exemplo
  'Obrigada pelas dicas! Ficaram lindas as tranças 😍',
  'text',
  TRUE,
  TRUE,
  '2024-01-20T08:45:00Z'
);

-- ============================================================================
-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_braiders_status ON public.braiders(status);
CREATE INDEX IF NOT EXISTS idx_braiders_location ON public.braiders(location);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_services_braider ON public.services(braider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_braider ON public.bookings(braider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_availability_braider_date ON public.braider_availability(braider_id, available_date);

-- ============================================================================
-- 9. VERIFICAR INTEGRIDADE DOS DADOS
-- ============================================================================

-- Verificar contagens
SELECT 'users' as tabela, COUNT(*) as total FROM public.users
UNION ALL
SELECT 'braiders', COUNT(*) FROM public.braiders
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'availability', COUNT(*) FROM public.braider_availability
UNION ALL
SELECT 'conversations', COUNT(*) FROM public.conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages;

-- Verificar relacionamentos
SELECT 
    b.id as braider_id,
    u.name as braider_name,
    COUNT(s.id) as services_count,
    b.status
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.services s ON b.id = s.braider_id
GROUP BY b.id, u.name, b.status
ORDER BY u.name;

-- ============================================================================
-- MIGRAÇÃO CONCLUÍDA
-- ============================================================================

-- Informações finais
SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status;
SELECT 'Dados mock migrados para estrutura Supabase' as info;
SELECT 'Execute as verificações acima para confirmar integridade' as proximo_passo;