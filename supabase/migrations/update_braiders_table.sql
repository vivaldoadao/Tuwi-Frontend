-- Update braiders table to include missing columns for the braider registration form

-- Add missing columns if they don't exist
ALTER TABLE public.braiders 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS concelho VARCHAR(100),
ADD COLUMN IF NOT EXISTS freguesia VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS serves_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serves_studio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serves_salon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_travel_distance INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS salon_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS salon_address TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years_experience VARCHAR(20),
ADD COLUMN IF NOT EXISTS certificates TEXT,
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS weekly_availability JSONB DEFAULT '{}'::jsonb;

-- Create index on contact_email for performance
CREATE INDEX IF NOT EXISTS idx_braiders_contact_email ON public.braiders(contact_email);
CREATE INDEX IF NOT EXISTS idx_braiders_status ON public.braiders(status);
CREATE INDEX IF NOT EXISTS idx_braiders_district ON public.braiders(district);

-- Add constraint to ensure at least one service type is selected
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS check_service_types 
CHECK (serves_home = true OR serves_studio = true OR serves_salon = true);

-- Add constraint to ensure price consistency
ALTER TABLE public.braiders 
ADD CONSTRAINT IF NOT EXISTS check_price_range 
CHECK (min_price IS NULL OR max_price IS NULL OR min_price <= max_price);

-- Update RLS policies for the new table structure
DROP POLICY IF EXISTS "Allow public read for approved braiders" ON public.braiders;
CREATE POLICY "Allow public read for approved braiders" 
    ON public.braiders FOR SELECT 
    USING (status = 'approved');

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.braiders;
CREATE POLICY "Allow insert for authenticated users" 
    ON public.braiders FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow admins to do everything
DROP POLICY IF EXISTS "Allow admin full access" ON public.braiders;
CREATE POLICY "Allow admin full access" 
    ON public.braiders 
    USING (
        exists (
            select 1 from public.users 
            where users.id = auth.uid() 
            and users.role = 'admin'
        )
    );