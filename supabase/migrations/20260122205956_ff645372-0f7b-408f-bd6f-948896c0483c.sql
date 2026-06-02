-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "only authenticated can insert" ON public.experience_categories;

-- Create admin-only INSERT policy
CREATE POLICY "Only admins can insert experience categories"
ON public.experience_categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only UPDATE policy
CREATE POLICY "Only admins can update experience categories"
ON public.experience_categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only DELETE policy
CREATE POLICY "Only admins can delete experience categories"
ON public.experience_categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));