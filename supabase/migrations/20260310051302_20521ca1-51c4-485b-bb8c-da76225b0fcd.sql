
-- Add icon, color, display_order columns to categories_experience
ALTER TABLE public.categories_experience
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '📖',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#08949B',
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Allow admins full CRUD on categories_experience
CREATE POLICY "Admins can manage experience categories_crud"
  ON public.categories_experience
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
