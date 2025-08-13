-- =====================================================
-- MIGRAÇÃO FINAL PARA FOREIGN KEYS PUBLIC.USERS
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Validação prévia confirmou que todos os dados são válidos

\echo '🚀 INICIANDO MIGRAÇÃO FINAL DE FOREIGN KEYS...';
\echo '';

-- 1. Promotions table
\echo '📋 Migrando tabela promotions...';

-- promotions.user_id
ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_user_id_fkey;
ALTER TABLE public.promotions ADD CONSTRAINT promotions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- promotions.approved_by
ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_approved_by_fkey;
ALTER TABLE public.promotions ADD CONSTRAINT promotions_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Braiders table
\echo '📋 Migrando tabela braiders...';

ALTER TABLE public.braiders DROP CONSTRAINT IF EXISTS braiders_user_id_fkey;
ALTER TABLE public.braiders ADD CONSTRAINT braiders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Conversations table
\echo '📋 Migrando tabela conversations...';

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_1_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_participant_1_id_fkey
  FOREIGN KEY (participant_1_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_2_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_participant_2_id_fkey
  FOREIGN KEY (participant_2_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_last_message_sender_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_last_message_sender_id_fkey
  FOREIGN KEY (last_message_sender_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Messages table
\echo '📋 Migrando tabela messages...';

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Promotion Settings table
\echo '📋 Migrando tabela promotion_settings...';

ALTER TABLE public.promotion_settings DROP CONSTRAINT IF EXISTS promotion_settings_updated_by_fkey;
ALTER TABLE public.promotion_settings ADD CONSTRAINT promotion_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- =====================================================
-- VERIFICAÇÃO DO RESULTADO
-- =====================================================

\echo '';
\echo '🔍 VERIFICANDO RESULTADO DA MIGRAÇÃO...';

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    CASE 
        WHEN ccu.table_name = 'users' AND ccu.table_schema = 'public' THEN '✅ CORRETO'
        WHEN ccu.table_name = 'users' AND ccu.table_schema = 'auth' THEN '❌ PROBLEMÁTICO'
        ELSE '❓ OUTRO'
    END as status
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name;

\echo '';
\echo '📊 RESUMO FINAL:';
SELECT 
    COUNT(*) FILTER (WHERE ccu.table_schema = 'public' AND ccu.table_name = 'users') as "FKs para public.users (✅ CORRETO)",
    COUNT(*) FILTER (WHERE ccu.table_schema = 'auth' AND ccu.table_name = 'users') as "FKs para auth.users (❌ PROBLEMA)"
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users';

\echo '';
\echo '✅ MIGRAÇÃO CONCLUÍDA!';
\echo 'Sistema NextAuth + public.users agora está com FKs padronizadas.';
\echo 'Próximo passo: Testar funcionalidades principais do sistema.';