
-- Enum para categoría del blog
CREATE TYPE public.blog_category AS ENUM (
  'destinos',
  'cultura',
  'gastronomia',
  'aventura',
  'consejos_de_viaje'
);

-- Enum para estado del blog post
CREATE TYPE public.blog_status AS ENUM ('borrador', 'publicado', 'archivado');

-- Tabla principal de blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  category blog_category NOT NULL DEFAULT 'destinos',
  status blog_status NOT NULL DEFAULT 'borrador',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_blog_posts_status ON public.blog_posts (status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts (category);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published_at DESC) WHERE status = 'publicado';

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view published blog posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'publicado'::blog_status);
