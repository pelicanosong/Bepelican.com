-- BePelican ecommerce schema (generated)
SET client_min_messages TO WARNING;

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


-- === 20260112013215_3e56a204-0c32-41f3-85bf-6610cab05033.sql ===
-- Remove the admin role policy from experiences table since only buyers exist
DROP POLICY IF EXISTS "Admins can update all experiences" ON ecommerce.experiences;

-- === 20260112020129_b05e89f8-706e-411e-83a6-efed34020e9d.sql ===
-- Enable RLS on tables that need it
ALTER TABLE ecommerce.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.categories_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.experience_bookings ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access (experiences catalog)
CREATE POLICY "Categories are viewable by everyone" 
ON ecommerce.categories_experience 
FOR SELECT 
USING (is_active = true);

-- Orders: Users manage their own orders
CREATE POLICY "Users can create own orders" 
ON ecommerce.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" 
ON ecommerce.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders" 
ON ecommerce.orders 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can manage items in their own orders
CREATE POLICY "Users can create items in own orders" 
ON ecommerce.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ecommerce.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view items in own orders" 
ON ecommerce.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ecommerce.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" 
ON ecommerce.payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ecommerce.orders 
    WHERE orders.id = payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Experience Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings" 
ON ecommerce.experience_bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ecommerce.order_items oi
    JOIN ecommerce.orders o ON o.id = oi.order_id
    WHERE oi.id = experience_bookings.order_item_id
    AND o.user_id = auth.uid()
  )
);

-- === 20260112172247_29b8559a-53bd-4929-a003-e05daeffe627.sql ===
-- Add explicit RLS policies for experience_bookings to document security model
-- Bookings can only be created by the system (webhook with service role)

-- Explicitly deny client-side INSERT (already blocked by default, but makes intent clear)
CREATE POLICY "Bookings created by system only"
ON ecommerce.experience_bookings
FOR INSERT
WITH CHECK (false);

-- Explicitly deny client-side UPDATE (already blocked by default)
CREATE POLICY "No client updates to bookings"
ON ecommerce.experience_bookings
FOR UPDATE
USING (false);

-- Explicitly deny client-side DELETE
CREATE POLICY "No client deletes of bookings"
ON ecommerce.experience_bookings
FOR DELETE
USING (false);

-- Fix the race condition: prevent users from updating orders entirely
-- Order cancellation should be handled through a dedicated RPC if needed
DROP POLICY IF EXISTS "Users can update own pending orders" ON ecommerce.orders;

-- Create a restrictive policy that prevents all user updates
-- (order status changes should happen via webhook/system only)
CREATE POLICY "Users cannot update orders"
ON ecommerce.orders
FOR UPDATE
USING (false);

-- === 20260115001622_8c13893c-98d9-49ff-9263-750d83a2f764.sql ===
-- Create user_roles table for role management
CREATE TABLE ecommerce.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role ecommerce.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE ecommerce.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON ecommerce.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admin policies for experiences table
CREATE POLICY "Admins can view all experiences"
ON ecommerce.experiences FOR SELECT
TO authenticated
USING (ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert experiences"
ON ecommerce.experiences FOR INSERT
TO authenticated
WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update experiences"
ON ecommerce.experiences FOR UPDATE
TO authenticated
USING (ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete experiences"
ON ecommerce.experiences FOR DELETE
TO authenticated
USING (ecommerce.has_role(auth.uid(), 'admin'));

-- === 20260115042740_3eb92148-e223-4047-8fca-c73e1d769ecd.sql ===
-- Add policy to allow public read of bookings for availability calculation
-- This is safe because experience_bookings doesn't contain PII directly
CREATE POLICY "Public can view bookings for availability" 
ON ecommerce.experience_bookings 
FOR SELECT 
USING (true);

-- === 20260115060432_7ee9f7e6-b392-4b04-b5d2-df2509d43eee.sql ===
-- Add explicit RLS policies to deny client-side modifications to payments
-- Payments must be created via edge functions with service role

-- Deny all client-side INSERT to payments
CREATE POLICY "Payments created by system only"
ON ecommerce.payments
FOR INSERT
WITH CHECK (false);

-- Deny all client-side UPDATE to payments
CREATE POLICY "No client updates to payments"
ON ecommerce.payments
FOR UPDATE
USING (false);

-- Deny all client-side DELETE to payments
CREATE POLICY "No client deletes of payments"
ON ecommerce.payments
FOR DELETE
USING (false);

-- === 20260116031602_08a63e95-6d6b-402c-a6da-4a5f4f07f079.sql ===
-- =====================================================
-- FIX 1: Create the has_role function that RLS policies reference
-- =====================================================
CREATE OR REPLACE FUNCTION ecommerce.has_role(_user_id uuid, _role ecommerce.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ecommerce
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ecommerce.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION ecommerce.has_role(uuid, ecommerce.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION ecommerce.has_role(uuid, ecommerce.app_role) TO anon;

-- =====================================================
-- FIX 2: Enable RLS on experiences table
-- =====================================================
ALTER TABLE ecommerce.experiences ENABLE ROW LEVEL SECURITY;

-- Add public read policy for active experiences (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'experiences' 
    AND policyname = 'Public can view active experiences'
  ) THEN
    CREATE POLICY "Public can view active experiences"
    ON ecommerce.experiences
    FOR SELECT
    TO anon, authenticated
    USING (status = 'activa'::experience_status);
  END IF;
END $$;

-- =====================================================
-- FIX 3: Create aggregate availability function to protect booking data
-- =====================================================
CREATE OR REPLACE FUNCTION ecommerce.get_experience_availability(
  _experience_id uuid,
  _start_date date,
  _end_date date
)
RETURNS TABLE(booking_date date, booked_spots integer) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ecommerce
AS $$
  SELECT 
    eb.booking_date::date as booking_date,
    SUM(eb.participants)::integer as booked_spots
  FROM ecommerce.experience_bookings eb
  WHERE eb.experience_id = _experience_id
    AND eb.booking_date BETWEEN _start_date AND _end_date
    AND eb.status = 'confirmed'
  GROUP BY eb.booking_date;
$$;

GRANT EXECUTE ON FUNCTION ecommerce.get_experience_availability(uuid, date, date) TO anon;
GRANT EXECUTE ON FUNCTION ecommerce.get_experience_availability(uuid, date, date) TO authenticated;

-- =====================================================
-- FIX 4: Restrict experience_bookings - remove overly permissive policy
-- =====================================================
DROP POLICY IF EXISTS "Public can view bookings for availability" ON ecommerce.experience_bookings;

-- Admins can view all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'experience_bookings' 
    AND policyname = 'Admins can view all bookings'
  ) THEN
    CREATE POLICY "Admins can view all bookings"
    ON ecommerce.experience_bookings
    FOR SELECT
    TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- === 20260116032945_bd8185c0-c8e1-474d-b5b4-71e97b1074d7.sql ===
-- Add explicit denial policy for anonymous/public access to profiles table
-- This provides defense-in-depth by explicitly denying public access even if RLS were misconfigured

CREATE POLICY "Deny anonymous access to profiles"
ON ecommerce.profiles
FOR SELECT
TO anon
USING (false);

-- === 20260116041452_7c79fe33-e055-4af3-bda9-abf0ba31c46c.sql ===
-- Add storage policies for experiences bucket to allow admin uploads

-- Policy: Allow public read access to experience images
CREATE POLICY "Public read access for experience images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'experiences');

-- Policy: Allow admins to upload experience images
CREATE POLICY "Admin users can upload experience images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'experiences' 
  AND ecommerce.has_role(auth.uid(), 'admin')
);

-- Policy: Allow admins to update experience images
CREATE POLICY "Admin users can update experience images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'experiences' 
  AND ecommerce.has_role(auth.uid(), 'admin')
);

-- Policy: Allow admins to delete experience images
CREATE POLICY "Admin users can delete experience images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'experiences' 
  AND ecommerce.has_role(auth.uid(), 'admin')
);

-- === 20260121162408_81b791f2-1f63-44c0-91d1-85dc314ef56d.sql ===
-- Add document fields to profiles table for checkout sync
ALTER TABLE ecommerce.profiles 
ADD COLUMN IF NOT EXISTS document_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS document_number text DEFAULT NULL;

-- === 20260122205956_ff645372-0f7b-408f-bd6f-948896c0483c.sql ===
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "only authenticated can insert" ON ecommerce.experience_categories;

-- Create admin-only INSERT policy
CREATE POLICY "Only admins can insert experience categories"
ON ecommerce.experience_categories
FOR INSERT
TO authenticated
WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only UPDATE policy
CREATE POLICY "Only admins can update experience categories"
ON ecommerce.experience_categories
FOR UPDATE
TO authenticated
USING (ecommerce.has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only DELETE policy
CREATE POLICY "Only admins can delete experience categories"
ON ecommerce.experience_categories
FOR DELETE
TO authenticated
USING (ecommerce.has_role(auth.uid(), 'admin'::app_role));

-- === 20260122211746_f1815fe5-b41c-41cf-ab34-0a3722505604.sql ===
-- Add explicit denial policies for user_roles table to prevent privilege escalation
-- Role assignments should only be managed by system/admin via service role

-- Deny all client-side INSERT operations
CREATE POLICY "Role assignments managed by system only"
ON ecommerce.user_roles
FOR INSERT
WITH CHECK (false);

-- Deny all client-side UPDATE operations
CREATE POLICY "No client updates to roles"
ON ecommerce.user_roles
FOR UPDATE
USING (false);

-- Deny all client-side DELETE operations
CREATE POLICY "No client deletes of roles"
ON ecommerce.user_roles
FOR DELETE
USING (false);

-- === 20260124022645_bbafcf94-94e4-42d1-b154-218eff7995e8.sql ===
-- Add upsell_priority to experiences table
ALTER TABLE ecommerce.experiences 
ADD COLUMN IF NOT EXISTS upsell_priority integer DEFAULT 0;

-- Create destinations table for geographic grouping
CREATE TABLE IF NOT EXISTS ecommerce.destinations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  department text,
  country text DEFAULT 'Colombia',
  nearby_destination_ids uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on destinations
ALTER TABLE ecommerce.destinations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Destinations are viewable by everyone" 
ON ecommerce.destinations 
FOR SELECT 
USING (true);

-- Only admins can manage destinations
CREATE POLICY "Admins can insert destinations" 
ON ecommerce.destinations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update destinations" 
ON ecommerce.destinations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete destinations" 
ON ecommerce.destinations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add destination_id foreign key to experiences
ALTER TABLE ecommerce.experiences 
ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES ecommerce.destinations(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_experiences_destination_id ON ecommerce.experiences(destination_id);
CREATE INDEX IF NOT EXISTS idx_experiences_upsell_priority ON ecommerce.experiences(upsell_priority);

-- Add trigger for updated_at on destinations
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON ecommerce.destinations
FOR EACH ROW
EXECUTE FUNCTION ecommerce.update_updated_at_column();

-- === 20260204020919_5cc70c0f-9f9d-4572-8f33-8691e014efda.sql ===
-- Crear enum para estados de flipbook
CREATE TYPE ecommerce.flipbook_status AS ENUM ('draft', 'published', 'archived');

-- Tabla principal de flipbooks
CREATE TABLE ecommerce.flipbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  cover_image text,
  pdf_url text NOT NULL,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  status ecommerce.flipbook_status DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de categorias de flipbooks
CREATE TABLE ecommerce.flipbook_categories (
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
CREATE TABLE ecommerce.flipbook_category_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id uuid REFERENCES ecommerce.flipbooks(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES ecommerce.flipbook_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(flipbook_id, category_id)
);

-- Relacion flipbooks <-> experiencias
CREATE TABLE ecommerce.flipbook_experience_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id uuid REFERENCES ecommerce.flipbooks(id) ON DELETE CASCADE NOT NULL,
  experience_id uuid REFERENCES ecommerce.experiences(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(flipbook_id, experience_id)
);

-- Indices para performance
CREATE INDEX idx_flipbooks_status ON ecommerce.flipbooks(status);
CREATE INDEX idx_flipbooks_featured ON ecommerce.flipbooks(is_featured);
CREATE INDEX idx_flipbooks_view_count ON ecommerce.flipbooks(view_count DESC);
CREATE INDEX idx_flipbook_category_relations_flipbook ON ecommerce.flipbook_category_relations(flipbook_id);
CREATE INDEX idx_flipbook_category_relations_category ON ecommerce.flipbook_category_relations(category_id);

-- RLS Policies
ALTER TABLE ecommerce.flipbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.flipbook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.flipbook_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.flipbook_experience_links ENABLE ROW LEVEL SECURITY;

-- Flipbooks: Lectura publica para publicados
CREATE POLICY "Public can view published flipbooks"
ON ecommerce.flipbooks FOR SELECT
USING (status = 'published');

-- Flipbooks: Admins pueden ver todos
CREATE POLICY "Admins can view all flipbooks"
ON ecommerce.flipbooks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Flipbooks: Admins pueden insertar
CREATE POLICY "Admins can insert flipbooks"
ON ecommerce.flipbooks FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Flipbooks: Admins pueden actualizar
CREATE POLICY "Admins can update flipbooks"
ON ecommerce.flipbooks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Flipbooks: Admins pueden eliminar
CREATE POLICY "Admins can delete flipbooks"
ON ecommerce.flipbooks FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Categorias: Lectura publica
CREATE POLICY "Public can view flipbook categories"
ON ecommerce.flipbook_categories FOR SELECT
USING (true);

-- Categorias: Admins pueden gestionar
CREATE POLICY "Admins can manage flipbook categories"
ON ecommerce.flipbook_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Relaciones categoria: Lectura publica
CREATE POLICY "Public can view category relations"
ON ecommerce.flipbook_category_relations FOR SELECT
USING (true);

-- Relaciones categoria: Admins pueden gestionar
CREATE POLICY "Admins can manage category relations"
ON ecommerce.flipbook_category_relations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Links experiencias: Lectura publica
CREATE POLICY "Public can view experience links"
ON ecommerce.flipbook_experience_links FOR SELECT
USING (true);

-- Links experiencias: Admins pueden gestionar
CREATE POLICY "Admins can manage experience links"
ON ecommerce.flipbook_experience_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_flipbooks_updated_at
BEFORE UPDATE ON ecommerce.flipbooks
FOR EACH ROW
EXECUTE FUNCTION ecommerce.update_updated_at_column();

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
INSERT INTO ecommerce.flipbook_categories (name, slug, description, icon, color, display_order) VALUES
('Aventura', 'aventura', 'Expediciones y experiencias de aventura', 'mountain', '#08949B', 1),
('Bienestar', 'bienestar', 'Retiros y experiencias de bienestar', 'heart', '#89A632', 2),
('Colombia Profunda', 'colombia-profunda', 'Descubre la esencia de Colombia', 'map-pin', '#F98419', 3),
('Bitácoras de Clientes', 'bitacoras-clientes', 'Historias contadas por nuestros viajeros', 'users', '#BB7B58', 4),
('Guías de Viaje', 'guias', 'Itinerarios y consejos de viaje', 'compass', '#1C2F48', 5),
('Inspiración', 'inspiracion', 'Ideas para tu próximo viaje', 'sparkles', '#E1B58D', 6);

-- === 20260209004733_33835fef-488d-4e4e-b1a9-9b4e0dcf8e0d.sql ===
UPDATE ecommerce.flipbooks SET status = 'published' WHERE id = 'b6c102c1-809e-4180-bc05-accc37271f55' AND status = 'draft';

-- === 20260218233758_e8603270-b1ea-4b9c-a6d5-3a6e3d6722ac.sql ===

-- 1. Duration unit enum
CREATE TYPE ecommerce.duration_unit AS ENUM ('minutes', 'hours', 'days');

-- 2. Add duration_unit to experiences (keeps duration_minutes as canonical value in minutes)
ALTER TABLE ecommerce.experiences 
  ADD COLUMN duration_unit ecommerce.duration_unit NOT NULL DEFAULT 'minutes';

-- 3. Pricing type enum  
CREATE TYPE ecommerce.pricing_type AS ENUM ('fixed', 'per_person', 'per_origin', 'per_accommodation');

-- 4. Add pricing_type to experiences
ALTER TABLE ecommerce.experiences 
  ADD COLUMN pricing_type ecommerce.pricing_type NOT NULL DEFAULT 'fixed';

-- 5. Pricing rules table
CREATE TABLE ecommerce.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  rule_type ecommerce.pricing_type NOT NULL,
  label TEXT NOT NULL,
  min_pax INT,
  max_pax INT,
  price NUMERIC NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE ecommerce.pricing_rules ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies
CREATE POLICY "Public can view active pricing rules"
  ON ecommerce.pricing_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing rules"
  ON ecommerce.pricing_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Index for fast lookups
CREATE INDEX idx_pricing_rules_experience ON ecommerce.pricing_rules(experience_id);


-- === 20260218235816_9d105070-d1f2-41fd-b516-a470932894aa.sql ===
-- 1. Add new pricing_type enum value
ALTER TYPE ecommerce.pricing_type ADD VALUE IF NOT EXISTS 'per_origin_accommodation';

-- 2. Add origin_label column to pricing_rules
ALTER TABLE ecommerce.pricing_rules
ADD COLUMN IF NOT EXISTS origin_label text DEFAULT NULL;

-- 3. Add index for efficient grouping by origin
CREATE INDEX IF NOT EXISTS idx_pricing_rules_origin ON ecommerce.pricing_rules (experience_id, origin_label) WHERE origin_label IS NOT NULL;


-- === 20260224174705_fb3200b1-c1aa-4475-92ad-966dcc6e7499.sql ===

-- Create junction table for many-to-many: experiences <-> categories_experience
CREATE TABLE ecommerce.experience_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES ecommerce.categories_experience(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(experience_id, category_id)
);

-- Enable RLS
ALTER TABLE ecommerce.experience_categories ENABLE ROW LEVEL SECURITY;

-- Public can view
CREATE POLICY "Public can view experience categories"
ON ecommerce.experience_categories FOR SELECT
USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage experience categories"
ON ecommerce.experience_categories FOR ALL
USING (ecommerce.has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_experience_categories_experience ON ecommerce.experience_categories(experience_id);
CREATE INDEX idx_experience_categories_category ON ecommerce.experience_categories(category_id);

-- Migrate existing category_id data into the junction table
-- skipped category_id migration seed
ON CONFLICT DO NOTHING;


-- === 20260228210128_f1571b45-6e4f-4674-be04-ca0c22bbc50e.sql ===

-- =============================================
-- LIMPIEZA DE BASE DE DATOS: Eliminar lo no usado
-- =============================================

-- 1. Eliminar tablas de librería digital (no usadas en frontend)
-- skipped library cleanup

-- 3. Eliminar política RLS duplicada en experiences
-- "Published experiences are viewable by everyone" es idéntica a "Public can view active experiences"
DROP POLICY IF EXISTS "Published experiences are viewable by everyone" ON ecommerce.experiences;

-- 4. Hacer category_id nullable (ahora se usa junction table experience_categories)
-- skipped category_id nullable


-- === 20260228212153_ead3d500-4596-4e1d-97c4-135fc288a9db.sql ===

-- Table for hero carousel slides
CREATE TABLE ecommerce.hero_slides (
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
ALTER TABLE ecommerce.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
  ON ecommerce.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hero slides"
  ON ecommerce.hero_slides FOR ALL
  USING (ecommerce.has_role(auth.uid(), 'admin'));

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
  WITH CHECK (bucket_id = 'hero-images' AND ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hero-images' AND ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-images' AND ecommerce.has_role(auth.uid(), 'admin'));


-- === 20260305035929_39403108-be35-452a-8307-8fdf335b1b28.sql ===

-- Table for blocked dates per experience
CREATE TABLE ecommerce.experience_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(experience_id, blocked_date)
);

-- Enable RLS
ALTER TABLE ecommerce.experience_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Public can read blocked dates (needed for calendar)
CREATE POLICY "Public can view blocked dates"
  ON ecommerce.experience_blocked_dates
  FOR SELECT
  USING (true);

-- Admins can manage blocked dates
CREATE POLICY "Admins can manage blocked dates"
  ON ecommerce.experience_blocked_dates
  FOR ALL
  USING (ecommerce.has_role(auth.uid(), 'admin'));


-- === 20260307180503_7fcc7856-e196-49d1-b762-36851b0be7b9.sql ===

-- Add new columns to experiences table for enhanced form
ALTER TABLE ecommerce.experiences
  ADD COLUMN IF NOT EXISTS environment_type text,
  ADD COLUMN IF NOT EXISTS meeting_point_url text,
  ADD COLUMN IF NOT EXISTS end_point text,
  ADD COLUMN IF NOT EXISTS end_point_same boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_time_flexible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS temperature_range text,
  ADD COLUMN IF NOT EXISTS recommended_season text,
  ADD COLUMN IF NOT EXISTS accessible_reduced_mobility boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessible_children boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_notes text,
  ADD COLUMN IF NOT EXISTS cancellation_policy_type text DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS difficulty_notes text,
  ADD COLUMN IF NOT EXISTS extra_language_cost boolean DEFAULT false;


-- === 20260309235615_b2ee25d8-3e86-42f9-bf0b-ad2951c5d301.sql ===
ALTER TABLE ecommerce.experiences 
ALTER COLUMN environment_type TYPE text[] 
USING CASE 
  WHEN environment_type IS NULL THEN NULL 
  ELSE ARRAY[environment_type] 
END;

-- === 20260310005221_79e8568a-8fad-49d2-841e-4a688e381c30.sql ===
ALTER TABLE ecommerce.experiences ADD COLUMN itinerary jsonb DEFAULT NULL;

-- === 20260310050924_862fc9ca-8668-46db-8704-5c32ff29b8c7.sql ===

-- Create FAQs table
CREATE TABLE ecommerce.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ecommerce.faqs ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs
CREATE POLICY "Public can view active faqs"
  ON ecommerce.faqs
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage faqs"
  ON ecommerce.faqs
  FOR ALL
  TO authenticated
  USING (ecommerce.has_role(auth.uid(), 'admin'))
  WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'));

-- Seed existing FAQs
INSERT INTO ecommerce.faqs (question, answer, category, display_order) VALUES
('¿Qué hace diferente a BePelican de otras agencias de viajes?', 'BePelican diseña experiencias de turismo de transformación que conectan a los viajeros con comunidades locales, cultura y naturaleza en Colombia. Cada experiencia busca generar impacto positivo en los territorios mientras el viajero vive algo auténtico, seguro y bien organizado.', 'general', 1),
('¿Qué incluye cada experiencia o tour?', 'Cada experiencia incluye actividades guiadas, acompañamiento de anfitriones o guías locales y la logística necesaria para desarrollar la actividad. Algunas experiencias también incluyen transporte, alimentación o aportes a proyectos comunitarios. Todos los detalles están especificados en la descripción de cada experiencia.', 'general', 2),
('¿Cómo puedo reservar una experiencia?', 'Solo debes seleccionar la experiencia que te interesa, elegir la fecha disponible y completar el proceso de reserva en línea. Una vez realizado el pago recibirás la confirmación con toda la información del tour.', 'reservas', 3),
('¿Puedo hablar con alguien antes de hacer la reserva?', 'Sí. Si tienes dudas o quieres recomendaciones, puedes escribirnos por WhatsApp, correo o a través del formulario de contacto. Nuestro equipo puede ayudarte a elegir la experiencia que mejor se adapte a tu tiempo e intereses.', 'reservas', 4),
('¿Qué medios de pago aceptan?', 'Aceptamos los medios de pago electrónicos habituales en Colombia, como PSE y tarjetas de crédito o débito, a través de una pasarela de pagos segura.', 'pagos', 5),
('¿Es seguro realizar el pago en la plataforma?', 'Sí. Los pagos se procesan a través de una pasarela certificada que utiliza sistemas de cifrado y seguridad para proteger la información financiera de los usuarios.', 'pagos', 6),
('¿Puedo reservar para varias personas en una sola compra?', 'Sí. Durante el proceso de reserva puedes seleccionar el número de personas que participarán en la experiencia, siempre que haya disponibilidad de cupos.', 'reservas', 7),
('¿Puedo pagar solo una parte al reservar?', 'En algunas experiencias es posible reservar con un anticipo y pagar el saldo restante antes del viaje. Las condiciones específicas se indican en cada experiencia o se confirman durante el proceso de reserva.', 'pagos', 8),
('¿Puedo cambiar la fecha después de reservar?', 'En muchos casos es posible reprogramar la experiencia si se solicita con anticipación y hay disponibilidad. Te recomendamos contactarnos lo antes posible para revisar las opciones.', 'reservas', 9),
('¿Dónde inicia la experiencia?', 'Cada experiencia tiene un punto de encuentro definido que se indica claramente en la descripción del tour. En algunos casos también se pueden coordinar traslados adicionales.', 'experiencia', 10),
('¿Necesito alguna condición física para participar?', 'Algunas experiencias, especialmente las que incluyen caminatas o actividades en naturaleza, pueden requerir una condición física básica. Estos requisitos siempre se especifican en la información del tour.', 'experiencia', 11),
('¿Qué debo llevar el día de la experiencia?', 'Generalmente recomendamos llevar ropa cómoda, calzado adecuado, documento de identidad, protección solar o impermeable según el clima y una botella de agua. Cada experiencia puede tener recomendaciones específicas.', 'experiencia', 12);


-- === 20260310051302_20521ca1-51c4-485b-bb8c-da76225b0fcd.sql ===

-- Add icon, color, display_order columns to categories_experience
ALTER TABLE ecommerce.categories_experience
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '📖',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#08949B',
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Allow admins full CRUD on categories_experience
CREATE POLICY "Admins can manage experience categories_crud"
  ON ecommerce.categories_experience
  FOR ALL
  TO authenticated
  USING (ecommerce.has_role(auth.uid(), 'admin'))
  WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'));


-- === 20260311034449_2b4f2798-5cce-4683-a588-38f33ab10053.sql ===

-- 1. Drop FK constraint from experiences.category_id
-- skipped

-- 2. Drop the category_id column from experiences
-- skipped drop category_id

-- 3. Drop FK constraint from experiences.destination_id
-- skipped

-- 4. Drop the destination_id column from experiences
-- skipped drop destination_id

-- 5. Drop the destinations table (RLS policies will be dropped automatically)
DROP TABLE IF EXISTS ecommerce.destinations CASCADE;


-- === 20260323023751_71d5906c-c56d-44ca-b23e-34235d9c4ca1.sql ===

-- 1. Create enums
CREATE TYPE ecommerce.artesania_categoria AS ENUM ('mochilas', 'portavasos', 'correas', 'manillas');
CREATE TYPE ecommerce.artesania_estado AS ENUM ('borrador', 'publicado', 'desactivado');

-- 2. Create artesanias table
CREATE TABLE ecommerce.artesanias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria ecommerce.artesania_categoria NOT NULL,
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
  estado ecommerce.artesania_estado NOT NULL DEFAULT 'borrador',
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create artesania_variantes table
CREATE TABLE ecommerce.artesania_variantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artesania_id UUID NOT NULL REFERENCES ecommerce.artesanias(id) ON DELETE CASCADE,
  variante_nombre TEXT NOT NULL,
  atributos JSONB NOT NULL DEFAULT '{}',
  precio NUMERIC NOT NULL,
  stock INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Updated_at trigger for artesanias
CREATE TRIGGER update_artesanias_updated_at
  BEFORE UPDATE ON ecommerce.artesanias
  FOR EACH ROW
  EXECUTE FUNCTION ecommerce.update_updated_at_column();

-- 5. RLS on artesanias
ALTER TABLE ecommerce.artesanias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage artesanias" ON ecommerce.artesanias
  FOR ALL TO authenticated
  USING (ecommerce.has_role(auth.uid(), 'admin'))
  WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view published artesanias" ON ecommerce.artesanias
  FOR SELECT TO anon, authenticated
  USING (estado = 'publicado');

-- 6. RLS on artesania_variantes
ALTER TABLE ecommerce.artesania_variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage artesania variantes" ON ecommerce.artesania_variantes
  FOR ALL TO authenticated
  USING (ecommerce.has_role(auth.uid(), 'admin'))
  WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view variantes of published artesanias" ON ecommerce.artesania_variantes
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM ecommerce.artesanias WHERE id = artesania_id AND estado = 'publicado'
  ));

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('artesanias', 'artesanias', true);

-- 8. Storage RLS policies
CREATE POLICY "Anyone can view artesanias images" ON storage.objects
  FOR SELECT USING (bucket_id = 'artesanias');

CREATE POLICY "Admins can upload artesanias images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artesanias' AND ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update artesanias images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'artesanias' AND ecommerce.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete artesanias images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'artesanias' AND ecommerce.has_role(auth.uid(), 'admin'));


-- === 20260323033333_f1cb685d-7abc-4640-895f-b306403f9643.sql ===
UPDATE experiences SET max_participants = 20 WHERE id = 'd561dcd3-dc20-4b72-92ba-7a3965acf1e9' AND max_participants = 1;

-- === 20260323040700_c2e7d0f6-dddb-4c96-8fa4-c2bdc3dbc34f.sql ===
CREATE OR REPLACE FUNCTION ecommerce.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into ecommerce.profiles (
    id,
    email,
    full_name,
    phone,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    now(),
    now()
  );
  return new;
end;
$function$;

-- === 20260323041848_ae51e95a-f82f-4209-b880-869e1a3828eb.sql ===
CREATE OR REPLACE FUNCTION ecommerce.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ecommerce
AS $function$
begin
  insert into ecommerce.profiles (
    id,
    email,
    full_name,
    phone,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    now(),
    now()
  );
  return new;
end;
$function$;

-- === 20260323044014_b7e82713-7a2a-42e8-8143-4037956f29ea.sql ===
-- Add first_name and last_name columns to profiles
ALTER TABLE ecommerce.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE ecommerce.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- Populate from existing full_name data
UPDATE ecommerce.profiles 
SET 
  first_name = split_part(coalesce(full_name, ''), ' ', 1),
  last_name = CASE 
    WHEN position(' ' in coalesce(full_name, '')) > 0 
    THEN substring(coalesce(full_name, '') from position(' ' in coalesce(full_name, '')) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;

-- Update the trigger to save first_name and last_name separately
CREATE OR REPLACE FUNCTION ecommerce.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into ecommerce.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    now(),
    now()
  );
  return new;
end;
$$;

-- === 20260323052617_47647b37-b95d-421d-a1db-b71fd2c49784.sql ===
-- Add artesania support to order_items
ALTER TABLE ecommerce.order_items 
  ALTER COLUMN experience_id DROP NOT NULL,
  ADD COLUMN artesania_id uuid REFERENCES ecommerce.artesanias(id) ON DELETE SET NULL,
  ADD COLUMN artesania_variante_id uuid REFERENCES ecommerce.artesania_variantes(id) ON DELETE SET NULL;

-- Add shipping fields to orders
ALTER TABLE ecommerce.orders
  ADD COLUMN shipping_address text,
  ADD COLUMN shipping_city text,
  ADD COLUMN shipping_department text,
  ADD COLUMN shipping_notes text,
  ADD COLUMN order_type text NOT NULL DEFAULT 'experience';

-- Add check constraint: either experience_id or artesania_id must be set
ALTER TABLE ecommerce.order_items
  ADD CONSTRAINT order_item_has_product CHECK (experience_id IS NOT NULL OR artesania_id IS NOT NULL);

-- === 20260323053658_91d87fb5-3e80-4b74-8f03-5263703f49a7.sql ===
CREATE TABLE ecommerce.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ecommerce.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings" ON ecommerce.site_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage settings" ON ecommerce.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO ecommerce.site_settings (key, value)
VALUES ('artesanias_youtube_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
ON CONFLICT (key) DO NOTHING;

-- === 20260324030641_35763b44-8fc4-4398-b0e7-e6b3fd5b3141.sql ===
-- =============================================
-- FASE 1: Sistema de Hospedajes para BePelican
-- =============================================

-- 1. Crear enum para tipos de hospedaje
CREATE TYPE ecommerce.lodging_type AS ENUM (
  'posada', 'hotel', 'hostal', 'glamping', 'cabaña', 'finca'
);

-- 2. Tabla lodgings (hospedajes independientes)
CREATE TABLE ecommerce.lodgings (
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
CREATE TABLE ecommerce.lodging_room_types (
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

-- 4. Tabla pivote experience_lodgings
CREATE TABLE ecommerce.experience_lodgings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  lodging_id uuid NOT NULL REFERENCES ecommerce.lodgings(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES ecommerce.lodging_room_types(id) ON DELETE SET NULL,
  is_default_option boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experience_id, lodging_id, room_type_id)
);

-- 5. Extender order_items con campos de hospedaje
ALTER TABLE ecommerce.order_items
  ADD COLUMN IF NOT EXISTS lodging_id uuid REFERENCES ecommerce.lodgings(id),
  ADD COLUMN IF NOT EXISTS lodging_room_type_id uuid REFERENCES ecommerce.lodging_room_types(id),
  ADD COLUMN IF NOT EXISTS check_in_date date,
  ADD COLUMN IF NOT EXISTS check_out_date date;

-- 6. Trigger updated_at para lodgings
CREATE TRIGGER update_lodgings_updated_at
  BEFORE UPDATE ON ecommerce.lodgings
  FOR EACH ROW
  EXECUTE FUNCTION ecommerce.update_updated_at_column();

-- 7. Bucket de storage público para imágenes de hospedajes
INSERT INTO storage.buckets (id, name, public)
VALUES ('lodgings', 'lodgings', true)
ON CONFLICT (id) DO NOTHING;

-- 8. RLS para lodgings
CREATE POLICY "Admins can manage lodgings"
  ON ecommerce.lodgings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active lodgings"
  ON ecommerce.lodgings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 9. RLS para lodging_room_types
CREATE POLICY "Admins can manage room types"
  ON ecommerce.lodging_room_types FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active room types"
  ON ecommerce.lodging_room_types FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 10. RLS para experience_lodgings
CREATE POLICY "Admins can manage experience lodgings"
  ON ecommerce.experience_lodgings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active experience lodgings"
  ON ecommerce.experience_lodgings FOR SELECT
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

-- === 20260324032629_c7567ff4-800d-422d-a51a-9fab380f35ba.sql ===
ALTER TABLE ecommerce.lodging_room_types ADD COLUMN units_available integer NOT NULL DEFAULT 1;

-- === 20260324034832_151e1482-1be4-4e32-8a5f-8b1530669502.sql ===
ALTER TABLE ecommerce.experiences ADD COLUMN lodging_required boolean NOT NULL DEFAULT false;

-- === 20260324195943_c57c8a8f-48d4-45ad-b274-9d4fac0f5ac9.sql ===
ALTER TABLE ecommerce.lodgings ADD COLUMN department text;

-- === 20260324204634_c81e58c9-b11a-4b95-977a-383f29a93a05.sql ===

-- Tabla de temporadas por hospedaje
CREATE TABLE ecommerce.lodging_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lodging_id uuid NOT NULL REFERENCES ecommerce.lodgings(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla de tarifas por tipo de habitación + temporada
CREATE TABLE ecommerce.room_season_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES ecommerce.lodging_room_types(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES ecommerce.lodging_seasons(id) ON DELETE CASCADE,
  pricing_mode text NOT NULL DEFAULT 'per_room' CHECK (pricing_mode IN ('per_room', 'per_person')),
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_type_id, season_id)
);

-- RLS lodging_seasons
ALTER TABLE ecommerce.lodging_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lodging seasons"
  ON ecommerce.lodging_seasons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view lodging seasons"
  ON ecommerce.lodging_seasons FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS room_season_rates
ALTER TABLE ecommerce.room_season_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage room season rates"
  ON ecommerce.room_season_rates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view room season rates"
  ON ecommerce.room_season_rates FOR SELECT
  TO anon, authenticated
  USING (true);

-- RPC: Calcula precios del calendario para un hospedaje/habitación
CREATE OR REPLACE FUNCTION ecommerce.get_lodging_calendar_prices(
  _lodging_id uuid,
  _room_type_id uuid,
  _start_date date,
  _end_date date,
  _guests integer
)
RETURNS TABLE(
  calendar_date date,
  season_name text,
  pricing_mode text,
  price_per_night numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  /*
    Para cada fecha en el rango:
    1. Busca la temporada del hospedaje donde start_date <= fecha <= end_date
    2. Busca la tarifa en room_season_rates para ese room_type + season
    3. Calcula precio:
       - per_room: price directo
       - per_person: price × _guests (validando contra capacity)
    4. Fechas sin match se omiten → el frontend las bloquea
  */
  SELECT
    d.dt::date AS calendar_date,
    ls.name AS season_name,
    rsr.pricing_mode,
    CASE
      WHEN rsr.pricing_mode = 'per_person' THEN
        rsr.price * LEAST(_guests, lrt.capacity)
      ELSE
        rsr.price
    END AS price_per_night
  FROM generate_series(_start_date, _end_date, '1 day'::interval) AS d(dt)
  INNER JOIN lodging_seasons ls
    ON ls.lodging_id = _lodging_id
    AND d.dt::date BETWEEN ls.start_date AND ls.end_date
  INNER JOIN room_season_rates rsr
    ON rsr.season_id = ls.id
    AND rsr.room_type_id = _room_type_id
  INNER JOIN lodging_room_types lrt
    ON lrt.id = _room_type_id
  WHERE rsr.price > 0;
$$;


-- === 20260326041219_e2faabeb-a7ae-49c8-b296-ee7fae8445d0.sql ===

-- =============================================
-- 1. PERFORMANCE INDEXES on hot query paths
-- =============================================

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON ecommerce.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_experience_id ON ecommerce.order_items (experience_id) WHERE experience_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_artesania_id ON ecommerce.order_items (artesania_id) WHERE artesania_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_experience_bookings_experience_date ON ecommerce.experience_bookings (experience_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON ecommerce.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON ecommerce.orders (status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON ecommerce.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_lodging_seasons_lodging_dates ON ecommerce.lodging_seasons (lodging_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_room_season_rates_season_room ON ecommerce.room_season_rates (season_id, room_type_id);
CREATE INDEX IF NOT EXISTS idx_experience_lodgings_experience ON ecommerce.experience_lodgings (experience_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_experience ON ecommerce.pricing_rules (experience_id);

-- =============================================
-- 2. FIX FK ACTIONS: lodging refs in order_items should SET NULL
-- =============================================

ALTER TABLE ecommerce.order_items
  DROP CONSTRAINT IF EXISTS order_items_lodging_id_fkey,
  ADD CONSTRAINT order_items_lodging_id_fkey
    FOREIGN KEY (lodging_id) REFERENCES ecommerce.lodgings(id) ON DELETE SET NULL;

ALTER TABLE ecommerce.order_items
  DROP CONSTRAINT IF EXISTS order_items_lodging_room_type_id_fkey,
  ADD CONSTRAINT order_items_lodging_room_type_id_fkey
    FOREIGN KEY (lodging_room_type_id) REFERENCES ecommerce.lodging_room_types(id) ON DELETE SET NULL;

-- =============================================
-- 3. DROP misnamed index
-- =============================================

DROP INDEX IF EXISTS idx_experiences_featured;


-- === 20260331013525_4f7e0479-d402-4231-8eac-d2963fc8d049.sql ===

-- Enum para categoría del blog
CREATE TYPE ecommerce.blog_category AS ENUM (
  'destinos',
  'cultura',
  'gastronomia',
  'aventura',
  'consejos_de_viaje'
);

-- Enum para estado del blog post
CREATE TYPE ecommerce.blog_status AS ENUM ('borrador', 'publicado', 'archivado');

-- Tabla principal de blog posts
CREATE TABLE ecommerce.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  category ecommerce.blog_category NOT NULL DEFAULT 'destinos',
  status blog_status NOT NULL DEFAULT 'borrador',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON ecommerce.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION ecommerce.update_updated_at_column();

-- Indexes
CREATE INDEX idx_blog_posts_status ON ecommerce.blog_posts (status);
CREATE INDEX idx_blog_posts_category ON ecommerce.blog_posts (category);
CREATE INDEX idx_blog_posts_published_at ON ecommerce.blog_posts (published_at DESC) WHERE status = 'publicado';

-- RLS
ALTER TABLE ecommerce.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog posts"
  ON ecommerce.blog_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view published blog posts"
  ON ecommerce.blog_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'publicado'::blog_status);


-- === 20260401042948_1a565a81-bf0f-43d4-bb36-f8bd44467e4b.sql ===
ALTER TABLE ecommerce.blog_posts ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT ARRAY[]::text[];

-- === 20260408044941_1268788c-7705-400f-b5e2-5414ca80ad2f.sql ===
ALTER TABLE ecommerce.experiences ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

INSERT INTO ecommerce.site_settings (key, value)
VALUES ('experience_sort_mode', 'created_desc')
ON CONFLICT (key) DO NOTHING;

-- PostgREST + auth wiring
GRANT USAGE ON SCHEMA ecommerce TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA ecommerce TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ecommerce TO authenticator;
GRANT ALL ON ALL ROUTINES IN SCHEMA ecommerce TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON SEQUENCES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON ROUTINES TO authenticator;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ecommerce.handle_new_user();
