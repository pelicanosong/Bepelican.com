
-- Table for hero carousel slides
CREATE TABLE public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  badge text,
  title text NOT NULL,
  highlight text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for hero images
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view hero images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hero-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-images' AND public.has_role(auth.uid(), 'admin'));
