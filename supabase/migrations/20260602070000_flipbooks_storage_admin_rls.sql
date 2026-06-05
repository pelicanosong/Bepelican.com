-- Storage: admins pueden subir/eliminar PDFs y portadas en bucket flipbooks
SET search_path TO storage, ecommerce, public;

DO $$ BEGIN
  CREATE POLICY "Admins can upload flipbook files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'flipbooks'
      AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update flipbook files"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'flipbooks'
      AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete flipbook files"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'flipbooks'
      AND ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
