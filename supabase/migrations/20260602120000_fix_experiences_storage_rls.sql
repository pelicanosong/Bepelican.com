-- Storage RLS: admins en ecommerce.user_roles deben poder subir a experiences y lodgings.
-- Corrige políticas que usaban public.has_role o cast app_role incorrecto.
SET search_path TO storage, ecommerce, public;

-- === experiences ===
DROP POLICY IF EXISTS "Public read access for experience images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload experience images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update experience images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete experience images" ON storage.objects;

CREATE POLICY "Public read access for experience images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'experiences');

CREATE POLICY "Admin users can upload experience images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'experiences'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  );

CREATE POLICY "Admin users can update experience images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'experiences'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  )
  WITH CHECK (
    bucket_id = 'experiences'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  );

CREATE POLICY "Admin users can delete experience images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'experiences'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  );

-- === lodgings ===
DROP POLICY IF EXISTS "Anyone can view lodging images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload lodging images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lodging images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lodging images" ON storage.objects;

CREATE POLICY "Anyone can view lodging images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'lodgings');

CREATE POLICY "Admins can upload lodging images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lodgings'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  );

CREATE POLICY "Admins can update lodging images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'lodgings'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  )
  WITH CHECK (
    bucket_id = 'lodgings'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  );

CREATE POLICY "Admins can delete lodging images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lodgings'
    AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
  );

-- Bucket lodgings por si falta en self-hosted
INSERT INTO storage.buckets (id, name, public)
VALUES ('lodgings', 'lodgings', true)
ON CONFLICT (id) DO NOTHING;
