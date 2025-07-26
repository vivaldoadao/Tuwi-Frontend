-- Add verification fields to users table
ALTER TABLE public.users ADD COLUMN verification_code VARCHAR(6);
ALTER TABLE public.users ADD COLUMN verification_code_expiry TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN reset_code VARCHAR(6);
ALTER TABLE public.users ADD COLUMN reset_code_expiry TIMESTAMPTZ;