-- QUICK SETUP: Create monetization tables if they don't exist
-- This script can be run safely multiple times

-- Check if tables exist and create them if needed
DO $$ 
BEGIN
    -- Create platform_settings table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_settings') THEN
        CREATE TABLE public.platform_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key VARCHAR NOT NULL UNIQUE,
            value JSONB NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        INSERT INTO public.platform_settings (key, value, description) VALUES
        ('monetization_enabled', 'false', 'Flag para ativar sistema de cobrança'),
        ('commission_rate', '0.10', 'Taxa de comissão da plataforma (10%)'),
        ('subscription_price_eur', '10.00', 'Preço da assinatura mensal em euros'),
        ('free_bookings_limit', '5', 'Limite de agendamentos gratuitos por mês'),
        ('grace_period_days', '30', 'Período de aviso antes de ativar cobrança');
        
        RAISE NOTICE '✅ Created platform_settings table';
    END IF;

    -- Create braider_metrics table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'braider_metrics') THEN
        CREATE TABLE public.braider_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
            month_year DATE NOT NULL,
            total_bookings INTEGER DEFAULT 0,
            completed_bookings INTEGER DEFAULT 0,
            cancelled_bookings INTEGER DEFAULT 0,
            total_revenue DECIMAL(10,2) DEFAULT 0,
            potential_commission DECIMAL(10,2) DEFAULT 0,
            average_booking_value DECIMAL(10,2) DEFAULT 0,
            profile_views INTEGER DEFAULT 0,
            contact_attempts INTEGER DEFAULT 0,
            conversion_rate DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(braider_id, month_year)
        );
        
        RAISE NOTICE '✅ Created braider_metrics table';
    END IF;

    -- Create platform_transactions table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_transactions') THEN
        CREATE TABLE public.platform_transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
            booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
            service_amount DECIMAL(10,2) NOT NULL,
            commission_rate DECIMAL(4,3) NOT NULL,
            commission_amount DECIMAL(10,2) NOT NULL,
            braider_payout DECIMAL(10,2) NOT NULL,
            is_simulated BOOLEAN DEFAULT true,
            status VARCHAR DEFAULT 'simulated' CHECK (status IN ('simulated', 'pending', 'completed', 'failed')),
            stripe_payment_intent_id VARCHAR,
            stripe_transfer_id VARCHAR,
            processed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Created platform_transactions table';
    END IF;

END $$;

-- Show status
SELECT 'MONETIZATION TABLES STATUS:' as status;
SELECT 
    t.table_name,
    CASE WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES ('platform_settings'), ('braider_metrics'), ('platform_transactions')) as expected(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = expected.table_name AND t.table_schema = 'public';

-- Show sample data if tables exist
SELECT 'SAMPLE SETTINGS:' as info;
SELECT key, value, description FROM public.platform_settings LIMIT 5;