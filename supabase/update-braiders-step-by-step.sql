-- 🔄 Atualização do Schema - Passo a Passo
-- Execute este script linha por linha ou em blocos no SQL Editor do Supabase

-- PASSO 1: Criar o tipo enum para experiência
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
        CREATE TYPE experience_level AS ENUM ('iniciante', '1-2', '3-5', '6-10', '10+');
    END IF;
END $$;

-- PASSO 2: Adicionar colunas básicas (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR,
ADD COLUMN IF NOT EXISTS instagram VARCHAR,
ADD COLUMN IF NOT EXISTS district VARCHAR,
ADD COLUMN IF NOT EXISTS concelho VARCHAR,
ADD COLUMN IF NOT EXISTS freguesia VARCHAR;

-- PASSO 3: Adicionar colunas de endereço (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- PASSO 4: Adicionar colunas de modalidades de atendimento (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS serves_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serves_studio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serves_salon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_travel_distance INTEGER DEFAULT 10;

-- PASSO 5: Adicionar colunas do salão (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS salon_name VARCHAR,
ADD COLUMN IF NOT EXISTS salon_address TEXT;

-- PASSO 6: Adicionar colunas profissionais (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years_experience experience_level,
ADD COLUMN IF NOT EXISTS certificates TEXT;

-- PASSO 7: Adicionar colunas de preço (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2);

-- PASSO 8: Adicionar disponibilidade semanal (execute este bloco completo)
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS weekly_availability JSONB DEFAULT '{"monday": false, "tuesday": false, "wednesday": false, "thursday": false, "friday": false, "saturday": false, "sunday": false}';

-- PASSO 9: Atualizar dados existentes para não quebrar constraints
UPDATE public.braiders 
SET serves_studio = true 
WHERE serves_home IS NULL 
   AND serves_studio IS NULL 
   AND serves_salon IS NULL;

-- PASSO 10: Adicionar constraint básica (pelo menos um tipo de atendimento)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_at_least_one_service'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_at_least_one_service 
        CHECK (serves_home = true OR serves_studio = true OR serves_salon = true);
    END IF;
END $$;

-- PASSO 11: Adicionar constraint para campos do salão
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_salon_fields'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_salon_fields 
        CHECK (serves_salon = false OR (salon_name IS NOT NULL AND salon_address IS NOT NULL));
    END IF;
END $$;

-- PASSO 12: Adicionar constraint para faixa de preços
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'braiders' AND constraint_name = 'check_price_range'
    ) THEN
        ALTER TABLE public.braiders 
        ADD CONSTRAINT check_price_range 
        CHECK ((min_price IS NULL AND max_price IS NULL) OR 
               (min_price IS NOT NULL AND max_price IS NOT NULL AND min_price <= max_price));
    END IF;
END $$;

-- PASSO 13: Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_braiders_district ON public.braiders(district);
CREATE INDEX IF NOT EXISTS idx_braiders_concelho ON public.braiders(concelho);

-- PASSO 14: Criar índice para especialidades (GIN para arrays)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_braiders_specialties') THEN
        CREATE INDEX idx_braiders_specialties ON public.braiders USING GIN(specialties);
    END IF;
END $$;

-- PASSO 15: Verificar se tudo foi criado corretamente
SELECT 
  'Verificação Final:' as info,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'braiders' AND table_schema = 'public';

-- PASSO 16: Listar todas as colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'braiders' AND table_schema = 'public'
ORDER BY ordinal_position;