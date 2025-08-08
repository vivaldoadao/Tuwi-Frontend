-- Create bookings table for service appointments
-- This table stores customer bookings for braider services

DROP TABLE IF EXISTS public.bookings CASCADE;

CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  braider_id UUID NOT NULL REFERENCES public.braiders(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('domicilio', 'trancista')),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_address TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_bookings_braider_id ON public.bookings(braider_id);
CREATE INDEX idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_braider_date ON public.bookings(braider_id, booking_date);

-- Add constraint to prevent double booking of same time slot
CREATE UNIQUE INDEX idx_bookings_no_double_booking 
ON public.bookings(braider_id, booking_date, booking_time) 
WHERE status IN ('pending', 'confirmed');

-- Add check constraint to ensure client_address is provided for home service
ALTER TABLE public.bookings 
ADD CONSTRAINT check_home_service_address 
CHECK (
  (service_type = 'domicilio' AND client_address IS NOT NULL AND client_address != '') 
  OR 
  service_type != 'domicilio'
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Braiders can manage their bookings" ON public.bookings
  FOR ALL USING (
    braider_id IN (
      SELECT b.id FROM public.braiders b
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their bookings" ON public.bookings
  FOR SELECT USING (
    client_id = auth.uid()
  );

CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comments to table and columns
COMMENT ON TABLE public.bookings IS 'Customer bookings for braider services';
COMMENT ON COLUMN public.bookings.service_type IS 'Type of service: domicilio (home) or trancista (salon)';
COMMENT ON COLUMN public.bookings.client_id IS 'References users.id - can be null for non-registered clients';
COMMENT ON COLUMN public.bookings.client_address IS 'Required for home service bookings';
COMMENT ON COLUMN public.bookings.status IS 'Booking status: pending, confirmed, cancelled, completed';

-- Insert sample booking for testing
INSERT INTO public.bookings (
  service_id,
  braider_id,
  client_id,
  booking_date,
  booking_time,
  service_type,
  client_name,
  client_email,
  client_phone,
  client_address,
  status,
  total_amount,
  notes
) VALUES (
  -- Use first available service and braider for testing
  (SELECT s.id FROM public.services s LIMIT 1),
  (SELECT b.id FROM public.braiders b LIMIT 1),
  (SELECT u.id FROM public.users u WHERE role = 'customer' LIMIT 1),
  CURRENT_DATE + INTERVAL '3 days',
  '10:00'::TIME,
  'trancista',
  'Cliente de Teste',
  'cliente@teste.com',
  '+351 900 123 456',
  NULL, -- No address needed for salon service
  'confirmed',
  50.00,
  'Agendamento de teste criado automaticamente'
);