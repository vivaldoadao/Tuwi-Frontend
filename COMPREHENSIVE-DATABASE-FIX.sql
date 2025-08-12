-- COMPREHENSIVE DATABASE FIX FOR PROMOTION SYSTEM
-- This script fixes all database structure issues step by step

-- Step 1: Create promotion_packages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.promotion_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package')),
    duration_days INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Check if promotions table exists, if not create it
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('profile_highlight', 'hero_banner', 'combo_package')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    content_data JSONB DEFAULT '{}',
    price DECIMAL(10,2) DEFAULT 0,
    duration_days INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'rejected')),
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    contacts_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add package_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'package_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.promotions 
        ADD COLUMN package_id UUID REFERENCES public.promotion_packages(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added package_id column to promotions table';
    END IF;
END $$;

-- Step 4: Create promotion_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.promotion_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT 'null',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Insert essential settings
INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES
('system_enabled', 'true'::jsonb, 'Sistema de promoções ativo globalmente', 'system', true),
('payments_enabled', 'true'::jsonb, 'Cobrança de pagamentos ativa', 'payments', true),
('free_trial_enabled', 'false'::jsonb, 'Permite uso gratuito temporário', 'trial', true),
('max_hero_banners', '3'::jsonb, 'Máximo de banners no hero section simultaneamente', 'limits', true),
('max_highlighted_profiles', '15'::jsonb, 'Máximo de perfis em destaque simultaneamente', 'limits', true),
('default_currency', '"EUR"'::jsonb, 'Moeda padrão do sistema', 'pricing', true)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- Step 6: Create basic promotion packages
INSERT INTO public.promotion_packages (name, type, duration_days, price, features) VALUES
('Destaque Básico - 7 dias', 'profile_highlight', 7, 15.00, '{"priority": 1, "badge": true, "featured_section": true}'),
('Destaque Premium - 30 dias', 'profile_highlight', 30, 50.00, '{"priority": 2, "badge": true, "featured_section": true, "top_results": true}'),
('Banner Hero - 7 dias', 'hero_banner', 7, 25.00, '{"banner_size": "large", "call_to_action": true}'),
('Banner Hero - 30 dias', 'hero_banner', 30, 80.00, '{"banner_size": "large", "call_to_action": true, "priority_placement": true}'),
('Combo Especial - 30 dias', 'combo_package', 30, 120.00, '{"profile_highlight": true, "hero_banner": true, "priority": 3}')
ON CONFLICT DO NOTHING;

-- Step 7: Create RLS policies
ALTER TABLE public.promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_settings ENABLE ROW LEVEL SECURITY;

-- Policies for promotion_packages (public read, admin write)
CREATE POLICY "Public can view active packages" ON public.promotion_packages 
FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage packages" ON public.promotion_packages 
FOR ALL USING (auth.role() = 'service_role');

-- Policies for promotions (users see their own, admins see all)
CREATE POLICY "Users can view own promotions" ON public.promotions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promotions" ON public.promotions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promotions" ON public.promotions 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all promotions" ON public.promotions 
FOR ALL USING (auth.role() = 'service_role');

-- Policies for settings (public read for public settings, service write)
CREATE POLICY "Public can view public settings" ON public.promotion_settings 
FOR SELECT USING (is_public = true);

CREATE POLICY "Service role can manage settings" ON public.promotion_settings 
FOR ALL USING (auth.role() = 'service_role');

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_packages_type ON public.promotion_packages(type);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_key ON public.promotion_settings(key);
CREATE INDEX IF NOT EXISTS idx_promotion_settings_public ON public.promotion_settings(is_public);

-- Step 9: Verification queries
SELECT 'Database structure verification:' as status;

-- Check tables exist
SELECT 'Tables created:' as check;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('promotion_packages', 'promotions', 'promotion_settings')
ORDER BY table_name;

-- Check promotions table structure
SELECT 'Promotions table columns:' as check;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'promotions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check settings exist
SELECT 'Critical settings:' as check;
SELECT key, value, is_public 
FROM public.promotion_settings 
WHERE key IN ('system_enabled', 'payments_enabled', 'free_trial_enabled')
ORDER BY key;

-- Check packages exist
SELECT 'Available packages:' as check;
SELECT name, type, duration_days, price 
FROM public.promotion_packages 
WHERE is_active = true
ORDER BY type, price;

SELECT 'Database fix completed successfully!' as status;