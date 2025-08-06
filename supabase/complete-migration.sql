-- 🔄 Migração Completa do Schema Braiders
-- Execute este script completo no SQL Editor do Supabase

-- PASSO 1: Criar o tipo enum para experiência
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
        CREATE TYPE experience_level AS ENUM ('iniciante', '1-2', '3-5', '6-10', '10+');
    END IF;
END $$;

-- PASSO 2: Adicionar todas as colunas necessárias
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR,
ADD COLUMN IF NOT EXISTS instagram VARCHAR,
ADD COLUMN IF NOT EXISTS district VARCHAR,
ADD COLUMN IF NOT EXISTS concelho VARCHAR,
ADD COLUMN IF NOT EXISTS freguesia VARCHAR,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS serves_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serves_studio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serves_salon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_travel_distance INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS salon_name VARCHAR,
ADD COLUMN IF NOT EXISTS salon_address TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years_experience experience_level,
ADD COLUMN IF NOT EXISTS certificates TEXT,
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS weekly_availability JSONB DEFAULT '{"monday": false, "tuesday": false, "wednesday": false, "thursday": false, "friday": false, "saturday": false, "sunday": false}';

-- PASSO 3: Corrigir dados existentes ANTES de adicionar constraints
UPDATE public.braiders 
SET serves_studio = true 
WHERE COALESCE(serves_home, false) = false 
  AND COALESCE(serves_studio, false) = false 
  AND COALESCE(serves_salon, false) = false;

-- PASSO 4: Adicionar constraints (agora que os dados estão corretos)
DO $$
BEGIN
    -- Constraint: pelo menos uma modalidade de atendimento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_at_least_one_service'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_at_least_one_service 
        CHECK (serves_home = true OR serves_studio = true OR serves_salon = true);
    END IF;

    -- Constraint: se serves_salon = true, deve ter salon_name e salon_address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_salon_fields'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_salon_fields 
        CHECK (serves_salon = false OR (salon_name IS NOT NULL AND salon_address IS NOT NULL));
    END IF;

    -- Constraint: validação de faixa de preços
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_price_range'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_price_range 
        CHECK ((min_price IS NULL AND max_price IS NULL) OR 
               (min_price IS NOT NULL AND max_price IS NOT NULL AND min_price <= max_price));
    END IF;

    -- Constraint: distância de viagem válida
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_travel_distance'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_travel_distance 
        CHECK (max_travel_distance > 0 AND max_travel_distance <= 200);
    END IF;
END $$;

-- PASSO 5: Criar índices para performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_braiders_district') THEN
        CREATE INDEX idx_braiders_district ON public.braiders(district);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_braiders_concelho') THEN
        CREATE INDEX idx_braiders_concelho ON public.braiders(concelho);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_braiders_services') THEN
        CREATE INDEX idx_braiders_services ON public.braiders(serves_home, serves_studio, serves_salon);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_braiders_specialties') THEN
        CREATE INDEX idx_braiders_specialties ON public.braiders USING GIN(specialties);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_braiders_price_range') THEN
        CREATE INDEX idx_braiders_price_range ON public.braiders(min_price, max_price);
    END IF;
END $$;

-- PASSO 6: Criar view para consultas facilitadas
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
    WHEN b.concelho IS NOT NULL AND b.district IS NOT NULL THEN b.concelho || ', ' || b.district
    ELSE b.location
  END as full_location,
  -- Verificar se tem pelo menos uma modalidade de atendimento
  (COALESCE(b.serves_home, false) OR COALESCE(b.serves_studio, false) OR COALESCE(b.serves_salon, false)) as has_service_types,
  -- Calcular número de especialidades
  COALESCE(array_length(b.specialties, 1), 0) as specialties_count
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id;

-- PASSO 7: Funções de busca
CREATE OR REPLACE FUNCTION search_braiders_by_location(
  search_district TEXT DEFAULT NULL,
  search_concelho TEXT DEFAULT NULL,
  search_freguesia TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  location VARCHAR,
  full_location TEXT,
  specialties TEXT[],
  min_price DECIMAL,
  max_price DECIMAL,
  average_rating DECIMAL,
  total_reviews INTEGER,
  serves_home BOOLEAN,
  serves_studio BOOLEAN,
  serves_salon BOOLEAN,
  max_travel_distance INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.name::TEXT,
    bc.bio,
    bc.location,
    bc.full_location::TEXT,
    bc.specialties,
    bc.min_price,
    bc.max_price,
    bc.average_rating,
    bc.total_reviews,
    COALESCE(bc.serves_home, false),
    COALESCE(bc.serves_studio, false),
    COALESCE(bc.serves_salon, false),
    COALESCE(bc.max_travel_distance, 10)
  FROM braiders_complete bc
  WHERE bc.status = 'approved'
    AND (search_district IS NULL OR bc.district ILIKE '%' || search_district || '%')
    AND (search_concelho IS NULL OR bc.concelho ILIKE '%' || search_concelho || '%')
    AND (search_freguesia IS NULL OR bc.freguesia ILIKE '%' || search_freguesia || '%')
  ORDER BY bc.average_rating DESC, bc.total_reviews DESC;
END;
$$ LANGUAGE plpgsql;

-- VERIFICAÇÃO FINAL
SELECT 
  '🎉 Migração concluída com sucesso!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'braiders' AND table_schema = 'public';

-- Mostrar resumo dos dados
SELECT 
  'Resumo dos dados:' as info,
  COUNT(*) as total_braiders,
  COUNT(CASE WHEN serves_home = true THEN 1 END) as serves_home,
  COUNT(CASE WHEN serves_studio = true THEN 1 END) as serves_studio,
  COUNT(CASE WHEN serves_salon = true THEN 1 END) as serves_salon
FROM public.braiders;