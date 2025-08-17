-- 🌍 FASE 1: Adicionar Sistema de Coordenadas Geográficas
-- Data: 2025-08-16
-- Adiciona campos latitude/longitude e funções de cálculo de distância

\echo ''
\echo '🌍 FASE 1: Sistema de Coordenadas Geográficas'
\echo '=============================================='
\echo ''

-- ========================================
-- 1. ADICIONAR CAMPOS DE COORDENADAS
-- ========================================

\echo '📍 Adicionando campos latitude e longitude...'

-- Adicionar campos de coordenadas à tabela braiders
ALTER TABLE public.braiders
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

\echo '✅ Campos latitude e longitude adicionados'

-- ========================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

\echo '🔍 Criando índices para performance geográfica...'

-- Índice para buscas geográficas (latitude, longitude)
CREATE INDEX IF NOT EXISTS idx_braiders_coordinates 
ON public.braiders(latitude, longitude);

-- Índice para busca por coordenadas não nulas
CREATE INDEX IF NOT EXISTS idx_braiders_coordinates_not_null 
ON public.braiders(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

\echo '✅ Índices geográficos criados'

-- ========================================
-- 3. FUNÇÃO PARA CALCULAR DISTÂNCIA
-- ========================================

\echo '📏 Criando função de cálculo de distância (Haversine)...'

-- Função para calcular distância entre dois pontos usando fórmula de Haversine
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Raio da Terra em km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Verificar se as coordenadas são válidas
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Converter graus para radianos e calcular diferenças
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Aplicar fórmula de Haversine
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  -- Retornar distância em quilômetros (arredondada para 2 casas decimais)
  RETURN ROUND(earth_radius * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

\echo '✅ Função calculate_distance criada'

-- ========================================
-- 4. FUNÇÃO PARA BUSCAR BRAIDERS POR PROXIMIDADE
-- ========================================

\echo '🎯 Criando função de busca por proximidade...'

-- Função para buscar braiders próximos a uma coordenada
CREATE OR REPLACE FUNCTION search_braiders_nearby(
  user_lat DECIMAL,
  user_lon DECIMAL,
  max_distance_km DECIMAL DEFAULT 50,
  limit_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  location VARCHAR,
  district VARCHAR,
  concelho VARCHAR,
  freguesia VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  max_travel_distance INTEGER,
  average_rating DECIMAL,
  total_reviews INTEGER,
  serves_home BOOLEAN,
  serves_studio BOOLEAN,
  serves_salon BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    u.name::TEXT,
    b.bio,
    b.location,
    b.district,
    b.concelho,
    b.freguesia,
    b.latitude,
    b.longitude,
    calculate_distance(user_lat, user_lon, b.latitude, b.longitude) as distance_km,
    b.max_travel_distance,
    b.average_rating,
    b.total_reviews,
    b.serves_home,
    b.serves_studio,
    b.serves_salon
  FROM public.braiders b
  JOIN public.users u ON b.user_id = u.id
  WHERE b.status = 'approved'
    AND b.latitude IS NOT NULL 
    AND b.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, b.latitude, b.longitude) <= max_distance_km
  ORDER BY distance_km ASC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Função search_braiders_nearby criada'

-- ========================================
-- 5. FUNÇÃO PARA VERIFICAR SE BRAIDER ATENDE ÁREA
-- ========================================

\echo '✅ Criando função de verificação de cobertura...'

-- Função para verificar se braider atende em determinada localização
CREATE OR REPLACE FUNCTION braider_serves_location(
  braider_id UUID,
  client_lat DECIMAL,
  client_lon DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  braider_lat DECIMAL;
  braider_lon DECIMAL;
  max_distance INTEGER;
  actual_distance DECIMAL;
BEGIN
  -- Buscar dados do braider
  SELECT latitude, longitude, max_travel_distance
  INTO braider_lat, braider_lon, max_distance
  FROM public.braiders
  WHERE id = braider_id AND status = 'approved';
  
  -- Verificar se braider foi encontrado e tem coordenadas
  IF braider_lat IS NULL OR braider_lon IS NULL OR max_distance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular distância
  actual_distance := calculate_distance(braider_lat, braider_lon, client_lat, client_lon);
  
  -- Verificar se está dentro do raio de atendimento
  RETURN actual_distance <= max_distance;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Função braider_serves_location criada'

-- ========================================
-- 6. VIEW ATUALIZADA COM COORDENADAS
-- ========================================

\echo '👁️ Atualizando view braiders_complete...'

-- Atualizar view para incluir coordenadas e cálculos
CREATE OR REPLACE VIEW braiders_complete AS
SELECT 
  b.*,
  u.name,
  u.email,
  u.avatar_url,
  u.created_at as user_created_at,
  -- Concatenar localização completa
  CASE 
    WHEN b.freguesia IS NOT NULL THEN b.freguesia || ', ' || b.concelho || ', ' || b.district
    WHEN b.concelho IS NOT NULL THEN b.concelho || ', ' || b.district
    WHEN b.district IS NOT NULL THEN b.district
    ELSE b.location
  END as full_location,
  -- Verificar se tem pelo menos uma modalidade de atendimento
  (b.serves_home OR b.serves_studio OR b.serves_salon) as has_service_types,
  -- Calcular número de especialidades
  array_length(b.specialties, 1) as specialties_count,
  -- Verificar se tem coordenadas
  (b.latitude IS NOT NULL AND b.longitude IS NOT NULL) as has_coordinates,
  -- Status de geolocalização
  CASE 
    WHEN b.latitude IS NOT NULL AND b.longitude IS NOT NULL THEN 'geocoded'
    WHEN b.district IS NOT NULL THEN 'partial'
    ELSE 'missing'
  END as geo_status
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id;

\echo '✅ View braiders_complete atualizada'

-- ========================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON COLUMN public.braiders.latitude IS 'Latitude da localização da trancista (DECIMAL 10,8)';
COMMENT ON COLUMN public.braiders.longitude IS 'Longitude da localização da trancista (DECIMAL 11,8)';

COMMENT ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) IS 'Calcula distância entre dois pontos usando fórmula de Haversine';
COMMENT ON FUNCTION search_braiders_nearby(DECIMAL, DECIMAL, DECIMAL, INTEGER) IS 'Busca braiders próximos a uma coordenada dentro de um raio específico';
COMMENT ON FUNCTION braider_serves_location(UUID, DECIMAL, DECIMAL) IS 'Verifica se braider atende em determinada localização baseado no max_travel_distance';

-- ========================================
-- 8. VERIFICAÇÃO FINAL
-- ========================================

\echo ''
\echo '🔍 Verificando instalação...'

-- Verificar se campos foram adicionados
SELECT 
  'Campos adicionados' as check_type,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND column_name IN ('latitude', 'longitude');

-- Verificar se índices foram criados
SELECT 
  'Índices criados' as check_type,
  COUNT(*) as total_indices
FROM pg_indexes 
WHERE tablename = 'braiders' 
  AND indexname LIKE '%coordinates%';

-- Verificar se funções foram criadas
SELECT 
  'Funções criadas' as check_type,
  COUNT(*) as total_funcoes
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_distance',
    'search_braiders_nearby',
    'braider_serves_location'
  );

-- Testar função de distância com coordenadas de Lisboa
SELECT 
  'Teste de distância' as check_type,
  calculate_distance(38.7223, -9.1393, 38.7071, -9.1359) as distancia_km_lisboa;

\echo ''
\echo '✅ FASE 1 COMPLETA: Sistema de Coordenadas Geográficas instalado!'
\echo ''
\echo '📋 Próximos passos:'
\echo '  1. Geocodificar endereços existentes'
\echo '  2. Implementar API de busca por proximidade'
\echo '  3. Atualizar formulário de cadastro'
\echo '  4. Adicionar "buscar perto de mim" na UI'
\echo ''