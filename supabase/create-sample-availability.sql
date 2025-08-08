-- Create sample availability data for testing the booking system
-- This ensures there are available time slots for testing

-- Clear existing availability data
DELETE FROM public.braider_availability;

-- Insert sample availability for the next 7 days for all braiders
INSERT INTO public.braider_availability (braider_id, date, start_time, end_time, is_booked)
SELECT 
  b.id as braider_id,
  (CURRENT_DATE + INTERVAL '1 day' * generate_series(1, 7)) as date,
  time_slot.start_time,
  time_slot.end_time,
  false as is_booked
FROM public.braiders b
CROSS JOIN (
  VALUES 
    ('09:00'::TIME, '12:00'::TIME),
    ('14:00'::TIME, '17:00'::TIME),
    ('10:00'::TIME, '13:00'::TIME),
    ('15:00'::TIME, '18:00'::TIME)
) AS time_slot(start_time, end_time)
WHERE b.status = 'approved'
LIMIT 50; -- Limit to prevent too much data

-- Verify the data was inserted
SELECT COUNT(*) as total_availability_slots FROM public.braider_availability;
SELECT COUNT(DISTINCT braider_id) as braiders_with_availability FROM public.braider_availability;

-- Show sample data
SELECT 
  ba.date,
  ba.start_time,
  ba.end_time,
  ba.is_booked,
  b.id as braider_id
FROM public.braider_availability ba
JOIN public.braiders b ON ba.braider_id = b.id
ORDER BY ba.date, ba.start_time
LIMIT 10;