-- Create test bookings for znattechnology95@gmail.com user
-- This script ensures the user has braider data and bookings to test

-- First ensure user exists and has braider role
UPDATE public.users 
SET role = 'braider' 
WHERE email = 'znattechnology95@gmail.com';

-- Check if braider exists, if not we'll let the API create it
-- But we can create some services and bookings assuming the braider will be created

-- Let's check current state
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  b.id as braider_id,
  b.name as braider_name,
  b.status as braider_status
FROM public.users u
LEFT JOIN public.braiders b ON b.user_id = u.id
WHERE u.email = 'znattechnology95@gmail.com';

-- Create test bookings for the braider once it exists
-- We'll insert these after the API creates the braider
-- For now, let's create some sample data that will work with any braider

-- First, ensure we have at least one service
INSERT INTO public.services (
  braider_id,
  name,
  description,
  price,
  duration_minutes,
  is_available,
  image_url
)
SELECT 
  b.id,
  'Tranças Box Braids',
  'Tranças clássicas box braids com acabamento profissional',
  45.00,
  180,
  true,
  '/placeholder.svg?height=300&width=400&text=Box+Braids'
FROM public.braiders b
WHERE b.contact_email = 'znattechnology95@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (
  braider_id,
  name,
  description,
  price,
  duration_minutes,
  is_available,
  image_url
)
SELECT 
  b.id,
  'Tranças Senegalesas',
  'Tranças senegalesas elegantes para todos os comprimentos',
  60.00,
  240,
  true,
  '/placeholder.svg?height=300&width=400&text=Senegalesas'
FROM public.braiders b
WHERE b.contact_email = 'znattechnology95@gmail.com'
ON CONFLICT DO NOTHING;

-- Now create some test bookings
INSERT INTO public.bookings (
  service_id,
  braider_id,
  client_id,
  booking_date,
  booking_time,
  service_type,
  client_name,
  client_email,
  client_phone,
  client_address,
  status,
  total_amount,
  notes
)
SELECT 
  s.id,
  b.id,
  NULL, -- Non-registered client
  CURRENT_DATE + INTERVAL '1 days',
  '10:00'::TIME,
  'trancista',
  'Ana Silva',
  'ana.silva@teste.com',
  '+351 920 123 456',
  NULL,
  'pending',
  s.price,
  'Agendamento de teste - pendente'
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
WHERE b.contact_email = 'znattechnology95@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.bookings (
  service_id,
  braider_id,
  client_id,
  booking_date,
  booking_time,
  service_type,
  client_name,
  client_email,
  client_phone,
  client_address,
  status,
  total_amount,
  notes
)
SELECT 
  s.id,
  b.id,
  NULL,
  CURRENT_DATE + INTERVAL '2 days',
  '14:00'::TIME,
  'domicilio',
  'Maria Santos',
  'maria.santos@teste.com',
  '+351 930 456 789',
  'Rua das Flores, 123, Lisboa',
  'confirmed',
  s.price,
  'Agendamento de teste - confirmado'
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
WHERE b.contact_email = 'znattechnology95@gmail.com'
OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.bookings (
  service_id,
  braider_id,
  client_id,
  booking_date,
  booking_time,
  service_type,
  client_name,
  client_email,
  client_phone,
  client_address,
  status,
  total_amount,
  notes
)
SELECT 
  s.id,
  b.id,
  NULL,
  CURRENT_DATE + INTERVAL '3 days',
  '16:30'::TIME,
  'trancista',
  'Carla Mendes',
  'carla.mendes@teste.com',
  '+351 940 789 012',
  NULL,
  'cancelled',
  s.price,
  'Agendamento de teste - cancelado'
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
WHERE b.contact_email = 'znattechnology95@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Show final results
SELECT 
  'FINAL RESULTS' as info,
  COUNT(*) as booking_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM public.bookings b
JOIN public.braiders br ON b.braider_id = br.id
WHERE br.contact_email = 'znattechnology95@gmail.com';