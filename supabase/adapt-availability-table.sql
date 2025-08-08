-- Adapt braider_availability table to match the frontend fields
-- Based on the BraiderAvailability type: id, braiderId, date, startTime, endTime, isBooked

-- Drop existing table if it exists and recreate with correct structure
DROP TABLE IF EXISTS public.braider_availability CASCADE;

CREATE TABLE public.braider_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  braider_id UUID NOT NULL REFERENCES public.braiders(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_braider_availability_braiderid ON public.braider_availability(braider_id);
CREATE INDEX idx_braider_availability_date ON public.braider_availability(date);
CREATE INDEX idx_braider_availability_braider_date ON public.braider_availability(braider_id, date);

-- Add constraint to prevent overlapping time slots for the same braider on the same date
CREATE UNIQUE INDEX idx_braider_availability_no_overlap 
ON public.braider_availability(braider_id, date, start_time, end_time);

-- Add check constraint to ensure start_time is before end_time
ALTER TABLE public.braider_availability 
ADD CONSTRAINT check_time_order 
CHECK (start_time < end_time);

-- Enable RLS
ALTER TABLE public.braider_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Braiders can manage their own availability" ON public.braider_availability
  FOR ALL USING (
    braider_id IN (
      SELECT b.id FROM public.braiders b
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view available slots" ON public.braider_availability
  FOR SELECT USING (true);

-- Add comment to table
COMMENT ON TABLE public.braider_availability IS 'Braiders availability schedules using snake_case field names';
COMMENT ON COLUMN public.braider_availability.braider_id IS 'References braiders.id';
COMMENT ON COLUMN public.braider_availability.start_time IS 'Start time in HH:MM format';
COMMENT ON COLUMN public.braider_availability.end_time IS 'End time in HH:MM format';
COMMENT ON COLUMN public.braider_availability.is_booked IS 'True if slot is booked';

-- Insert some sample data for testing
INSERT INTO public.braider_availability (braider_id, date, start_time, end_time, is_booked) VALUES
-- Get the first braider ID for testing
(
  (SELECT id FROM public.braiders LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '09:00'::TIME,
  '12:00'::TIME,
  false
),
(
  (SELECT id FROM public.braiders LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day', 
  '14:00'::TIME,
  '17:00'::TIME,
  false
),
(
  (SELECT id FROM public.braiders LIMIT 1),
  CURRENT_DATE + INTERVAL '2 days',
  '10:00'::TIME,
  '13:00'::TIME,
  true
);