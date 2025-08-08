-- Diagnostic script to check user data and braider relationships
-- Run this script in Supabase SQL Editor

-- 1. Check if user exists
SELECT 'USER DATA:' as section;
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM public.users 
WHERE email = 'znattechnology95@gmail.com';

-- 2. Check if braider record exists for this user
SELECT 'BRAIDER DATA:' as section;
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

-- 3. Check all existing braiders
SELECT 'ALL BRAIDERS:' as section;
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
LIMIT 5;

-- 4. Check bookings table structure
SELECT 'BOOKINGS STRUCTURE:' as section;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bookings'
ORDER BY ordinal_position;

-- 5. Check if there are any bookings
SELECT 'EXISTING BOOKINGS:' as section;
SELECT COUNT(*) as total_bookings FROM public.bookings;

-- 6. Show sample booking if any exist
SELECT 'SAMPLE BOOKING:' as section;
SELECT * FROM public.bookings LIMIT 1;