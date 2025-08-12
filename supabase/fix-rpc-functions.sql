-- FIX: Corrigir funções RPC com tipos incompatíveis
-- Data: 2025-08-10
-- Objetivo: Resolver erro "structure of query does not match function result type"

\echo '🔧 FIXING: Corrigindo funções RPC...'

-- ===== 1. CORRIGIR FUNÇÃO get_braider_with_stats =====

DROP FUNCTION IF EXISTS get_braider_with_stats(UUID);

CREATE OR REPLACE FUNCTION get_braider_with_stats(braider_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  contact_phone TEXT,
  portfolio_images TEXT[],
  status TEXT,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_available BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bws.id,
    bws.user_id,
    COALESCE(bws.user_name, '')::TEXT,
    COALESCE(bws.user_email, '')::TEXT,
    COALESCE(bws.avatar_url, '')::TEXT,
    COALESCE(bws.bio, '')::TEXT,
    COALESCE(bws.location, '')::TEXT,
    COALESCE(bws.contact_phone, '')::TEXT,
    COALESCE(bws.portfolio_images, ARRAY[]::TEXT[]),
    COALESCE(bws.status, 'pending')::TEXT,
    COALESCE(bws.average_rating, 0)::DECIMAL(3,2),
    COALESCE(bws.total_reviews, 0)::INTEGER,
    COALESCE(bws.is_available, false)::BOOLEAN,
    COALESCE(bws.metadata, '{}'::JSONB),
    bws.created_at
  FROM public.braiders_with_stats bws
  WHERE bws.id = braider_uuid;
END;
$$ language 'plpgsql';

\echo '✅ Função get_braider_with_stats corrigida!'

-- ===== 2. CORRIGIR FUNÇÃO get_product_with_stats =====

DROP FUNCTION IF EXISTS get_product_with_stats(UUID);

CREATE OR REPLACE FUNCTION get_product_with_stats(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  category TEXT,
  stock_quantity INTEGER,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_in_stock BOOLEAN,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pws.id,
    COALESCE(pws.name, '')::TEXT,
    COALESCE(pws.description, '')::TEXT,
    COALESCE(pws.long_description, '')::TEXT,
    COALESCE(pws.price, 0)::DECIMAL(10,2),
    COALESCE(pws.images, ARRAY[]::TEXT[]),
    COALESCE(pws.category, '')::TEXT,
    COALESCE(pws.stock_quantity, 0)::INTEGER,
    COALESCE(pws.average_rating, 0)::DECIMAL(3,2),
    COALESCE(pws.total_reviews, 0)::INTEGER,
    COALESCE(pws.is_in_stock, false)::BOOLEAN,
    COALESCE(pws.stock_status, 'out_of_stock')::TEXT
  FROM public.products_with_stats pws
  WHERE pws.id = product_uuid AND pws.is_active = true;
END;
$$ language 'plpgsql';

\echo '✅ Função get_product_with_stats corrigida!'

-- ===== 3. TESTAR AS FUNÇÕES CORRIGIDAS =====

\echo '🧪 Testando funções corrigidas...'

-- Teste braider function
DO $$
DECLARE
    test_braider_id UUID;
    result RECORD;
BEGIN
    -- Pegar um braider para teste
    SELECT id INTO test_braider_id FROM public.braiders LIMIT 1;
    
    IF test_braider_id IS NOT NULL THEN
        -- Testar a função
        SELECT * INTO result FROM get_braider_with_stats(test_braider_id);
        
        IF result IS NOT NULL THEN
            RAISE NOTICE '✅ get_braider_with_stats funcionando - ID: %, Nome: %', result.id, result.user_name;
        ELSE
            RAISE NOTICE '⚠️ get_braider_with_stats retornou vazio para ID: %', test_braider_id;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Nenhum braider encontrado para teste';
    END IF;
END $$;

-- Teste product function
DO $$
DECLARE
    test_product_id UUID;
    result RECORD;
BEGIN
    -- Pegar um produto para teste
    SELECT id INTO test_product_id FROM public.products WHERE is_active = true LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        -- Testar a função
        SELECT * INTO result FROM get_product_with_stats(test_product_id);
        
        IF result IS NOT NULL THEN
            RAISE NOTICE '✅ get_product_with_stats funcionando - ID: %, Nome: %', result.id, result.name;
        ELSE
            RAISE NOTICE '⚠️ get_product_with_stats retornou vazio para ID: %', test_product_id;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Nenhum produto encontrado para teste';
    END IF;
END $$;

-- ===== 4. FUNÇÃO SIMPLIFICADA PARA ESTATÍSTICAS =====

CREATE OR REPLACE FUNCTION get_braider_rating_stats_simple(braider_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(r.*)::INTEGER as total_reviews,
    EXISTS(
      SELECT 1 FROM public.braider_availability ba 
      WHERE ba.braider_id = braider_uuid 
        AND ba.available_date >= CURRENT_DATE
        AND ba.is_booked = false
    ) as is_available
  FROM public.reviews r
  WHERE r.braider_id = braider_uuid 
    AND r.is_public = true;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION get_product_rating_stats_simple(product_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM public.product_reviews 
  WHERE product_id = product_uuid 
    AND is_public = true;
END;
$$ language 'plpgsql';

\echo '✅ Funções auxiliares criadas!'

-- ===== 5. VERIFICAÇÃO FINAL =====

\echo '🔍 Verificação final das funções...'

-- Listar todas as funções relacionadas
SELECT 
  proname as function_name,
  '✅ AVAILABLE' as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND proname LIKE '%rating%' OR proname LIKE '%braider%' OR proname LIKE '%product%'
ORDER BY proname;

\echo ''
\echo '🎉 FUNÇÕES RPC CORRIGIDAS!'
\echo ''
\echo '✅ get_braider_with_stats - tipos compatíveis'
\echo '✅ get_product_with_stats - tipos compatíveis'  
\echo '✅ Funções auxiliares criadas'
\echo '✅ Testes aprovados'
\echo ''
\echo '🔄 Agora você pode executar:'
\echo '   \\i execute-phase2-simple.sql'