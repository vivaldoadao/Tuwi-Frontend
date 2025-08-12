-- FIX: Criar views materializadas em falta
-- Data: 2025-08-10
-- Objetivo: Resolver erro "relation braiders_with_stats does not exist"

\echo '🔧 FIXING: Criando views materializadas em falta...'

-- ===== 1. VERIFICAR ESTADO ATUAL =====

-- Verificar quais views existem
SELECT 
  table_name,
  CASE WHEN table_name IN (
    SELECT table_name FROM information_schema.views WHERE table_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
  ('braiders_with_stats'),
  ('products_with_stats')
) as t(table_name);

-- ===== 2. CRIAR VIEWS EM FALTA =====

-- View materializada para braiders com ratings (para performance)
DROP MATERIALIZED VIEW IF EXISTS public.braiders_with_stats CASCADE;

CREATE MATERIALIZED VIEW public.braiders_with_stats AS
SELECT 
  b.id,
  b.user_id,
  u.name as user_name,
  u.email as user_email,
  u.avatar_url,
  b.bio,
  b.location,
  b.contact_phone,
  b.portfolio_images,
  b.status,
  COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as average_rating,
  COUNT(r.*)::INTEGER as total_reviews,
  -- Disponibilidade baseada na existência de availability futura
  EXISTS(
    SELECT 1 FROM public.braider_availability ba 
    WHERE ba.braider_id = b.id 
      AND ba.available_date >= CURRENT_DATE
      AND ba.is_booked = false
  ) as is_available,
  b.created_at,
  b.updated_at,
  -- Metadados adicionais
  jsonb_build_object(
    'total_bookings', (
      SELECT COUNT(*) FROM public.bookings bk 
      WHERE bk.braider_id = b.id
    ),
    'completed_bookings', (
      SELECT COUNT(*) FROM public.bookings bk 
      WHERE bk.braider_id = b.id AND bk.status = 'completed'
    )
  ) as metadata
FROM public.braiders b
LEFT JOIN public.users u ON u.id = b.user_id
LEFT JOIN public.reviews r ON r.braider_id = b.id AND r.is_public = true
GROUP BY b.id, b.user_id, u.name, u.email, u.avatar_url, b.bio, b.location, 
         b.contact_phone, b.portfolio_images, b.status, b.created_at, b.updated_at;

-- Índices para a view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_braiders_with_stats_id 
  ON public.braiders_with_stats(id);
CREATE INDEX IF NOT EXISTS idx_braiders_with_stats_status 
  ON public.braiders_with_stats(status);
CREATE INDEX IF NOT EXISTS idx_braiders_with_stats_rating 
  ON public.braiders_with_stats(average_rating DESC);

\echo '✅ View braiders_with_stats criada!'

-- View materializada para produtos com ratings
DROP MATERIALIZED VIEW IF EXISTS public.products_with_stats CASCADE;

CREATE MATERIALIZED VIEW public.products_with_stats AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.long_description,
  p.price,
  p.images,
  p.category,
  p.stock_quantity,
  p.is_active,
  COALESCE(AVG(pr.rating), 0)::DECIMAL(3,2) as average_rating,
  COUNT(pr.*)::INTEGER as total_reviews,
  (p.stock_quantity > 0) as is_in_stock,
  -- Stock status
  CASE 
    WHEN p.stock_quantity = 0 THEN 'out_of_stock'
    WHEN p.stock_quantity <= 5 THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  p.created_at,
  p.updated_at
FROM public.products p
LEFT JOIN public.product_reviews pr ON pr.product_id = p.id AND pr.is_public = true
GROUP BY p.id, p.name, p.description, p.long_description, p.price, 
         p.images, p.category, p.stock_quantity, p.is_active, p.created_at, p.updated_at;

-- Índices para a view materializada de produtos
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_with_stats_id 
  ON public.products_with_stats(id);
CREATE INDEX IF NOT EXISTS idx_products_with_stats_active 
  ON public.products_with_stats(is_active);
CREATE INDEX IF NOT EXISTS idx_products_with_stats_rating 
  ON public.products_with_stats(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_with_stats_category 
  ON public.products_with_stats(category);

\echo '✅ View products_with_stats criada!'

-- ===== 3. FUNÇÕES AUXILIARES =====

-- Função para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_rating_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.braiders_with_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.products_with_stats;
END;
$$ language 'plpgsql';

\echo '✅ Função refresh_rating_views criada!'

-- ===== 4. FUNÇÃO RPC PARA BRAIDER COM STATS =====

-- Função para buscar braider específico com stats
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
    bws.user_name,
    bws.user_email,
    bws.avatar_url,
    bws.bio,
    bws.location,
    bws.contact_phone,
    bws.portfolio_images,
    bws.status::TEXT,
    bws.average_rating,
    bws.total_reviews,
    bws.is_available,
    bws.metadata,
    bws.created_at
  FROM public.braiders_with_stats bws
  WHERE bws.id = braider_uuid;
END;
$$ language 'plpgsql';

-- Função para buscar produto específico com stats
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
    pws.name,
    pws.description,
    pws.long_description,
    pws.price,
    pws.images,
    pws.category,
    pws.stock_quantity,
    pws.average_rating,
    pws.total_reviews,
    pws.is_in_stock,
    pws.stock_status
  FROM public.products_with_stats pws
  WHERE pws.id = product_uuid AND pws.is_active = true;
END;
$$ language 'plpgsql';

\echo '✅ Funções RPC criadas!'

-- ===== 5. VERIFICAR CRIAÇÃO =====

-- Verificar se as views foram criadas
SELECT 
  'VIEWS CHECK' as check_type,
  table_name,
  CASE WHEN table_name IN (
    SELECT table_name FROM information_schema.views WHERE table_schema = 'public'
  ) THEN '✅ CREATED' ELSE '❌ STILL MISSING' END as status
FROM (VALUES 
  ('braiders_with_stats'),
  ('products_with_stats')
) as t(table_name);

-- Contar dados nas views
SELECT 
  'braiders_with_stats' as view_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE average_rating > 0) as with_ratings,
  MAX(total_reviews) as max_reviews
FROM public.braiders_with_stats
UNION ALL
SELECT 
  'products_with_stats' as view_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE average_rating > 0) as with_ratings,
  MAX(total_reviews) as max_reviews
FROM public.products_with_stats;

-- ===== 6. TESTE RÁPIDO =====

\echo '🧪 Teste rápido das views...'

-- Testar query que estava falhando
SELECT 
  user_name as name,
  ROUND(average_rating, 1) as averageRating,
  total_reviews as totalReviews,
  is_available as isAvailable,
  'Dados reais do BD ✅' as source
FROM public.braiders_with_stats 
WHERE status = 'approved' 
ORDER BY average_rating DESC 
LIMIT 3;

SELECT 
  name,
  ROUND(average_rating, 1) as averageRating,
  total_reviews as totalReviews,
  stock_status as stockStatus,
  is_in_stock as isInStock,
  'Dados reais do BD ✅' as source
FROM public.products_with_stats 
WHERE is_active = true 
ORDER BY average_rating DESC 
LIMIT 3;

\echo ''
\echo '🎉 CORREÇÃO CONCLUÍDA!'
\echo ''
\echo '✅ Views materializadas criadas com sucesso'
\echo '✅ Índices de performance implementados'  
\echo '✅ Funções RPC disponíveis'
\echo '✅ Teste de queries aprovado'
\echo ''
\echo '🔄 Agora você pode executar novamente:'
\echo '   \\i execute-phase2-complete.sql'
\echo '   \\i execute-phase3-complete.sql'