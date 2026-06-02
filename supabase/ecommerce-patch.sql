-- Patch: tablas faltantes en schema ecommerce (lodgings + blog)
SET search_path TO ecommerce, public;

CREATE TYPE IF NOT EXISTS ecommerce.lodging_type AS ENUM (
  'posada', 'hotel', 'hostal', 'glamping', 'cabaña', 'finca'
);

CREATE TABLE IF NOT EXISTS ecommerce.lodgings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  lodging_type ecommerce.lodging_type NOT NULL DEFAULT 'hotel',
  categories text[] DEFAULT ARRAY[]::text[],
  city text NOT NULL,
  department text,
  address text,
  short_description text,
  long_description text,
  main_image_url text,
  gallery_images text[] DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ecommerce.lodging_room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lodging_id uuid NOT NULL REFERENCES ecommerce.lodgings(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_description text,
  capacity integer NOT NULL DEFAULT 2,
  base_price numeric NOT NULL DEFAULT 0,
  main_image_url text,
  gallery_images text[] DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ecommerce.experience_lodgings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  lodging_id uuid NOT NULL REFERENCES ecommerce.lodgings(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES ecommerce.lodging_room_types(id) ON DELETE SET NULL,
  is_default_option boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experience_id, lodging_id, room_type_id)
);

ALTER TABLE ecommerce.order_items
  ADD COLUMN IF NOT EXISTS lodging_id uuid REFERENCES ecommerce.lodgings(id),
  ADD COLUMN IF NOT EXISTS lodging_room_type_id uuid REFERENCES ecommerce.lodging_room_types(id),
  ADD COLUMN IF NOT EXISTS check_in_date date,
  ADD COLUMN IF NOT EXISTS check_out_date date,
  ADD COLUMN IF NOT EXISTS artesania_id uuid REFERENCES ecommerce.artesanias(id),
  ADD COLUMN IF NOT EXISTS artesania_variante_id uuid REFERENCES ecommerce.artesania_variantes(id);

CREATE TABLE IF NOT EXISTS ecommerce.lodging_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lodging_id uuid NOT NULL REFERENCES ecommerce.lodgings(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ecommerce.room_season_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES ecommerce.lodging_room_types(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES ecommerce.lodging_seasons(id) ON DELETE CASCADE,
  pricing_mode text NOT NULL DEFAULT 'per_room' CHECK (pricing_mode IN ('per_room', 'per_person')),
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_type_id, season_id)
);

CREATE TYPE IF NOT EXISTS ecommerce.blog_category AS ENUM (
  'destinos', 'cultura', 'gastronomia', 'aventura', 'consejos_de_viaje'
);
CREATE TYPE IF NOT EXISTS ecommerce.blog_status AS ENUM ('borrador', 'publicado', 'archivado');

CREATE TABLE IF NOT EXISTS ecommerce.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  category ecommerce.blog_category NOT NULL DEFAULT 'destinos',
  status ecommerce.blog_status NOT NULL DEFAULT 'borrador',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS lodgings
ALTER TABLE ecommerce.lodgings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.lodging_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.experience_lodgings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.lodging_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.room_season_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.blog_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can manage lodgings" ON ecommerce.lodgings FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view active lodgings" ON ecommerce.lodgings FOR SELECT TO anon, authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage room types" ON ecommerce.lodging_room_types FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view active room types" ON ecommerce.lodging_room_types FOR SELECT TO anon, authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage experience lodgings" ON ecommerce.experience_lodgings FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view active experience lodgings" ON ecommerce.experience_lodgings FOR SELECT TO anon, authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage lodging seasons" ON ecommerce.lodging_seasons FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view lodging seasons" ON ecommerce.lodging_seasons FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage room season rates" ON ecommerce.room_season_rates FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view room season rates" ON ecommerce.room_season_rates FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage blog posts" ON ecommerce.blog_posts FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view published blog posts" ON ecommerce.blog_posts FOR SELECT TO anon, authenticated
    USING (status = 'publicado'::ecommerce.blog_status);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION ecommerce.get_lodging_calendar_prices(
  _lodging_id uuid, _room_type_id uuid, _start_date date, _end_date date, _guests integer
)
RETURNS TABLE(calendar_date date, season_name text, pricing_mode text, price_per_night numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ecommerce
AS $$
  SELECT d.dt::date, ls.name, rsr.pricing_mode,
    CASE WHEN rsr.pricing_mode = 'per_person' THEN rsr.price * LEAST(_guests, lrt.capacity) ELSE rsr.price END
  FROM generate_series(_start_date, _end_date, '1 day'::interval) AS d(dt)
  INNER JOIN ecommerce.lodging_seasons ls ON ls.lodging_id = _lodging_id AND d.dt::date BETWEEN ls.start_date AND ls.end_date
  INNER JOIN ecommerce.room_season_rates rsr ON rsr.season_id = ls.id AND rsr.room_type_id = _room_type_id
  INNER JOIN ecommerce.lodging_room_types lrt ON lrt.id = _room_type_id
  WHERE rsr.price > 0;
$$;

GRANT EXECUTE ON FUNCTION ecommerce.get_lodging_calendar_prices(uuid, uuid, date, date, integer) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public) VALUES ('lodgings', 'lodgings', true) ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ecommerce TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA ecommerce TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA ecommerce TO authenticator, service_role;
