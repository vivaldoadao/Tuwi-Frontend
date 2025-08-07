-- Fix RLS policy to allow braiders to view and update their own profiles

-- Add policy for braiders to view their own data regardless of status
DROP POLICY IF EXISTS "Allow braiders to view own profile" ON public.braiders;
CREATE POLICY "Allow braiders to view own profile" 
    ON public.braiders FOR SELECT 
    USING (user_id = auth.uid());

-- Add policy for braiders to update their own data
DROP POLICY IF EXISTS "Allow braiders to update own profile" ON public.braiders;
CREATE POLICY "Allow braiders to update own profile" 
    ON public.braiders FOR UPDATE 
    USING (user_id = auth.uid());

-- Also ensure users can read their own data
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);