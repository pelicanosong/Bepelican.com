-- Remove the admin role policy from experiences table since only buyers exist
DROP POLICY IF EXISTS "Admins can update all experiences" ON public.experiences;