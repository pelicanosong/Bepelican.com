-- Políticas admin para flipbooks (faltaban en self-hosted → DELETE/UPDATE no hacían nada)
SET search_path TO ecommerce, public;

-- flipbooks
DO $$ BEGIN
  CREATE POLICY "Admins can view all flipbooks"
    ON ecommerce.flipbooks FOR SELECT TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert flipbooks"
    ON ecommerce.flipbooks FOR INSERT TO authenticated
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update flipbooks"
    ON ecommerce.flipbooks FOR UPDATE TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete flipbooks"
    ON ecommerce.flipbooks FOR DELETE TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- flipbook_categories
DO $$ BEGIN
  CREATE POLICY "Admins can manage flipbook categories"
    ON ecommerce.flipbook_categories FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- flipbook_category_relations
DO $$ BEGIN
  CREATE POLICY "Admins can manage category relations"
    ON ecommerce.flipbook_category_relations FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- flipbook_experience_links
DO $$ BEGIN
  CREATE POLICY "Admins can manage experience links"
    ON ecommerce.flipbook_experience_links FOR ALL TO authenticated
    USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
    WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
