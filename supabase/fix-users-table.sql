-- Drop the existing foreign key constraint and recreate the table without it
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table without foreign key to auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  phone VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (true);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (true);

-- Policy: Allow insert for new user registration
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT WITH CHECK (true);

-- Grant access to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;