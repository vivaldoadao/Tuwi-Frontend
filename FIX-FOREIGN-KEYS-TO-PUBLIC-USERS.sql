-- =====================================================
-- CORRIGIR TODAS AS FOREIGN KEYS PARA PUBLIC.USERS
-- =====================================================
-- Problema: FKs apontam para auth.users mas usamos NextAuth com public.users
-- Solução: Migrar todas as referências para public.users

-- 1. PROMOTIONS TABLE
ALTER TABLE IF EXISTS public.promotions 
DROP CONSTRAINT IF EXISTS promotions_user_id_fkey;

ALTER TABLE IF EXISTS public.promotions 
ADD CONSTRAINT promotions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. PROMOTION_SETTINGS TABLE
ALTER TABLE IF EXISTS public.promotion_settings 
DROP CONSTRAINT IF EXISTS promotion_settings_updated_by_fkey;

ALTER TABLE IF EXISTS public.promotion_settings 
ADD CONSTRAINT promotion_settings_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. PROMOTION_ANALYTICS TABLE  
ALTER TABLE IF EXISTS public.promotion_analytics 
DROP CONSTRAINT IF EXISTS promotion_analytics_user_id_fkey;

ALTER TABLE IF EXISTS public.promotion_analytics 
ADD CONSTRAINT promotion_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. PROMOTION_PACKAGES (user references)
ALTER TABLE IF EXISTS public.promotion_packages 
DROP CONSTRAINT IF EXISTS promotion_packages_user_id_fkey;

ALTER TABLE IF EXISTS public.promotion_packages 
ADD CONSTRAINT promotion_packages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. PROMOTION_SUBSCRIPTIONS
ALTER TABLE IF EXISTS public.promotion_subscriptions 
DROP CONSTRAINT IF EXISTS promotion_subscriptions_user_id_fkey;

ALTER TABLE IF EXISTS public.promotion_subscriptions 
ADD CONSTRAINT promotion_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. COMBO PACKAGES
ALTER TABLE IF EXISTS public.combo_packages 
DROP CONSTRAINT IF EXISTS combo_packages_created_by_fkey;

ALTER TABLE IF EXISTS public.combo_packages 
ADD CONSTRAINT combo_packages_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 7. COMBO PURCHASES
ALTER TABLE IF EXISTS public.combo_purchases 
DROP CONSTRAINT IF EXISTS combo_purchases_user_id_fkey;

ALTER TABLE IF EXISTS public.combo_purchases 
ADD CONSTRAINT combo_purchases_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 8. COMBO SUBSCRIPTIONS  
ALTER TABLE IF EXISTS public.combo_subscriptions 
DROP CONSTRAINT IF EXISTS combo_subscriptions_user_id_fkey;

ALTER TABLE IF EXISTS public.combo_subscriptions 
ADD CONSTRAINT combo_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verificar se todas as correções foram aplicadas
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    ccu.column_name AS foreign_key_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'users' OR ccu.table_name = 'auth.users')
ORDER BY tc.table_name, tc.constraint_name;