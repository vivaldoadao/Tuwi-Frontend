-- Add password_hash field to users table for email/password authentication
ALTER TABLE public.users ADD COLUMN password_hash VARCHAR;