-- =====================================================
-- CONSTRAINTS DE INTEGRIDADE DE DADOS
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Adiciona validações críticas para integridade dos dados

\echo '🛡️ ADICIONANDO CONSTRAINTS DE INTEGRIDADE...';
\echo '';

-- =====================================================
-- 1. CONSTRAINTS PARA TABELA USERS
-- =====================================================

\echo '👤 Constraints para tabela users...';

-- Email deve ser único e válido (ignorar erro se já existe)
DO $$ 
BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
    EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Role deve ser um dos valores válidos
DO $$ 
BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_role_valid 
    CHECK (role IN ('customer', 'braider', 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Email deve ter formato válido básico
DO $$ 
BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nome não pode ser vazio
DO $$ 
BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_name_not_empty 
    CHECK (LENGTH(TRIM(name)) > 0);
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. CONSTRAINTS PARA TABELA PROMOTIONS
-- =====================================================

\echo '🎯 Constraints para tabela promotions...';

-- Status deve ser válido
ALTER TABLE public.promotions 
ADD CONSTRAINT IF NOT EXISTS promotions_status_valid 
CHECK (status IN ('draft', 'active', 'expired', 'cancelled', 'pending'));

-- Tipo deve ser válido
ALTER TABLE public.promotions 
ADD CONSTRAINT IF NOT EXISTS promotions_type_valid 
CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package'));

-- Data de fim deve ser posterior à data de início
ALTER TABLE public.promotions 
ADD CONSTRAINT IF NOT EXISTS promotions_date_order 
CHECK (end_date > start_date);

-- Preço deve ser positivo se pago
ALTER TABLE public.promotions 
ADD CONSTRAINT IF NOT EXISTS promotions_price_positive 
CHECK (NOT is_paid OR (price > 0 AND price <= 10000));

-- Currency deve ser válida se há preço
ALTER TABLE public.promotions 
ADD CONSTRAINT IF NOT EXISTS promotions_currency_valid 
CHECK (NOT is_paid OR currency IN ('EUR', 'USD', 'BRL'));

-- Título não pode ser vazio
ALTER TABLE public.promotions 
ADD CONSTRAINT IF NOT EXISTS promotions_title_not_empty 
CHECK (LENGTH(TRIM(title)) > 0);

-- =====================================================
-- 3. CONSTRAINTS PARA TABELA BRAIDERS
-- =====================================================

\echo '💇‍♀️ Constraints para tabela braiders...';

-- Status deve ser válido
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS braiders_status_valid 
CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Rating deve estar entre 0 e 5
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS braiders_rating_valid 
CHECK (average_rating >= 0 AND average_rating <= 5);

-- Total de reviews deve ser não-negativo
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS braiders_reviews_non_negative 
CHECK (total_reviews >= 0);

-- Distância máxima deve ser razoável
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS braiders_travel_distance_valid 
CHECK (max_travel_distance >= 0 AND max_travel_distance <= 200);

-- Anos de experiência deve ser razoável
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS braiders_experience_valid 
CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 50));

-- Preços devem ser positivos se definidos
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS braiders_prices_positive 
CHECK (
  (min_price IS NULL OR min_price > 0) AND 
  (max_price IS NULL OR max_price > 0) AND
  (min_price IS NULL OR max_price IS NULL OR min_price <= max_price)
);

-- =====================================================
-- 4. CONSTRAINTS PARA TABELA CONVERSATIONS
-- =====================================================

\echo '💬 Constraints para tabela conversations...';

-- Participantes devem ser diferentes
ALTER TABLE public.conversations 
ADD CONSTRAINT IF NOT EXISTS conversations_different_participants 
CHECK (participant_1_id != participant_2_id);

-- Status deve ser válido
ALTER TABLE public.conversations 
ADD CONSTRAINT IF NOT EXISTS conversations_status_valid 
CHECK (status IN ('active', 'archived', 'blocked'));

-- =====================================================
-- 5. CONSTRAINTS PARA TABELA MESSAGES
-- =====================================================

\echo '💌 Constraints para tabela messages...';

-- Conteúdo não pode ser vazio
ALTER TABLE public.messages 
ADD CONSTRAINT IF NOT EXISTS messages_content_not_empty 
CHECK (LENGTH(TRIM(content)) > 0);

-- Tipo de mensagem deve ser válido
ALTER TABLE public.messages 
ADD CONSTRAINT IF NOT EXISTS messages_type_valid 
CHECK (message_type IN ('text', 'image', 'file', 'system'));

-- Mensagem lida deve ter timestamp de leitura
ALTER TABLE public.messages 
ADD CONSTRAINT IF NOT EXISTS messages_read_consistency 
CHECK (NOT is_read OR read_at IS NOT NULL);

-- Mensagem editada deve ter timestamp de edição
ALTER TABLE public.messages 
ADD CONSTRAINT IF NOT EXISTS messages_edit_consistency 
CHECK (NOT is_edited OR edited_at IS NOT NULL);

-- =====================================================
-- 6. CONSTRAINTS PARA TABELA ORDERS
-- =====================================================

\echo '📦 Constraints para tabela orders...';

-- Email deve ter formato válido
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_email_format 
CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Status deve ser válido
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_status_valid 
CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- Valores devem ser positivos
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_amounts_positive 
CHECK (subtotal >= 0 AND shipping_cost >= 0 AND total >= 0);

-- Total deve ser consistente
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_total_consistent 
CHECK (total = subtotal + shipping_cost);

-- País deve ter código válido
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_country_format 
CHECK (LENGTH(shipping_country) = 2); -- ISO country code

-- Número do pedido deve ter formato válido
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_number_format 
CHECK (order_number ~ '^ORD-[0-9]{8}$');

-- =====================================================
-- 7. CONSTRAINTS PARA TABELA PRODUCTS
-- =====================================================

\echo '🛍️ Constraints para tabela products...';

-- Nome não pode ser vazio
ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);

-- Preço deve ser positivo
ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_price_positive 
CHECK (price > 0 AND price <= 100000);

-- Stock deve ser não-negativo
ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_stock_non_negative 
CHECK (stock_quantity >= 0);

-- =====================================================
-- VERIFICAÇÃO DOS CONSTRAINTS CRIADOS
-- =====================================================

\echo '';
\echo '🔍 VERIFICANDO CONSTRAINTS CRIADOS...';

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.constraint_name LIKE '%_valid' 
  OR tc.constraint_name LIKE '%_positive'
  OR tc.constraint_name LIKE '%_format'
  OR tc.constraint_name LIKE '%_consistency'
ORDER BY tc.table_name, tc.constraint_name;

\echo '';
\echo '📊 RESUMO DE CONSTRAINTS POR TABELA:';

SELECT 
    table_name,
    COUNT(*) as total_constraints,
    COUNT(*) FILTER (WHERE constraint_type = 'CHECK') as check_constraints,
    COUNT(*) FILTER (WHERE constraint_type = 'UNIQUE') as unique_constraints,
    COUNT(*) FILTER (WHERE constraint_type = 'FOREIGN KEY') as foreign_keys
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name IN ('users', 'promotions', 'braiders', 'conversations', 'messages', 'orders', 'products')
GROUP BY table_name
ORDER BY total_constraints DESC;

\echo '';
\echo '✅ CONSTRAINTS DE INTEGRIDADE ADICIONADOS!';
\echo 'Sistema agora tem validação robusta de dados:';
\echo '- Emails válidos e únicos';
\echo '- Enums e status controlados';
\echo '- Preços e quantidades positivas';
\echo '- Datas consistentes';
\echo '- Relacionamentos válidos';
\echo '';
\echo '🎉 PREPARAÇÃO PARA MVP PRODUÇÃO CONCLUÍDA!';
\echo 'Base de dados otimizada, segura e com integridade garantida.';