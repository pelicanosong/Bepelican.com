
-- Create junction table for many-to-many: experiences <-> categories_experience
CREATE TABLE public.experience_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories_experience(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(experience_id, category_id)
);

-- Enable RLS
ALTER TABLE public.experience_categories ENABLE ROW LEVEL SECURITY;

-- Public can view
CREATE POLICY "Public can view experience categories"
ON public.experience_categories FOR SELECT
USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage experience categories"
ON public.experience_categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_experience_categories_experience ON public.experience_categories(experience_id);
CREATE INDEX idx_experience_categories_category ON public.experience_categories(category_id);

-- Migrate existing category_id data into the junction table
INSERT INTO public.experience_categories (experience_id, category_id)
SELECT id, category_id FROM public.experiences WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
