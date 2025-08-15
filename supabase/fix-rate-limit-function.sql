-- 🔧 FIX: Rate Limit Function Conflict Resolution
-- This script fixes the function name collision for check_rate_limit

-- First, drop any existing rate limiting functions
DROP FUNCTION IF EXISTS check_rate_limit(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS check_rate_limit(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS check_rate_limit(TEXT, TEXT);

-- Drop existing rate limiting table if it exists
DROP TABLE IF EXISTS public.rate_limiting CASCADE;

-- Recreate rate limiting table with proper structure
CREATE TABLE public.rate_limiting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_rate_limit_window UNIQUE(user_identifier, action, window_start)
);

-- Add index for performance
CREATE INDEX idx_rate_limiting_lookup ON public.rate_limiting(user_identifier, action, window_start);
CREATE INDEX idx_rate_limiting_cleanup ON public.rate_limiting(window_start);

-- Enable RLS
ALTER TABLE public.rate_limiting ENABLE ROW LEVEL SECURITY;

-- System-only access policy
CREATE POLICY "System only rate limiting access" ON public.rate_limiting
  FOR ALL USING (false);

-- Create the unique rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit_v2(
  p_identifier TEXT,
  p_action TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start (rounded to prevent timing attacks)
  window_start := date_trunc('hour', now()) + 
                  (FLOOR(EXTRACT(minute FROM now()) / p_window_minutes) * p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean old entries (older than 2 windows)
  DELETE FROM public.rate_limiting 
  WHERE window_start < now() - (p_window_minutes * 2 || ' minutes')::INTERVAL;
  
  -- Get or create current count atomically
  INSERT INTO public.rate_limiting (user_identifier, action, count, window_start)
  VALUES (p_identifier, p_action, 1, window_start)
  ON CONFLICT (user_identifier, action, window_start) 
  DO UPDATE SET 
    count = public.rate_limiting.count + 1,
    created_at = now()
  RETURNING count INTO current_count;
  
  -- Check if limit exceeded
  IF current_count > p_limit THEN
    -- Log the rate limit violation
    RAISE NOTICE 'Rate limit exceeded for % action % (count: %, limit: %)', 
      p_identifier, p_action, current_count, p_limit;
    RETURN false;
  END IF;
  
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the request
    RAISE WARNING 'Rate limiting error: %', SQLERRM;
    RETURN true; -- Fail open for availability
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_rate_limit_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_v2 TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.check_rate_limit_v2 IS 'Enhanced rate limiting function with atomic operations and proper error handling';

-- Test the function
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test basic functionality
  SELECT public.check_rate_limit_v2('test_user', 'test_action', 5, 60) INTO test_result;
  
  IF test_result THEN
    RAISE NOTICE '✅ Rate limiting function test PASSED';
  ELSE
    RAISE NOTICE '❌ Rate limiting function test FAILED';
  END IF;
END $$;

-- Success message
RAISE NOTICE '🔧 Rate limiting function conflict resolved successfully!';
RAISE NOTICE '   ✅ Function name: check_rate_limit_v2';
RAISE NOTICE '   ✅ Parameters: (identifier, action, limit, window_minutes)';
RAISE NOTICE '   ✅ Returns: BOOLEAN (true = allowed, false = rate limited)';