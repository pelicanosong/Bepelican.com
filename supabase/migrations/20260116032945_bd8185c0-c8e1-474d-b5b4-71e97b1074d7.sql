-- Add explicit denial policy for anonymous/public access to profiles table
-- This provides defense-in-depth by explicitly denying public access even if RLS were misconfigured

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);