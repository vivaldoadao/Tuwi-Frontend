-- Check the current user and braider status
-- This helps diagnose the RLS issue

-- First check if the user exists and their role
SELECT 
  id,
  email,
  role,
  created_at
FROM public.users 
WHERE email = 'znattechnology95@gmail.com';

-- Check if there's a corresponding braider record
SELECT 
  b.id, 
  b.user_id, 
  b.name,
  b.contact_email, 
  b.status,
  b.created_at,
  u.email as user_email,
  u.role as user_role
FROM public.braiders b
RIGHT JOIN public.users u ON b.user_id = u.id
WHERE u.email = 'znattechnology95@gmail.com';

-- Check all braiders to see what exists
SELECT 
  b.id,
  b.name,
  b.contact_email,
  b.status,
  u.email as user_email,
  u.role as user_role
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
ORDER BY b.created_at DESC
LIMIT 10;

-- If no braider record exists, let's create one for testing
INSERT INTO public.braiders (
  user_id,
  name,
  bio,
  location,
  contact_email,
  contact_phone,
  profile_image_url,
  status
)
SELECT 
  u.id,
  COALESCE(u.name, 'Trancista Zna Technology'),
  'Trancista especializada em diversos estilos de tranças.',
  'Lisboa, Portugal',
  u.email,
  '+351 999 888 777',
  '/placeholder.svg?height=200&width=200&text=ZT',
  'approved' -- Set as approved for testing
FROM public.users u
WHERE u.email = 'znattechnology95@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.braiders b WHERE b.user_id = u.id
  );

-- Show final result
SELECT 
  b.id, 
  b.user_id, 
  b.name,
  b.contact_email, 
  b.status,
  u.email as user_email,
  u.role as user_role
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
WHERE u.email = 'znattechnology95@gmail.com';