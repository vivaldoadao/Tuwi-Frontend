-- Fix RLS policies for braiders table
-- The issue is that current policies only allow access to APPROVED braiders
-- But braiders need to see their own data regardless of approval status

-- First, check current policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'braiders';

-- Drop conflicting policies
DROP POLICY IF EXISTS "Allow public read for approved braiders" ON public.braiders;
DROP POLICY IF EXISTS "Anyone can view approved braiders" ON public.braiders;
DROP POLICY IF EXISTS "Allow braiders to view own profile" ON public.braiders;
DROP POLICY IF EXISTS "Braiders can update their own profile" ON public.braiders;
DROP POLICY IF EXISTS "Users can create braider profile" ON public.braiders;

-- Create new comprehensive policies

-- 1. Allow braiders to view their own profile (regardless of approval status)
CREATE POLICY "Braiders can view own profile" 
ON public.braiders 
FOR SELECT 
USING (user_id = auth.uid());

-- 2. Allow public to view only APPROVED braiders
CREATE POLICY "Public can view approved braiders" 
ON public.braiders 
FOR SELECT 
USING (status = 'approved' AND user_id != auth.uid());

-- 3. Allow braiders to update their own profile
CREATE POLICY "Braiders can update own profile" 
ON public.braiders 
FOR UPDATE 
USING (user_id = auth.uid());

-- 4. Allow authenticated users to create braider profiles
CREATE POLICY "Authenticated users can create braider profile" 
ON public.braiders 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND auth.role() = 'authenticated');

-- 5. Allow admins full access
CREATE POLICY "Admins have full access to braiders" 
ON public.braiders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.braiders ENABLE ROW LEVEL SECURITY;

-- Check if there's a braider record for the user
SELECT 
  b.id, 
  b.user_id, 
  b.contact_email, 
  b.status,
  u.email as user_email,
  u.role as user_role
FROM public.braiders b
LEFT JOIN public.users u ON b.user_id = u.id
WHERE u.email = 'znattechnology95@gmail.com';