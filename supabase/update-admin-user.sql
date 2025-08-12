-- Verificar usuário atual
SELECT id, email, role FROM public.users WHERE email = 'vivaldo.adao2019@gmail.com';

-- Atualizar usuário para admin (substitua o email se necessário)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'vivaldo.adao2019@gmail.com';

-- Verificar se a atualização funcionou
SELECT id, email, role FROM public.users WHERE email = 'vivaldo.adao2019@gmail.com';

-- Se o usuário não existir, inserir novo admin (descomente se necessário)
-- INSERT INTO public.users (email, role, name) 
-- VALUES ('vivaldo.adao2019@gmail.com', 'admin', 'Vivaldo Adão')
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';