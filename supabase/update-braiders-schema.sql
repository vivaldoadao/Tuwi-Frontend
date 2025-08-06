-- 🔄 Atualização do Schema da Tabela Braiders
-- Adiciona campos faltantes do formulário de registro

-- Primeiro, criar types necessários para os novos campos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
        CREATE TYPE experience_level AS ENUM ('iniciante', '1-2', '3-5', '6-10', '10+');
    END IF;
END $$;

-- Adicionar novos campos à tabela braiders
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

-- Adicionar constraints para validação
ALTER TABLE public.braiders 
ADD CONSTRAINT check_at_least_one_service 
CHECK (serves_home = true OR serves_studio = true OR serves_salon = true);

ALTER TABLE public.braiders 
ADD CONSTRAINT check_salon_fields 
CHECK (
  (serves_salon = false OR (salon_name IS NOT NULL AND salon_address IS NOT NULL))
);

ALTER TABLE public.braiders 
ADD CONSTRAINT check_price_range 
CHECK (
  (min_price IS NULL AND max_price IS NULL) OR 
  (min_price IS NOT NULL AND max_price IS NOT NULL AND min_price <= max_price)
);

ALTER TABLE public.braiders 
ADD CONSTRAINT check_travel_distance 
CHECK (max_travel_distance > 0 AND max_travel_distance <= 200);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_braiders_district ON public.braiders(district);
CREATE INDEX IF NOT EXISTS idx_braiders_concelho ON public.braiders(concelho);
CREATE INDEX IF NOT EXISTS idx_braiders_services ON public.braiders(serves_home, serves_studio, serves_salon);
CREATE INDEX IF NOT EXISTS idx_braiders_specialties ON public.braiders USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_braiders_price_range ON public.braiders(min_price, max_price);

-- Comentários para documentação
COMMENT ON COLUMN public.braiders.whatsapp IS 'Número do WhatsApp da trancista';
COMMENT ON COLUMN public.braiders.instagram IS 'Handle do Instagram da trancista';
COMMENT ON COLUMN public.braiders.district IS 'Distrito de Portugal onde atua';
COMMENT ON COLUMN public.braiders.concelho IS 'Concelho onde atua';
COMMENT ON COLUMN public.braiders.freguesia IS 'Freguesia onde atua (opcional)';
COMMENT ON COLUMN public.braiders.address IS 'Endereço completo';
COMMENT ON COLUMN public.braiders.postal_code IS 'Código postal';
COMMENT ON COLUMN public.braiders.serves_home IS 'Oferece atendimento ao domicílio';
COMMENT ON COLUMN public.braiders.serves_studio IS 'Oferece atendimento no estúdio/casa';
COMMENT ON COLUMN public.braiders.serves_salon IS 'Oferece atendimento no salão';
COMMENT ON COLUMN public.braiders.max_travel_distance IS 'Distância máxima de deslocação em km';
COMMENT ON COLUMN public.braiders.salon_name IS 'Nome do salão (se aplicável)';
COMMENT ON COLUMN public.braiders.salon_address IS 'Endereço do salão (se aplicável)';
COMMENT ON COLUMN public.braiders.specialties IS 'Array das especialidades da trancista';
COMMENT ON COLUMN public.braiders.years_experience IS 'Anos de experiência';
COMMENT ON COLUMN public.braiders.certificates IS 'Certificações obtidas';
COMMENT ON COLUMN public.braiders.min_price IS 'Preço mínimo dos serviços em euros';
COMMENT ON COLUMN public.braiders.max_price IS 'Preço máximo dos serviços em euros';
COMMENT ON COLUMN public.braiders.weekly_availability IS 'Disponibilidade semanal em formato JSON';

-- Atualizar dados existentes (se houver) para não quebrar constraints
UPDATE public.braiders 
SET serves_studio = true 
WHERE serves_home IS NULL AND serves_studio IS NULL AND serves_salon IS NULL;

-- Função para validar formato do Instagram handle
CREATE OR REPLACE FUNCTION validate_instagram_handle(handle TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Aceita handles com ou sem @ no início
  -- Permite apenas letras, números, underscores e pontos
  RETURN handle IS NULL OR handle ~ '^@?[a-zA-Z0-9._]+$';
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraint para validar Instagram handle
ALTER TABLE public.braiders 
ADD CONSTRAINT check_instagram_format 
CHECK (validate_instagram_handle(instagram));

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

-- Adicionar constraint para validar WhatsApp
ALTER TABLE public.braiders 
ADD CONSTRAINT check_whatsapp_format 
CHECK (validate_portugal_phone(whatsapp));

-- Também validar o contact_phone existente
ALTER TABLE public.braiders 
ADD CONSTRAINT check_contact_phone_format 
CHECK (validate_portugal_phone(contact_phone));

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
    ELSE b.concelho || ', ' || b.district
  END as full_location,
  -- Verificar se tem pelo menos uma modalidade de atendimento
  (b.serves_home OR b.serves_studio OR b.serves_salon) as has_service_types,
  -- Calcular número de especialidades
  array_length(b.specialties, 1) as specialties_count
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id;

-- Adicionar políticas RLS para novos campos (mantém as existentes)
-- As políticas existentes já cobrem os novos campos por usarem SELECT/UPDATE *

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
    bc.serves_home,
    bc.serves_studio,
    bc.serves_salon,
    bc.max_travel_distance
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
    AND search_specialty = ANY(bc.specialties)
  ORDER BY bc.average_rating DESC, bc.total_reviews DESC;
END;
$$ LANGUAGE plpgsql;

-- Inserir dados de exemplo para testar (opcional)
-- Este bloco pode ser removido em produção
/*
-- Exemplo de dados para teste
INSERT INTO public.users (id, email, name, role) VALUES 
('12345678-1234-1234-1234-123456789012', 'ana.trancista@example.com', 'Ana Silva', 'braider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.braiders (
  user_id, bio, location, contact_phone, whatsapp, instagram,
  district, concelho, freguesia, address, postal_code,
  serves_home, serves_studio, serves_salon, max_travel_distance,
  specialties, years_experience, min_price, max_price,
  weekly_availability
) VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Especialista em tranças afro com mais de 5 anos de experiência.',
  'Lisboa, Portugal',
  '912345678',
  '912345678',
  'ana_trancas',
  'Lisboa',
  'Lisboa',
  'Santa Maria Maior',
  'Rua das Flores, 123',
  '1200-001',
  true,
  true,
  false,
  15,
  ARRAY['Box Braids', 'Tranças Nagô', 'Twist Afro'],
  '3-5',
  50.00,
  200.00,
  '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}'
) ON CONFLICT (user_id) DO NOTHING;
*/

-- Verificação final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;