-- Fix: lectura pública para catálogo (faltaba en experiences y categories_experience)
SET search_path TO ecommerce, public;

DO $$ BEGIN
  CREATE POLICY "Public can view active experiences"
    ON ecommerce.experiences FOR SELECT TO anon, authenticated
    USING (status = 'activa'::ecommerce.experience_status);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Categories are viewable by everyone"
    ON ecommerce.categories_experience FOR SELECT TO anon, authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view all flipbooks for admins fallback"
    ON ecommerce.flipbooks FOR SELECT TO anon, authenticated
    USING (status = 'published'::ecommerce.flipbook_status);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
