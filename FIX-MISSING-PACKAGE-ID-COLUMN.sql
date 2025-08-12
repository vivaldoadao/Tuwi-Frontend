-- Fix missing package_id column in promotions table
-- This adds the required column and establishes the foreign key relationship

-- First check if promotions table exists and what columns it has
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'promotions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing package_id column if it doesn't exist
DO $$ 
BEGIN
    -- Add package_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'package_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.promotions 
        ADD COLUMN package_id UUID REFERENCES public.promotion_packages(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added package_id column to promotions table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'promotions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current promotions table structure
SELECT 'Promotions table structure:' as status;
\d public.promotions;