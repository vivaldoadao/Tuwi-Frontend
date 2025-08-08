-- Create sample bookings for the current user's braider profile
-- This runs after the API creates the braider profile

-- Insert sample bookings for the braider that will be created/found for the user
-- We'll use the user_id to find the braider_id dynamically

-- Sample booking 1: Pending
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
  s.id as service_id,
  b.id as braider_id,
  NULL as client_id,
  CURRENT_DATE + INTERVAL '1 days' as booking_date,
  '10:00'::TIME as booking_time,
  'trancista' as service_type,
  'Maria Silva' as client_name,
  'maria.silva@teste.com' as client_email,
  '+351 920 123 456' as client_phone,
  NULL as client_address,
  'pending' as status,
  s.price as total_amount,
  'Agendamento de teste - pendente' as notes
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
JOIN public.users u ON u.id = b.user_id
WHERE u.email = 'znattechnology95@gmail.com'
  AND s.name = 'Tranças Box Braids'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample booking 2: Confirmed
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
  s.id as service_id,
  b.id as braider_id,
  NULL as client_id,
  CURRENT_DATE + INTERVAL '2 days' as booking_date,
  '14:30'::TIME as booking_time,
  'domicilio' as service_type,
  'Ana Santos' as client_name,
  'ana.santos@teste.com' as client_email,
  '+351 930 456 789' as client_phone,
  'Rua das Flores, 123, Lisboa' as client_address,
  'confirmed' as status,
  s.price as total_amount,
  'Agendamento confirmado ao domicílio - teste' as notes
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
JOIN public.users u ON u.id = b.user_id
WHERE u.email = 'znattechnology95@gmail.com'
  AND s.name = 'Tranças Senegalesas'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample booking 3: Another Pending
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
  s.id as service_id,
  b.id as braider_id,
  NULL as client_id,
  CURRENT_DATE + INTERVAL '3 days' as booking_date,
  '16:00'::TIME as booking_time,
  'trancista' as service_type,
  'Carla Mendes' as client_name,
  'carla.mendes@teste.com' as client_email,
  '+351 940 789 012' as client_phone,
  NULL as client_address,
  'pending' as status,
  s.price as total_amount,
  'Novo agendamento pendente - teste' as notes
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
JOIN public.users u ON u.id = b.user_id
WHERE u.email = 'znattechnology95@gmail.com'
  AND s.name = 'Tranças Box Braids'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample booking 4: Cancelled
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
  s.id as service_id,
  b.id as braider_id,
  NULL as client_id,
  CURRENT_DATE - INTERVAL '1 days' as booking_date,
  '11:00'::TIME as booking_time,
  'trancista' as service_type,
  'Rita Oliveira' as client_name,
  'rita.oliveira@teste.com' as client_email,
  '+351 960 123 456' as client_phone,
  NULL as client_address,
  'cancelled' as status,
  s.price as total_amount,
  'Agendamento cancelado - teste' as notes
FROM public.braiders b
JOIN public.services s ON s.braider_id = b.id
JOIN public.users u ON u.id = b.user_id
WHERE u.email = 'znattechnology95@gmail.com'
  AND s.name = 'Tranças Senegalesas'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Show final results
SELECT 
  'BOOKINGS CREATED' as status,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM public.bookings b
JOIN public.braiders br ON b.braider_id = br.id
JOIN public.users u ON br.user_id = u.id
WHERE u.email = 'znattechnology95@gmail.com';

-- Also show the braider info
SELECT 
  'BRAIDER INFO' as status,
  b.id as braider_id,
  b.name as braider_name,
  b.status as braider_status,
  u.email as user_email,
  COUNT(s.id) as services_count
FROM public.braiders b
JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.services s ON s.braider_id = b.id
WHERE u.email = 'znattechnology95@gmail.com'
GROUP BY b.id, b.name, b.status, u.email;