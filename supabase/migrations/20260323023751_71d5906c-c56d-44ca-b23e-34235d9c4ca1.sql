
-- 1. Create enums
CREATE TYPE public.artesania_categoria AS ENUM ('mochilas', 'portavasos', 'correas', 'manillas');
CREATE TYPE public.artesania_estado AS ENUM ('borrador', 'publicado', 'desactivado');

-- 2. Create artesanias table
CREATE TABLE public.artesanias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria artesania_categoria NOT NULL,
  comunidad TEXT,
  titulo TEXT NOT NULL,
  descripcion_corta TEXT NOT NULL,
  descripcion_larga TEXT NOT NULL,
  historia TEXT NOT NULL,
  significado TEXT,
  tiempo_elaboracion TEXT NOT NULL,
  imagen_principal TEXT,
  galeria TEXT[] DEFAULT '{}'::TEXT[],
  precio_desde NUMERIC NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP',
  impacto_descripcion TEXT NOT NULL,
  material TEXT NOT NULL,
  dimensiones TEXT,
  cuidados TEXT,
  tiempo_entrega TEXT NOT NULL,
  estado artesania_estado NOT NULL DEFAULT 'borrador',
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create artesania_variantes table
CREATE TABLE public.artesania_variantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artesania_id UUID NOT NULL REFERENCES public.artesanias(id) ON DELETE CASCADE,
  variante_nombre TEXT NOT NULL,
  atributos JSONB NOT NULL DEFAULT '{}',
  precio NUMERIC NOT NULL,
  stock INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Updated_at trigger for artesanias
CREATE TRIGGER update_artesanias_updated_at
  BEFORE UPDATE ON public.artesanias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS on artesanias
ALTER TABLE public.artesanias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage artesanias" ON public.artesanias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view published artesanias" ON public.artesanias
  FOR SELECT TO anon, authenticated
  USING (estado = 'publicado');

-- 6. RLS on artesania_variantes
ALTER TABLE public.artesania_variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage artesania variantes" ON public.artesania_variantes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view variantes of published artesanias" ON public.artesania_variantes
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.artesanias WHERE id = artesania_id AND estado = 'publicado'
  ));

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('artesanias', 'artesanias', true);

-- 8. Storage RLS policies
CREATE POLICY "Anyone can view artesanias images" ON storage.objects
  FOR SELECT USING (bucket_id = 'artesanias');

CREATE POLICY "Admins can upload artesanias images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artesanias' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update artesanias images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'artesanias' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete artesanias images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'artesanias' AND public.has_role(auth.uid(), 'admin'));
