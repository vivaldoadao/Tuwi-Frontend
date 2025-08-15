-- Corrigir braider para usuário znattechnology95@gmail.com
-- Verificar se existe usuário e braider, e garantir que contact_email está correto

DO $$
DECLARE
    user_record RECORD;
    braider_record RECORD;
BEGIN
    -- 1. Verificar usuário
    SELECT id, email, name, role 
    INTO user_record
    FROM public.users 
    WHERE email = 'znattechnology95@gmail.com' 
    LIMIT 1;

    IF user_record.id IS NULL THEN
        RAISE NOTICE 'Usuário znattechnology95@gmail.com não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuário encontrado: % (ID: %, Role: %)', user_record.name, user_record.id, user_record.role;

    -- 2. Verificar braider
    SELECT id, name, contact_email, user_id, status
    INTO braider_record
    FROM public.braiders 
    WHERE user_id = user_record.id OR contact_email = 'znattechnology95@gmail.com'
    LIMIT 1;

    IF braider_record.id IS NULL THEN
        RAISE NOTICE 'Braider não encontrado. Criando novo braider...';
        
        -- Criar braider
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
            user_record.id,
            'Trancista Profissional',
            'Especialista em tranças africanas e penteados protetivos.',
            'Lisboa, Portugal',
            'znattechnology95@gmail.com',
            '(351) 91234-5678',
            'approved',
            TRUE,
            TRUE,
            15,
            ARRAY['Box Braids', 'Tranças Nagô', 'Twists'],
            '3-5',
            4.8,
            12,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Braider criado com sucesso!';
    ELSE
        RAISE NOTICE 'Braider encontrado: % (ID: %, Email: %, Status: %)', 
                     braider_record.name, braider_record.id, braider_record.contact_email, braider_record.status;
        
        -- Verificar se contact_email está correto
        IF braider_record.contact_email != 'znattechnology95@gmail.com' THEN
            RAISE NOTICE 'Atualizando contact_email...';
            UPDATE public.braiders 
            SET contact_email = 'znattechnology95@gmail.com',
                updated_at = NOW()
            WHERE id = braider_record.id;
            RAISE NOTICE 'Contact_email atualizado!';
        END IF;
        
        -- Verificar se user_id está correto
        IF braider_record.user_id != user_record.id THEN
            RAISE NOTICE 'Atualizando user_id...';
            UPDATE public.braiders 
            SET user_id = user_record.id,
                updated_at = NOW()
            WHERE id = braider_record.id;
            RAISE NOTICE 'User_id atualizado!';
        END IF;
    END IF;

    -- 3. Garantir que o usuário tem role correto
    IF user_record.role != 'braider' THEN
        RAISE NOTICE 'Atualizando role do usuário para braider...';
        UPDATE public.users 
        SET role = 'braider', updated_at = NOW()
        WHERE id = user_record.id;
        RAISE NOTICE 'Role do usuário atualizado!';
    END IF;

    -- 4. Verificação final
    SELECT b.id, b.name, b.contact_email, u.email as user_email, u.role
    FROM public.braiders b
    JOIN public.users u ON b.user_id = u.id
    WHERE u.email = 'znattechnology95@gmail.com';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Verificação final: Braider configurado corretamente!';
    ELSE
        RAISE NOTICE '❌ Erro: Configuração não funcionou!';
    END IF;

END $$;