-- 🔍 Verificação Rápida do Schema

-- 1. Contar total de colunas
SELECT 
  'Total de colunas na tabela braiders:' as info,
  COUNT(*) as total
FROM information_schema.columns 
WHERE table_name = 'braiders' AND table_schema = 'public';

-- 2. Verificar se os novos campos existem
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'whatsapp') 
    THEN '✅ whatsapp' 
    ELSE '❌ whatsapp' 
  END as whatsapp_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'district') 
    THEN '✅ district' 
    ELSE '❌ district' 
  END as district_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'serves_salon') 
    THEN '✅ serves_salon' 
    ELSE '❌ serves_salon' 
  END as serves_salon_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'braiders' AND column_name = 'specialties') 
    THEN '✅ specialties' 
    ELSE '❌ specialties' 
  END as specialties_status;

-- 3. Verificar constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'braiders' AND table_schema = 'public'
  AND constraint_type = 'CHECK'
ORDER BY constraint_name;

-- 4. Verificar se o tipo enum foi criado
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') 
    THEN '✅ experience_level enum criado' 
    ELSE '❌ experience_level enum não encontrado' 
  END as enum_status;

-- 5. Listar todas as colunas novas (esperadas)
WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'whatsapp', 'instagram', 'district', 'concelho', 'freguesia',
    'address', 'postal_code', 'serves_home', 'serves_studio', 'serves_salon',
    'max_travel_distance', 'salon_name', 'salon_address', 'specialties',
    'years_experience', 'certificates', 'min_price', 'max_price', 'weekly_availability'
  ]) as expected_column
)
SELECT 
  ec.expected_column,
  CASE 
    WHEN c.column_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Faltando'
  END as status
FROM expected_columns ec
LEFT JOIN information_schema.columns c 
  ON c.table_name = 'braiders' 
  AND c.table_schema = 'public' 
  AND c.column_name = ec.expected_column
ORDER BY ec.expected_column;