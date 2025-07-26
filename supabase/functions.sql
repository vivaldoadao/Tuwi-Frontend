-- Function to automatically create braider profile when user role changes to 'braider'
CREATE OR REPLACE FUNCTION handle_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to braider, ensure braider profile exists
  IF NEW.role = 'braider' AND (OLD.role IS NULL OR OLD.role != 'braider') THEN
    INSERT INTO public.braiders (user_id, bio, location, status)
    VALUES (NEW.id, 'Nova trancista na plataforma', 'A definir', 'pending')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle role changes
CREATE OR REPLACE TRIGGER on_user_role_change
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_role_change();

-- Function to get user with complete profile
CREATE OR REPLACE FUNCTION get_user_profile(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  user_data JSON;
  braider_data JSON;
BEGIN
  -- Get base user data
  SELECT row_to_json(u) INTO user_data
  FROM public.users u
  WHERE u.id = user_id_param;
  
  -- If user is a braider, get braider data too
  IF (SELECT role FROM public.users WHERE id = user_id_param) = 'braider' THEN
    SELECT row_to_json(b) INTO braider_data
    FROM public.braiders b
    WHERE b.user_id = user_id_param;
    
    user_data := user_data || jsonb_build_object('braider_profile', braider_data);
  END IF;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to braider
CREATE OR REPLACE FUNCTION promote_to_braider(
  user_id_param UUID,
  bio_param TEXT DEFAULT 'Nova trancista na plataforma',
  location_param TEXT DEFAULT 'A definir'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Update user role
  UPDATE public.users 
  SET role = 'braider' 
  WHERE id = user_id_param;
  
  -- Insert or update braider profile
  INSERT INTO public.braiders (user_id, bio, location, status)
  VALUES (user_id_param, bio_param, location_param, 'pending')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    status = 'pending';
  
  -- Return updated profile
  SELECT get_user_profile(user_id_param) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve braider
CREATE OR REPLACE FUNCTION approve_braider(braider_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  braider_user_id UUID;
BEGIN
  -- Get user_id from braider
  SELECT user_id INTO braider_user_id
  FROM public.braiders
  WHERE id = braider_id_param;
  
  -- Update braider status
  UPDATE public.braiders 
  SET status = 'approved' 
  WHERE id = braider_id_param;
  
  -- Return updated profile
  SELECT get_user_profile(braider_user_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all pending braiders (admin only)
CREATE OR REPLACE FUNCTION get_pending_braiders()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', b.id,
      'user_id', b.user_id,
      'name', u.name,
      'email', u.email,
      'bio', b.bio,
      'location', b.location,
      'status', b.status,
      'created_at', b.created_at
    )
  ) INTO result
  FROM public.braiders b
  JOIN public.users u ON b.user_id = u.id
  WHERE b.status = 'pending'
  ORDER BY b.created_at DESC;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics (admin only)
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.users),
    'customers', (SELECT COUNT(*) FROM public.users WHERE role = 'customer'),
    'braiders', (SELECT COUNT(*) FROM public.users WHERE role = 'braider'),
    'admins', (SELECT COUNT(*) FROM public.users WHERE role = 'admin'),
    'pending_braiders', (SELECT COUNT(*) FROM public.braiders WHERE status = 'pending'),
    'approved_braiders', (SELECT COUNT(*) FROM public.braiders WHERE status = 'approved'),
    'rejected_braiders', (SELECT COUNT(*) FROM public.braiders WHERE status = 'rejected')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;