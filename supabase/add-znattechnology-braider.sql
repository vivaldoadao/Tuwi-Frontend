-- Add braider profile for znattechnology95@gmail.com user
-- First, let's see if the user exists and get their ID

DO $$
DECLARE
    user_id_var UUID;
    braider_id_var UUID;
BEGIN
    -- Check if user exists and get their ID
    SELECT id INTO user_id_var 
    FROM public.users 
    WHERE email = 'znattechnology95@gmail.com' 
    LIMIT 1;

    IF user_id_var IS NULL THEN
        RAISE NOTICE 'User znattechnology95@gmail.com not found. Creating user first...';
        
        -- Generate a new UUID for the user
        user_id_var := gen_random_uuid();
        
        -- Create the user
        INSERT INTO public.users (id, email, name, role, created_at, updated_at, email_verified)
        VALUES (
            user_id_var,
            'znattechnology95@gmail.com',
            'Usuário Trancista',
            'braider',
            NOW(),
            NOW(),
            TRUE
        );
        
        RAISE NOTICE 'User created with ID: %', user_id_var;
    ELSE
        RAISE NOTICE 'User found with ID: %', user_id_var;
        
        -- Update user role to braider if it isn't already
        UPDATE public.users 
        SET role = 'braider', updated_at = NOW()
        WHERE id = user_id_var AND role != 'braider';
    END IF;

    -- Check if braider profile already exists (check both user_id and contact_email)
    SELECT id INTO braider_id_var
    FROM public.braiders 
    WHERE user_id = user_id_var OR contact_email = 'znattechnology95@gmail.com';

    IF braider_id_var IS NULL THEN
        RAISE NOTICE 'Creating braider profile for user...';
        
        -- Create braider profile
        INSERT INTO public.braiders (
            user_id,
            name,
            bio,
            location,
            contact_email,
            contact_phone,
            status,
            serves_home,
            serves_studio,
            max_travel_distance,
            specialties,
            years_experience,
            average_rating,
            total_reviews,
            created_at,
            updated_at
        ) VALUES (
            user_id_var,
            'Trancista Profissional',
            'Especialista em tranças africanas e penteados protetivos. Atendimento personalizado e técnicas modernas.',
            'Lisboa, Portugal',
            'znattechnology95@gmail.com',
            '(351) 91234-5678',
            'approved',
            TRUE,
            TRUE,
            15,
            ARRAY['Box Braids', 'Tranças Nagô', 'Twists', 'Penteados Protetivos'],
            5,
            4.8,
            12,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Braider profile created successfully!';
    ELSE
        RAISE NOTICE 'Braider profile already exists with ID: %', braider_id_var;
    END IF;

    -- Get the braider ID for creating services
    SELECT id INTO braider_id_var
    FROM public.braiders 
    WHERE user_id = user_id_var;

    -- Add some sample services
    INSERT INTO public.services (braider_id, name, description, price, duration_minutes, image_url, created_at, updated_at)
    VALUES 
    (
        braider_id_var,
        'Box Braids Completas',
        'Box braids profissionais com técnica moderna e produtos de qualidade.',
        89.99,
        240,
        '/placeholder.svg',
        NOW(),
        NOW()
    ),
    (
        braider_id_var,
        'Tranças Nagô Tradicionais',
        'Tranças nagô com técnicas ancestrais e acabamento impecável.',
        65.00,
        180,
        '/placeholder.svg',
        NOW(),
        NOW()
    ),
    (
        braider_id_var,
        'Twists Senegalesas',
        'Twists senegalesas elegantes para proteção e estilo.',
        75.50,
        210,
        '/placeholder.svg',
        NOW(),
        NOW()
    )
    ON CONFLICT (braider_id, name) DO NOTHING;

    RAISE NOTICE 'Sample services added successfully!';

END $$;