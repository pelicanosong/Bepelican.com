-- RLS en experience_categories: admins (ecommerce.user_roles) pueden sincronizar categorías.
SET search_path TO ecommerce, public;

CREATE TABLE IF NOT EXISTS ecommerce.experience_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES ecommerce.experiences(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES ecommerce.categories_experience(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (experience_id, category_id)
);

ALTER TABLE ecommerce.experience_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view experience categories" ON ecommerce.experience_categories;
DROP POLICY IF EXISTS "Admins can manage experience categories" ON ecommerce.experience_categories;
DROP POLICY IF EXISTS "Only admins can insert experience categories" ON ecommerce.experience_categories;
DROP POLICY IF EXISTS "Only admins can update experience categories" ON ecommerce.experience_categories;
DROP POLICY IF EXISTS "Only admins can delete experience categories" ON ecommerce.experience_categories;

CREATE POLICY "Public can view experience categories"
  ON ecommerce.experience_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert experience categories"
  ON ecommerce.experience_categories FOR INSERT TO authenticated
  WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));

CREATE POLICY "Admins can update experience categories"
  ON ecommerce.experience_categories FOR UPDATE TO authenticated
  USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role))
  WITH CHECK (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));

CREATE POLICY "Admins can delete experience categories"
  ON ecommerce.experience_categories FOR DELETE TO authenticated
  USING (ecommerce.has_role(auth.uid(), 'admin'::ecommerce.app_role));

CREATE INDEX IF NOT EXISTS idx_experience_categories_experience
  ON ecommerce.experience_categories(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_categories_category
  ON ecommerce.experience_categories(category_id);
