-- Create sample bookings for testing the braider dashboard
-- This script creates multiple bookings for different braiders and statuses

-- First, let's clear existing sample bookings to avoid duplicates
DELETE FROM public.bookings WHERE notes LIKE '%teste%' OR notes LIKE '%sample%';

-- Insert sample bookings for the first braider (Ana Trancista)
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
) VALUES 
-- Confirmed bookings
(
  (SELECT s.id FROM public.services s LIMIT 1),
  (SELECT b.id FROM public.braiders b WHERE user_id = (SELECT id FROM public.users WHERE email = 'ana.trancista@example.com') LIMIT 1),
  (SELECT u.id FROM public.users u WHERE role = 'customer' LIMIT 1),
  CURRENT_DATE + INTERVAL '1 days',
  '09:00'::TIME,
  'trancista',
  'Maria Silva',
  'maria.silva@email.com',
  '+351 920 123 456',
  NULL,
  'confirmed',
  45.00,
  'Agendamento confirmado - teste'
),
(
  (SELECT s.id FROM public.services s OFFSET 1 LIMIT 1),
  (SELECT b.id FROM public.braiders b WHERE user_id = (SELECT id FROM public.users WHERE email = 'ana.trancista@example.com') LIMIT 1),
  NULL, -- Non-registered client
  CURRENT_DATE + INTERVAL '2 days',
  '14:00'::TIME,
  'domicilio',
  'Joana Santos',
  'joana.santos@email.com',
  '+351 930 456 789',
  'Rua das Flores, 123, Lisboa',
  'confirmed',
  60.00,
  'Serviço ao domicílio confirmado - teste'
),

-- Pending bookings
(
  (SELECT s.id FROM public.services s LIMIT 1),
  (SELECT b.id FROM public.braiders b WHERE user_id = (SELECT id FROM public.users WHERE email = 'ana.trancista@example.com') LIMIT 1),
  NULL,
  CURRENT_DATE + INTERVAL '3 days',
  '10:30'::TIME,
  'trancista',
  'Carla Mendes',
  'carla.mendes@email.com',
  '+351 940 789 012',
  NULL,
  'pending',
  45.00,
  'Agendamento pendente - teste'
),
(
  (SELECT s.id FROM public.services s OFFSET 2 LIMIT 1),
  (SELECT b.id FROM public.braiders b WHERE user_id = (SELECT id FROM public.users WHERE email = 'ana.trancista@example.com') LIMIT 1),
  NULL,
  CURRENT_DATE + INTERVAL '4 days',
  '16:00'::TIME,
  'domicilio',
  'Sofia Costa',
  'sofia.costa@email.com',
  '+351 950 345 678',
  'Avenida da Liberdade, 456, Porto',
  'pending',
  80.00,
  'Serviço premium ao domicílio - teste'
),

-- Cancelled booking
(
  (SELECT s.id FROM public.services s OFFSET 1 LIMIT 1),
  (SELECT b.id FROM public.braiders b WHERE user_id = (SELECT id FROM public.users WHERE email = 'ana.trancista@example.com') LIMIT 1),
  NULL,
  CURRENT_DATE - INTERVAL '1 days',
  '11:00'::TIME,
  'trancista',
  'Rita Oliveira',
  'rita.oliveira@email.com',
  '+351 960 123 456',
  NULL,
  'cancelled',
  45.00,
  'Cancelado pelo cliente - teste'
);

-- Insert sample bookings for the second braider (Maria) if exists
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
  CURRENT_DATE + INTERVAL '5 days',
  '15:00'::TIME,
  'trancista',
  'Ana Pereira',
  'ana.pereira@email.com',
  '+351 970 987 654',
  NULL,
  'confirmed',
  50.00,
  'Agendamento para segunda trancista - teste'
FROM public.services s, public.braiders b 
WHERE b.user_id = (SELECT id FROM public.users WHERE email = 'maria@example.com')
LIMIT 1;

-- Display created bookings for verification
SELECT 
  b.id,
  b.client_name,
  b.booking_date,
  b.booking_time,
  b.service_type,
  b.status,
  b.total_amount,
  br.name as braider_name,
  s.name as service_name
FROM public.bookings b
JOIN public.braiders br ON b.braider_id = br.id
JOIN public.services s ON b.service_id = s.id
WHERE b.notes LIKE '%teste%'
ORDER BY b.booking_date, b.booking_time;