-- Criar registro de trancista para o usuário znattechnology95@gmail.com
-- Este usuário já existe mas não tem registro na tabela braiders

INSERT INTO public.braiders (
  user_id,
  name,
  bio,
  location,
  contact_email,
  contact_phone,
  profile_image_url,
  status
) VALUES (
  '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b', -- ID do usuário existente
  'Znat Technology Tranças',
  'Especialista em diversos estilos de tranças e cuidados capilares. Oferece serviços profissionais tanto no salão quanto ao domicílio.',
  'Lisboa, Portugal',
  'znattechnology95@gmail.com',
  '+351 999 888 777',
  '/placeholder.svg?height=200&width=200&text=ZT',
  'approved' -- Já aprovado para testes
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  contact_email = EXCLUDED.contact_email,
  status = EXCLUDED.status;

-- Verificar se foi criado corretamente
SELECT 
  b.id, 
  b.user_id, 
  b.name,
  b.contact_email, 
  b.status,
  u.email as user_email
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
WHERE u.email = 'znattechnology95@gmail.com';