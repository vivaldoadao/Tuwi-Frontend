-- 🔄 Atualização Segura do Schema da Tabela Braiders
-- Adiciona campos faltantes do formulário de registro com verificações

-- Primeiro, criar types necessários
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
        CREATE TYPE experience_level AS ENUM ('iniciante', '1-2', '3-5', '6-10', '10+');
    END IF;
END $$;

-- Função auxiliar para adicionar colunas se não existirem
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name text,
    column_name text,
    column_type text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = add_column_if_not_exists.table_name 
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', table_name, column_name, column_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Adicionar novos campos à tabela braiders
SELECT add_column_if_not_exists('braiders', 'whatsapp', 'VARCHAR');
SELECT add_column_if_not_exists('braiders', 'instagram', 'VARCHAR');
SELECT add_column_if_not_exists('braiders', 'district', 'VARCHAR');
SELECT add_column_if_not_exists('braiders', 'concelho', 'VARCHAR');
SELECT add_column_if_not_exists('braiders', 'freguesia', 'VARCHAR');
SELECT add_column_if_not_exists('braiders', 'address', 'TEXT');
SELECT add_column_if_not_exists('braiders', 'postal_code', 'VARCHAR(10)');
SELECT add_column_if_not_exists('braiders', 'serves_home', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('braiders', 'serves_studio', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('braiders', 'serves_salon', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('braiders', 'max_travel_distance', 'INTEGER DEFAULT 10');
SELECT add_column_if_not_exists('braiders', 'salon_name', 'VARCHAR');
SELECT add_column_if_not_exists('braiders', 'salon_address', 'TEXT');
SELECT add_column_if_not_exists('braiders', 'specialties', 'TEXT[] DEFAULT ''{}''');
SELECT add_column_if_not_exists('braiders', 'years_experience', 'experience_level');
SELECT add_column_if_not_exists('braiders', 'certificates', 'TEXT');
SELECT add_column_if_not_exists('braiders', 'min_price', 'DECIMAL(10,2)');
SELECT add_column_if_not_exists('braiders', 'max_price', 'DECIMAL(10,2)');
SELECT add_column_if_not_exists('braiders', 'weekly_availability', 'JSONB DEFAULT ''{"monday": false, "tuesday": false, "wednesday": false, "thursday": false, "friday": false, "saturday": false, "sunday": false}''');

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text);

-- Função auxiliar para adicionar constraints se não existirem
CREATE OR REPLACE FUNCTION add_constraint_if_not_exists(
    table_name text,
    constraint_name text,
    constraint_definition text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = add_constraint_if_not_exists.table_name 
        AND constraint_name = add_constraint_if_not_exists.constraint_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', table_name, constraint_name, constraint_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraints para validação
SELECT add_constraint_if_not_exists(
    'braiders',
    'check_at_least_one_service',
    'CHECK (serves_home = true OR serves_studio = true OR serves_salon = true)'
);

SELECT add_constraint_if_not_exists(
    'braiders',
    'check_salon_fields',
    'CHECK ((serves_salon = false OR (salon_name IS NOT NULL AND salon_address IS NOT NULL)))'
);

SELECT add_constraint_if_not_exists(
    'braiders',
    'check_price_range',
    'CHECK ((min_price IS NULL AND max_price IS NULL) OR (min_price IS NOT NULL AND max_price IS NOT NULL AND min_price <= max_price))'
);

SELECT add_constraint_if_not_exists(
    'braiders',
    'check_travel_distance',
    'CHECK (max_travel_distance > 0 AND max_travel_distance <= 200)'
);

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS add_constraint_if_not_exists(text, text, text);

-- Função para validar formato do Instagram handle
CREATE OR REPLACE FUNCTION validate_instagram_handle(handle TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Aceita handles com ou sem @ no início
  -- Permite apenas letras, números, underscores e pontos
  RETURN handle IS NULL OR handle ~ '^@?[a-zA-Z0-9._]+$';
END;
$$ LANGUAGE plpgsql;

-- Função para validar formato do WhatsApp (Portugal)
CREATE OR REPLACE FUNCTION validate_portugal_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Formatos aceitos:
  -- +351 91X XXX XXX, +351 92X XXX XXX, +351 93X XXX XXX, +351 96X XXX XXX
  -- 91X XXX XXX, 92X XXX XXX, 93X XXX XXX, 96X XXX XXX
  -- Com ou sem espaços
  RETURN phone IS NULL OR 
         phone ~ '^\+?351\s?(9[1236])\s?\d{3}\s?\d{3}$' OR
         phone ~ '^(9[1236])\s?\d{3}\s?\d{3}$';
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraints de validação de formato (com verificação)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'braiders' 
        AND constraint_name = 'check_instagram_format'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_instagram_format 
        CHECK (validate_instagram_handle(instagram));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'braiders' 
        AND constraint_name = 'check_whatsapp_format'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_whatsapp_format 
        CHECK (validate_portugal_phone(whatsapp));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'braiders' 
        AND constraint_name = 'check_contact_phone_format'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_contact_phone_format 
        CHECK (validate_portugal_phone(contact_phone));
    END IF;
END $$;

-- Criar índices se não existirem
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

-- Atualizar dados existentes para não quebrar constraints
UPDATE public.braiders 
SET serves_studio = true 
WHERE (serves_home IS NULL OR serves_home = false) 
  AND (serves_studio IS NULL OR serves_studio = false) 
  AND (serves_salon IS NULL OR serves_salon = false);

-- View para facilitar consultas com dados completos da trancista
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

-- Função para buscar trancistas por localização
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

-- Função para buscar trancistas por especialidade
CREATE OR REPLACE FUNCTION search_braiders_by_specialty(
  search_specialty TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  full_location TEXT,
  specialties TEXT[],
  min_price DECIMAL,
  max_price DECIMAL,
  average_rating DECIMAL,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.name::TEXT,
    bc.bio,
    bc.full_location::TEXT,
    bc.specialties,
    bc.min_price,
    bc.max_price,
    bc.average_rating,
    bc.total_reviews
  FROM braiders_complete bc
  WHERE bc.status = 'approved'
    AND bc.specialties IS NOT NULL
    AND search_specialty = ANY(bc.specialties)
  ORDER BY bc.average_rating DESC, bc.total_reviews DESC;
END;
$$ LANGUAGE plpgsql;

-- Adicionar comentários para documentação
DO $$
BEGIN
  -- Só adiciona comentários se a coluna existir
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'whatsapp') THEN
    EXECUTE 'COMMENT ON COLUMN public.braiders.whatsapp IS ''Número do WhatsApp da trancista''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'instagram') THEN
    EXECUTE 'COMMENT ON COLUMN public.braiders.instagram IS ''Handle do Instagram da trancista''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'district') THEN
    EXECUTE 'COMMENT ON COLUMN public.braiders.district IS ''Distrito de Portugal onde atua''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'serves_salon') THEN
    EXECUTE 'COMMENT ON COLUMN public.braiders.serves_salon IS ''Oferece atendimento no salão''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'specialties') THEN
    EXECUTE 'COMMENT ON COLUMN public.braiders.specialties IS ''Array das especialidades da trancista''';
  END IF;
END $$;

-- Verificação final
SELECT 
  'Schema atualizado com sucesso!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND table_schema = 'public';