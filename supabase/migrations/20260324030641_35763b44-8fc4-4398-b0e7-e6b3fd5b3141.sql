-- =============================================
-- FASE 1: Sistema de Hospedajes para BePelican
-- =============================================

-- 1. Crear enum para tipos de hospedaje
CREATE TYPE public.lodging_type AS ENUM (
  'posada', 'hotel', 'hostal', 'glamping', 'cabaña', 'finca'
);

-- 2. Tabla lodgings (hospedajes independientes)
CREATE TABLE public.lodgings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  lodging_type lodging_type NOT NULL DEFAULT 'hotel',
  categories text[] DEFAULT ARRAY[]::text[],
  city text NOT NULL,
  address text,
  short_description text,
  long_description text,
  main_image_url text,
  gallery_images text[] DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabla lodging_room_types (tipos de habitación)
CREATE TABLE public.lodging_room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lodging_id uuid NOT NULL REFERENCES public.lodgings(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_description text,
  capacity integer NOT NULL DEFAULT 2,
  base_price numeric NOT NULL DEFAULT 0,
  main_image_url text,
  gallery_images text[] DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabla pivote experience_lodgings
CREATE TABLE public.experience_lodgings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  lodging_id uuid NOT NULL REFERENCES public.lodgings(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES public.lodging_room_types(id) ON DELETE SET NULL,
  is_default_option boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experience_id, lodging_id, room_type_id)
);

-- 5. Extender order_items con campos de hospedaje
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS lodging_id uuid REFERENCES public.lodgings(id),
  ADD COLUMN IF NOT EXISTS lodging_room_type_id uuid REFERENCES public.lodging_room_types(id),
  ADD COLUMN IF NOT EXISTS check_in_date date,
  ADD COLUMN IF NOT EXISTS check_out_date date;

-- 6. Trigger updated_at para lodgings
CREATE TRIGGER update_lodgings_updated_at
  BEFORE UPDATE ON public.lodgings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Bucket de storage público para imágenes de hospedajes
INSERT INTO storage.buckets (id, name, public)
VALUES ('lodgings', 'lodgings', true)
ON CONFLICT (id) DO NOTHING;

-- 8. RLS para lodgings
CREATE POLICY "Admins can manage lodgings"
  ON public.lodgings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active lodgings"
  ON public.lodgings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 9. RLS para lodging_room_types
CREATE POLICY "Admins can manage room types"
  ON public.lodging_room_types FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active room types"
  ON public.lodging_room_types FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 10. RLS para experience_lodgings
CREATE POLICY "Admins can manage experience lodgings"
  ON public.experience_lodgings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active experience lodgings"
  ON public.experience_lodgings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 11. Storage policies para bucket lodgings
CREATE POLICY "Anyone can view lodging images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lodgings');

CREATE POLICY "Admins can upload lodging images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lodgings' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lodging images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lodgings' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lodging images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lodgings' AND has_role(auth.uid(), 'admin'::app_role));