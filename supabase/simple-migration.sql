-- 🔄 Migração Simples - Schema Braiders
-- Execute este script bloco por bloco no SQL Editor

-- BLOCO 1: Criar tipo enum (se não existir)
CREATE TYPE experience_level AS ENUM ('iniciante', '1-2', '3-5', '6-10', '10+');

-- BLOCO 2: Adicionar todas as colunas
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS name VARCHAR,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR,
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR,
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

-- BLOCO 3: Corrigir dados existentes
UPDATE public.braiders 
SET serves_studio = true 
WHERE COALESCE(serves_home, false) = false 
  AND COALESCE(serves_studio, false) = false 
  AND COALESCE(serves_salon, false) = false;

-- BLOCO 4: Adicionar constraint principal
ALTER TABLE public.braiders 
ADD CONSTRAINT check_at_least_one_service 
CHECK (serves_home = true OR serves_studio = true OR serves_salon = true);

-- BLOCO 5: Adicionar outros constraints
ALTER TABLE public.braiders 
ADD CONSTRAINT check_salon_fields 
CHECK (serves_salon = false OR (salon_name IS NOT NULL AND salon_address IS NOT NULL));

ALTER TABLE public.braiders 
ADD CONSTRAINT check_price_range 
CHECK ((min_price IS NULL AND max_price IS NULL) OR 
       (min_price IS NOT NULL AND max_price IS NOT NULL AND min_price <= max_price));

ALTER TABLE public.braiders 
ADD CONSTRAINT check_travel_distance 
CHECK (max_travel_distance > 0 AND max_travel_distance <= 200);

-- BLOCO 6: Criar índices
CREATE INDEX IF NOT EXISTS idx_braiders_district ON public.braiders(district);
CREATE INDEX IF NOT EXISTS idx_braiders_concelho ON public.braiders(concelho);
CREATE INDEX IF NOT EXISTS idx_braiders_services ON public.braiders(serves_home, serves_studio, serves_salon);
CREATE INDEX IF NOT EXISTS idx_braiders_specialties ON public.braiders USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_braiders_price_range ON public.braiders(min_price, max_price);

-- BLOCO 7: Verificação final
SELECT 
  'Migração concluída!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'braiders' AND table_schema = 'public';