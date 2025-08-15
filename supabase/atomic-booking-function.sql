-- 🔒 ATOMIC BOOKING CREATION FUNCTION
-- This function prevents race conditions in booking creation by using database transactions

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_service_id UUID,
  p_braider_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_service_type TEXT,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_client_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT '',
  p_availability_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  v_booking_id UUID;
  v_service_price DECIMAL;
  v_existing_bookings INTEGER;
  v_availability_booked BOOLEAN;
  v_result JSON;
BEGIN
  -- 1. Validate service exists and get price
  SELECT price INTO v_service_price
  FROM services 
  WHERE id = p_service_id;
  
  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND: Service not found';
  END IF;
  
  -- 2. Check for existing booking conflicts (atomic check)
  -- Multiple conflict checks: same braider/time, same client/time
  SELECT COUNT(*) INTO v_existing_bookings
  FROM bookings
  WHERE (
    -- Same braider, date, and time
    (braider_id = p_braider_id AND booking_date = p_booking_date AND booking_time = p_booking_time)
    OR 
    -- Same client, date, and time
    (client_email = p_client_email AND booking_date = p_booking_date AND booking_time = p_booking_time)
  )
  AND status IN ('pending', 'confirmed')
  FOR UPDATE; -- Lock these records to prevent concurrent modifications
  
  IF v_existing_bookings > 0 THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT: Booking slot already taken';
  END IF;
  
  -- 3. If availability ID provided, check and lock it atomically
  IF p_availability_id IS NOT NULL THEN
    SELECT is_booked INTO v_availability_booked
    FROM braider_availability
    WHERE id = p_availability_id
      AND braider_id = p_braider_id
      AND date = p_booking_date
    FOR UPDATE; -- Lock this availability slot
    
    IF v_availability_booked IS NULL THEN
      RAISE EXCEPTION 'AVAILABILITY_NOT_FOUND: Availability slot not found';
    END IF;
    
    IF v_availability_booked = TRUE THEN
      RAISE EXCEPTION 'AVAILABILITY_TAKEN: Availability slot already booked';
    END IF;
    
    -- Mark availability as booked atomically
    UPDATE braider_availability
    SET 
      is_booked = TRUE,
      updated_at = NOW()
    WHERE id = p_availability_id;
  END IF;
  
  -- 4. Create the booking atomically
  INSERT INTO bookings (
    service_id,
    client_id,
    braider_id,
    booking_date,
    booking_time,
    service_type,
    client_name,
    client_email,
    client_phone,
    client_address,
    status,
    total_amount,
    notes,
    created_at,
    updated_at
  ) VALUES (
    p_service_id,
    NULL, -- Allow null for non-registered clients
    p_braider_id,
    p_booking_date,
    p_booking_time,
    p_service_type,
    p_client_name,
    p_client_email,
    p_client_phone,
    p_client_address,
    'pending',
    v_service_price,
    p_notes,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_booking_id;
  
  -- 5. Return success result
  v_result := json_build_object(
    'booking_id', v_booking_id,
    'total_amount', v_service_price,
    'status', 'pending',
    'message', 'Booking created successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN serialization_failure THEN
    -- Handle concurrent transaction conflicts
    RAISE EXCEPTION 'BOOKING_CONFLICT: Concurrent booking detected, please try again';
  WHEN OTHERS THEN
    -- Re-raise the exception to rollback transaction
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users (public bookings)
GRANT EXECUTE ON FUNCTION create_booking_atomic TO anon;
GRANT EXECUTE ON FUNCTION create_booking_atomic TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_booking_atomic IS 'Atomically creates a booking while preventing race conditions and conflicts';