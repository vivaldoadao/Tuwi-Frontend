-- FASE 2: Funções para migração de ratings
-- Data: 2025-08-10
-- Objetivo: Funções para substituir dados mock de ratings por dados reais

-- ===== 1. HELPER FUNCTIONS PARA BRAIDER RATINGS =====

-- Função para obter estatísticas de rating de um braider
CREATE OR REPLACE FUNCTION get_braider_rating_stats(braider_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_available BOOLEAN,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(r.*)::INTEGER as total_reviews,
    -- Disponibilidade baseada na existência de availability futura
    EXISTS(
      SELECT 1 FROM public.braider_availability ba 
      WHERE ba.braider_id = braider_uuid 
        AND ba.available_date >= CURRENT_DATE
        AND ba.is_booked = false
    ) as is_available,
    COALESCE(
      jsonb_object_agg(
        r.rating::TEXT, 
        review_count
      ) FILTER (WHERE r.rating IS NOT NULL),
      '{}'::jsonb
    ) as rating_distribution
  FROM public.reviews r
  WHERE r.braider_id = braider_uuid 
    AND r.is_public = true
  GROUP BY braider_uuid;
END;
$$ language 'plpgsql';

-- Função para obter todos os braiders com ratings reais
CREATE OR REPLACE FUNCTION get_braiders_with_ratings(
  status_filter TEXT DEFAULT 'approved'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  bio TEXT,
  location TEXT,
  contact_phone TEXT,
  portfolio_images TEXT[],
  status TEXT,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_available BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    u.name as user_name,
    u.email as user_email,
    b.bio,
    b.location,
    b.contact_phone,
    b.portfolio_images,
    b.status::TEXT,
    -- Rating calculado em tempo real
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(r.*)::INTEGER as total_reviews,
    -- Disponibilidade baseada na existência de availability futura
    EXISTS(
      SELECT 1 FROM public.braider_availability ba 
      WHERE ba.braider_id = b.id 
        AND ba.available_date >= CURRENT_DATE
        AND ba.is_booked = false
    ) as is_available,
    b.created_at
  FROM public.braiders b
  LEFT JOIN public.users u ON u.id = b.user_id
  LEFT JOIN public.reviews r ON r.braider_id = b.id AND r.is_public = true
  WHERE (status_filter IS NULL OR b.status = status_filter::braider_status)
  GROUP BY b.id, b.user_id, u.name, u.email, b.bio, b.location, 
           b.contact_phone, b.portfolio_images, b.status, b.created_at
  ORDER BY b.created_at DESC;
END;
$$ language 'plpgsql';

-- ===== 2. HELPER FUNCTIONS PARA PRODUCT RATINGS =====

-- Função já criada na fase 1, vamos apenas melhorar
CREATE OR REPLACE FUNCTION get_product_rating_stats(product_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  rating_distribution JSONB,
  verified_reviews INTEGER,
  helpful_votes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(*)::INTEGER as total_reviews,
    COALESCE(
      jsonb_object_agg(
        rating::TEXT, 
        review_count
      ) FILTER (WHERE rating IS NOT NULL),
      '{}'::jsonb
    ) as rating_distribution,
    COUNT(*) FILTER (WHERE is_verified = true)::INTEGER as verified_reviews,
    COALESCE(SUM(helpful_count), 0)::INTEGER as helpful_votes
  FROM (
    SELECT 
      rating,
      COUNT(*) as review_count,
      is_verified,
      helpful_count
    FROM public.product_reviews 
    WHERE product_id = product_uuid 
      AND is_public = true
    GROUP BY rating, is_verified, helpful_count
  ) review_data;
END;
$$ language 'plpgsql';

-- Função para obter produtos com ratings reais
CREATE OR REPLACE FUNCTION get_products_with_ratings()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  category TEXT,
  stock_quantity INTEGER,
  is_active BOOLEAN,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_in_stock BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
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
    -- Rating calculado em tempo real
    COALESCE(AVG(pr.rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(pr.*)::INTEGER as total_reviews,
    (p.stock_quantity > 0) as is_in_stock,
    p.created_at
  FROM public.products p
  LEFT JOIN public.product_reviews pr ON pr.product_id = p.id AND pr.is_public = true
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.description, p.long_description, p.price, 
           p.images, p.category, p.stock_quantity, p.is_active, p.created_at
  ORDER BY p.created_at DESC;
END;
$$ language 'plpgsql';

-- ===== 3. VIEWS PARA PERFORMANCE =====

-- View materializada para braiders com ratings (para performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.braiders_with_stats AS
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

-- View materializada para produtos com ratings
CREATE MATERIALIZED VIEW IF NOT EXISTS public.products_with_stats AS
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

-- ===== 4. FUNÇÕES PARA REFRESH DAS VIEWS =====

-- Função para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_rating_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.braiders_with_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.products_with_stats;
END;
$$ language 'plpgsql';

-- ===== 5. TRIGGERS PARA AUTO-REFRESH =====

-- Trigger para refresh automático quando reviews são alteradas
CREATE OR REPLACE FUNCTION trigger_refresh_braider_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh apenas se for review pública
  IF (TG_OP = 'DELETE') OR OLD.is_public OR NEW.is_public THEN
    PERFORM refresh_rating_views();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Aplicar trigger
DROP TRIGGER IF EXISTS refresh_braider_stats_trigger ON public.reviews;
CREATE TRIGGER refresh_braider_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_braider_stats();

-- Trigger similar para product_reviews
CREATE OR REPLACE FUNCTION trigger_refresh_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') OR OLD.is_public OR NEW.is_public THEN
    PERFORM refresh_rating_views();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS refresh_product_stats_trigger ON public.product_reviews;
CREATE TRIGGER refresh_product_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_product_stats();

-- ===== 6. FUNÇÕES DE CONVENIÊNCIA PARA API =====

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

-- ===== 7. INICIALIZAÇÃO =====

-- Refresh inicial das views
SELECT refresh_rating_views();

-- Comentários para documentação
COMMENT ON FUNCTION get_braider_rating_stats IS 'Obter estatísticas de rating de um braider específico';
COMMENT ON FUNCTION get_product_rating_stats IS 'Obter estatísticas de rating de um produto específico';
COMMENT ON MATERIALIZED VIEW public.braiders_with_stats IS 'View materializada com braiders e suas estatísticas de rating';
COMMENT ON MATERIALIZED VIEW public.products_with_stats IS 'View materializada com produtos e suas estatísticas de rating';