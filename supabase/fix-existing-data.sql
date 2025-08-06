-- 🔧 Corrigir Dados Existentes Antes de Adicionar Constraints
-- Execute este script antes de adicionar os constraints

-- 1. Verificar quantos registros existem e seu estado atual
SELECT 
  COUNT(*) as total_braiders,
  COUNT(CASE WHEN serves_home = true THEN 1 END) as serves_home_count,
  COUNT(CASE WHEN serves_studio = true THEN 1 END) as serves_studio_count,
  COUNT(CASE WHEN serves_salon = true THEN 1 END) as serves_salon_count,
  COUNT(CASE WHEN COALESCE(serves_home, false) = false 
                 AND COALESCE(serves_studio, false) = false 
                 AND COALESCE(serves_salon, false) = false THEN 1 END) as no_service_type
FROM public.braiders;

-- 2. Ver quais registros específicos precisam ser corrigidos
SELECT 
  id,
  user_id,
  location,
  serves_home,
  serves_studio,
  serves_salon
FROM public.braiders
WHERE COALESCE(serves_home, false) = false 
  AND COALESCE(serves_studio, false) = false 
  AND COALESCE(serves_salon, false) = false;

-- 3. Corrigir os registros - definir serves_studio = true para todos que não têm modalidade
UPDATE public.braiders 
SET serves_studio = true 
WHERE COALESCE(serves_home, false) = false 
  AND COALESCE(serves_studio, false) = false 
  AND COALESCE(serves_salon, false) = false;

-- 4. Verificar se a correção funcionou
SELECT 
  'Após correção:' as status,
  COUNT(*) as total_braiders,
  COUNT(CASE WHEN serves_home = true THEN 1 END) as serves_home_count,
  COUNT(CASE WHEN serves_studio = true THEN 1 END) as serves_studio_count,
  COUNT(CASE WHEN serves_salon = true THEN 1 END) as serves_salon_count,
  COUNT(CASE WHEN COALESCE(serves_home, false) = false 
                 AND COALESCE(serves_studio, false) = false 
                 AND COALESCE(serves_salon, false) = false THEN 1 END) as no_service_type
FROM public.braiders;

-- 5. Agora pode adicionar o constraint sem problemas
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