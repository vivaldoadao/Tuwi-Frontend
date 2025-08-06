-- 🔍 Verificação do Schema Atualizado da Tabela Braiders
-- Este script verifica se todos os campos do formulário estão presentes

-- 1. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar constraints
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'braiders' 
  AND tc.table_schema = 'public'
ORDER BY constraint_type, constraint_name;

-- 3. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'braiders' 
  AND schemaname = 'public'
ORDER BY indexname;

-- 4. Verificar types customizados
SELECT 
  t.typname,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('experience_level', 'user_role', 'braider_status')
GROUP BY t.typname
ORDER BY t.typname;

-- 5. Verificar funções criadas
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'validate_instagram_handle',
    'validate_portugal_phone',
    'search_braiders_by_location',
    'search_braiders_by_specialty'
  )
ORDER BY routine_name;

-- 6. Verificar view criada
SELECT 
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'braiders_complete' 
  AND schemaname = 'public';

-- 7. Testar constraints (devem falhar)
-- Uncomment para testar as validações:
/*
-- Este INSERT deve falhar por não ter nenhuma modalidade de atendimento
INSERT INTO public.braiders (user_id, bio, location) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Teste', 'Lisboa');

-- Este INSERT deve falhar por ter serves_salon=true mas sem salon_name
INSERT INTO public.braiders (user_id, bio, location, serves_salon) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Teste', 'Lisboa', true);

-- Este INSERT deve falhar por ter min_price > max_price
INSERT INTO public.braiders (user_id, bio, location, serves_studio, min_price, max_price) 
VALUES ('00000000-0000-0000-0000-000000000002', 'Teste', 'Lisboa', true, 100.00, 50.00);
*/

-- 8. Contagem de campos por categoria
SELECT 
  'Campos Básicos' as categoria,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND column_name IN ('id', 'user_id', 'bio', 'location', 'contact_phone', 'status')

UNION ALL

SELECT 
  'Campos Pessoais' as categoria,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND column_name IN ('whatsapp', 'instagram')

UNION ALL

SELECT 
  'Campos Localização' as categoria,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND column_name IN ('district', 'concelho', 'freguesia', 'address', 'postal_code')

UNION ALL

SELECT 
  'Campos Modalidades' as categoria,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND column_name IN ('serves_home', 'serves_studio', 'serves_salon', 'max_travel_distance', 'salon_name', 'salon_address')

UNION ALL

SELECT 
  'Campos Profissionais' as categoria,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'braiders' 
  AND column_name IN ('specialties', 'years_experience', 'certificates', 'min_price', 'max_price', 'weekly_availability')

ORDER BY categoria;

-- 9. Verificar se todos os campos esperados existem
WITH expected_fields AS (
  SELECT unnest(ARRAY[
    'id', 'user_id', 'bio', 'location', 'contact_phone', 'status',
    'portfolio_images', 'average_rating', 'total_reviews',
    'whatsapp', 'instagram', 'district', 'concelho', 'freguesia', 
    'address', 'postal_code', 'serves_home', 'serves_studio', 
    'serves_salon', 'max_travel_distance', 'salon_name', 'salon_address',
    'specialties', 'years_experience', 'certificates', 'min_price', 
    'max_price', 'weekly_availability', 'created_at', 'updated_at'
  ]) AS field_name
),
actual_fields AS (
  SELECT column_name as field_name
  FROM information_schema.columns 
  WHERE table_name = 'braiders' AND table_schema = 'public'
)
SELECT 
  ef.field_name,
  CASE 
    WHEN af.field_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Faltando'
  END as status
FROM expected_fields ef
LEFT JOIN actual_fields af ON ef.field_name = af.field_name
ORDER BY ef.field_name;

-- 10. Exemplo de query usando os novos campos
SELECT 
  'Exemplo de consulta com novos campos:' as info;

-- Query de exemplo (comentada para não falhar se não houver dados)
/*
SELECT 
  u.name,
  b.district,
  b.concelho,
  b.specialties,
  b.serves_home,
  b.serves_studio,
  b.serves_salon,
  b.min_price,
  b.max_price
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
WHERE b.status = 'approved'
  AND 'Box Braids' = ANY(b.specialties)
  AND b.serves_home = true
LIMIT 5;
*/