-- =====================================================
-- FIX 1: Create the has_role function that RLS policies reference
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- =====================================================
-- FIX 2: Enable RLS on experiences table
-- =====================================================
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Add public read policy for active experiences (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'experiences' 
    AND policyname = 'Public can view active experiences'
  ) THEN
    CREATE POLICY "Public can view active experiences"
    ON public.experiences
    FOR SELECT
    TO anon, authenticated
    USING (status = 'activa'::experience_status);
  END IF;
END $$;

-- =====================================================
-- FIX 3: Create aggregate availability function to protect booking data
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_experience_availability(
  _experience_id uuid,
  _start_date date,
  _end_date date
)
RETURNS TABLE(booking_date date, booked_spots integer) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    eb.booking_date::date as booking_date,
    SUM(eb.participants)::integer as booked_spots
  FROM public.experience_bookings eb
  WHERE eb.experience_id = _experience_id
    AND eb.booking_date BETWEEN _start_date AND _end_date
    AND eb.status = 'confirmed'
  GROUP BY eb.booking_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_experience_availability(uuid, date, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_experience_availability(uuid, date, date) TO authenticated;

-- =====================================================
-- FIX 4: Restrict experience_bookings - remove overly permissive policy
-- =====================================================
DROP POLICY IF EXISTS "Public can view bookings for availability" ON public.experience_bookings;

-- Admins can view all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'experience_bookings' 
    AND policyname = 'Admins can view all bookings'
  ) THEN
    CREATE POLICY "Admins can view all bookings"
    ON public.experience_bookings
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;