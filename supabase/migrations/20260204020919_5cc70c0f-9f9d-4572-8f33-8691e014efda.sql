-- Crear enum para estados de flipbook
CREATE TYPE flipbook_status AS ENUM ('draft', 'published', 'archived');

-- Tabla principal de flipbooks
CREATE TABLE public.flipbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  cover_image text,
  pdf_url text NOT NULL,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  status flipbook_status DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de categorias de flipbooks
CREATE TABLE public.flipbook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'book-open',
  color text DEFAULT '#08949B',
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Relacion many-to-many flipbooks <-> categorias
CREATE TABLE public.flipbook_category_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id uuid REFERENCES public.flipbooks(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.flipbook_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(flipbook_id, category_id)
);

-- Relacion flipbooks <-> experiencias
CREATE TABLE public.flipbook_experience_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id uuid REFERENCES public.flipbooks(id) ON DELETE CASCADE NOT NULL,
  experience_id uuid REFERENCES public.experiences(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(flipbook_id, experience_id)
);

-- Indices para performance
CREATE INDEX idx_flipbooks_status ON public.flipbooks(status);
CREATE INDEX idx_flipbooks_featured ON public.flipbooks(is_featured);
CREATE INDEX idx_flipbooks_view_count ON public.flipbooks(view_count DESC);
CREATE INDEX idx_flipbook_category_relations_flipbook ON public.flipbook_category_relations(flipbook_id);
CREATE INDEX idx_flipbook_category_relations_category ON public.flipbook_category_relations(category_id);

-- RLS Policies
ALTER TABLE public.flipbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_experience_links ENABLE ROW LEVEL SECURITY;

-- Flipbooks: Lectura publica para publicados
CREATE POLICY "Public can view published flipbooks"
ON public.flipbooks FOR SELECT
USING (status = 'published');

-- Flipbooks: Admins pueden ver todos
CREATE POLICY "Admins can view all flipbooks"
ON public.flipbooks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Flipbooks: Admins pueden insertar
CREATE POLICY "Admins can insert flipbooks"
ON public.flipbooks FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Flipbooks: Admins pueden actualizar
CREATE POLICY "Admins can update flipbooks"
ON public.flipbooks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Flipbooks: Admins pueden eliminar
CREATE POLICY "Admins can delete flipbooks"
ON public.flipbooks FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Categorias: Lectura publica
CREATE POLICY "Public can view flipbook categories"
ON public.flipbook_categories FOR SELECT
USING (true);

-- Categorias: Admins pueden gestionar
CREATE POLICY "Admins can manage flipbook categories"
ON public.flipbook_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Relaciones categoria: Lectura publica
CREATE POLICY "Public can view category relations"
ON public.flipbook_category_relations FOR SELECT
USING (true);

-- Relaciones categoria: Admins pueden gestionar
CREATE POLICY "Admins can manage category relations"
ON public.flipbook_category_relations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Links experiencias: Lectura publica
CREATE POLICY "Public can view experience links"
ON public.flipbook_experience_links FOR SELECT
USING (true);

-- Links experiencias: Admins pueden gestionar
CREATE POLICY "Admins can manage experience links"
ON public.flipbook_experience_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_flipbooks_updated_at
BEFORE UPDATE ON public.flipbooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para flipbooks
INSERT INTO storage.buckets (id, name, public)
VALUES ('flipbooks', 'flipbooks', true);

-- Storage: Lectura publica
CREATE POLICY "Public can read flipbook files"
ON storage.objects FOR SELECT
USING (bucket_id = 'flipbooks');

-- Storage: Solo admins pueden subir
CREATE POLICY "Admins can upload flipbook files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flipbooks' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Storage: Solo admins pueden actualizar
CREATE POLICY "Admins can update flipbook files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'flipbooks' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Storage: Solo admins pueden eliminar
CREATE POLICY "Admins can delete flipbook files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flipbooks' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Seed data: Categorias iniciales
INSERT INTO public.flipbook_categories (name, slug, description, icon, color, display_order) VALUES
('Aventura', 'aventura', 'Expediciones y experiencias de aventura', 'mountain', '#08949B', 1),
('Bienestar', 'bienestar', 'Retiros y experiencias de bienestar', 'heart', '#89A632', 2),
('Colombia Profunda', 'colombia-profunda', 'Descubre la esencia de Colombia', 'map-pin', '#F98419', 3),
('Bitácoras de Clientes', 'bitacoras-clientes', 'Historias contadas por nuestros viajeros', 'users', '#BB7B58', 4),
('Guías de Viaje', 'guias', 'Itinerarios y consejos de viaje', 'compass', '#1C2F48', 5),
('Inspiración', 'inspiracion', 'Ideas para tu próximo viaje', 'sparkles', '#E1B58D', 6);