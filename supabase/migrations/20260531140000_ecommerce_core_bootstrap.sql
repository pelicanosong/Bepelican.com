-- Core bootstrap: enums + base tables missing from incremental migrations
CREATE SCHEMA IF NOT EXISTS ecommerce;

GRANT USAGE ON SCHEMA ecommerce TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON SCHEMA ecommerce TO postgres, service_role;

CREATE OR REPLACE FUNCTION ecommerce.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TYPE ecommerce.app_role AS ENUM ('user_pelicano', 'nido_proveedor', 'admin');
CREATE TYPE ecommerce.experience_status AS ENUM ('borrador', 'activa', 'pausada', 'eliminada');
CREATE TYPE ecommerce.difficulty_level AS ENUM ('baja', 'media', 'alta');
CREATE TYPE ecommerce.weekday AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
CREATE TYPE ecommerce.experience_language AS ENUM ('espanol', 'ingles', 'portugues', 'frances', 'aleman');

CREATE TABLE ecommerce.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  address text,
  city text,
  department text,
  country text,
  document_type text,
  document_number text,
  business_name text,
  business_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ecommerce.categories_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  display_order integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ecommerce.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  short_description text,
  status ecommerce.experience_status NOT NULL DEFAULT 'borrador',
  price numeric NOT NULL,
  duration_minutes integer NOT NULL,
  max_participants integer NOT NULL DEFAULT 10,
  min_participants integer,
  location_name text NOT NULL,
  location_city text NOT NULL,
  location_department text,
  location_country text,
  location_address text,
  location_lat numeric,
  location_lng numeric,
  cover_image text,
  gallery_images text[],
  includes text[],
  not_includes text[],
  requirements text[],
  itinerary jsonb,
  languages ecommerce.experience_language[],
  available_days ecommerce.weekday[],
  difficulty ecommerce.difficulty_level,
  difficulty_notes text,
  lodging_required boolean NOT NULL DEFAULT false,
  cancellation_policy text,
  cancellation_policy_type text DEFAULT 'flexible',
  start_time time,
  start_time_flexible boolean DEFAULT false,
  display_order integer,
  upsell_priority integer DEFAULT 0,
  arrival_tips text,
  environment_type text[],
  meeting_point_url text,
  end_point text,
  end_point_same boolean DEFAULT true,
  temperature_range text,
  recommended_season text,
  accessible_reduced_mobility boolean DEFAULT false,
  accessible_children boolean DEFAULT false,
  accessibility_notes text,
  extra_language_cost boolean DEFAULT false,
  "Se aceptan mascotas" boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ecommerce.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES ecommerce.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  order_type text NOT NULL DEFAULT 'experience',
  total_amount numeric NOT NULL,
  currency text DEFAULT 'COP',
  payment_provider text,
  shipping_address text,
  shipping_city text,
  shipping_department text,
  shipping_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ecommerce.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES ecommerce.orders(id) ON DELETE CASCADE,
  experience_id uuid REFERENCES ecommerce.experiences(id),
  lodging_id uuid,
  lodging_room_type_id uuid,
  artesania_id uuid,
  artesania_variante_id uuid,
  check_in_date date,
  check_out_date date,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ecommerce.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES ecommerce.orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_reference text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'COP',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ecommerce.experience_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES ecommerce.order_items(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  participants integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ecommerce.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.categories_experience ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ecommerce TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA ecommerce TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA ecommerce TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON TABLES TO service_role;
