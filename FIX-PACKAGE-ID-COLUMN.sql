-- ==========================================
-- FIX PACKAGE_ID COLUMN MISSING ERROR
-- Execute este SQL primeiro para adicionar a coluna ausente
-- ==========================================

-- 1. Verificar se a coluna package_id existe na tabela promotions
DO $$
BEGIN
    -- Adicionar coluna package_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'package_id'
    ) THEN
        ALTER TABLE public.promotions 
        ADD COLUMN package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Coluna package_id adicionada à tabela promotions ✅';
    ELSE
        RAISE NOTICE 'Coluna package_id já existe na tabela promotions ✅';
    END IF;
END
$$;

-- 2. Criar índice para a nova coluna se não existir
CREATE INDEX IF NOT EXISTS idx_promotions_package_id ON public.promotions(package_id);

-- 3. Verificar se a tabela promotion_packages existe, se não, criar
CREATE TABLE IF NOT EXISTS public.promotion_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package')),
  duration_days INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  color VARCHAR DEFAULT '#10B981',
  icon VARCHAR DEFAULT 'star',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verificar estrutura atual das tabelas
SELECT 
  'promotions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'promotions'
AND column_name IN ('id', 'user_id', 'package_id', 'type', 'status')
ORDER BY ordinal_position;

-- 5. Verificar se tudo está OK
SELECT 'Coluna package_id corrigida com sucesso! ✅' as status;