-- ============================================================================
-- CRIAR BRAIDER DE TESTE PARA CHAT
-- ============================================================================

-- Inserir usuário de teste para a trancista
INSERT INTO public.users (
    id,
    name,
    email,
    role,
    email_verified
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Maria Trancas',
    'maria.trancas@teste.com',
    'braider',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Inserir braider de teste com ID específico
INSERT INTO public.braiders (
    id,
    user_id,
    bio,
    location,
    contact_phone,
    contact_email,
    status,
    profile_image_url,
    portfolio_images,
    distrito,
    concelho,
    freguesia,
    specialties,
    years_experience
) VALUES (
    'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
    '11111111-1111-1111-1111-111111111111',
    'Especialista em tranças afro-brasileiras com mais de 10 anos de experiência.',
    'Lisboa, Portugal',
    '+351 912 345 678',
    'maria.trancas@teste.com',
    'approved',
    'https://images.unsplash.com/photo-1494790108755-2616b612b787?w=400&h=400&fit=crop&crop=face',
    ARRAY[
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400',
        'https://images.unsplash.com/photo-1522336284037-91f7da73f5c8?w=600&h=400'
    ],
    'Lisboa',
    'Lisboa',
    'Estrela',
    ARRAY['Box Braids', 'Tranças Rastafári', 'Twist', 'Cornrows'],
    10
) ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    profile_image_url = EXCLUDED.profile_image_url,
    portfolio_images = EXCLUDED.portfolio_images,
    distrito = EXCLUDED.distrito,
    concelho = EXCLUDED.concelho,
    freguesia = EXCLUDED.freguesia,
    specialties = EXCLUDED.specialties,
    years_experience = EXCLUDED.years_experience;

-- Inserir alguns serviços para a trancista
INSERT INTO public.services (
    braider_id,
    name,
    description,
    price,
    duration_minutes,
    image_url
) VALUES 
    (
        'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        'Box Braids Clássicas',
        'Tranças box braids tradicionais com extensões sintéticas.',
        120.00,
        240,
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300'
    ),
    (
        'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        'Tranças Rastafári',
        'Tranças rastafári autênticas com extensões naturais.',
        150.00,
        300,
        'https://images.unsplash.com/photo-1522336284037-91f7da73f5c8?w=400&h=300'
    ),
    (
        'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        'Twist Moderno',
        'Penteado twist moderno e elegante.',
        90.00,
        180,
        'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300'
    )
ON CONFLICT (braider_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_minutes = EXCLUDED.duration_minutes,
    image_url = EXCLUDED.image_url;

-- Inserir usuário cliente para teste
INSERT INTO public.users (
    id,
    name,
    email,
    role,
    email_verified
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Ana Cliente',
    'ana.cliente@teste.com',
    'customer',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verificar se foi criado corretamente
SELECT 'BRAIDER CRIADO:' AS info;
SELECT b.id, b.user_id, u.name, u.email, b.status, b.location
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
WHERE b.id = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7';

SELECT 'SERVIÇOS DO BRAIDER:' AS info;
SELECT id, name, price, duration_minutes
FROM public.services
WHERE braider_id = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7';