-- BePelican i18n escalable: idioma fuente (es) en tablas principales;
-- demás idiomas en content_translations (sin columnas _en/_pt por tabla).

CREATE TABLE IF NOT EXISTS ecommerce.i18n_locales (
  code text PRIMARY KEY,
  name text NOT NULL,
  is_source boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0
);

INSERT INTO ecommerce.i18n_locales (code, name, is_source, is_active, display_order) VALUES
  ('es', 'Español', true, true, 0),
  ('en', 'English', false, true, 1)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS ecommerce.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_key text NOT NULL,
  locale text NOT NULL REFERENCES ecommerce.i18n_locales (code) ON DELETE CASCADE,
  value text NOT NULL,
  value_format text NOT NULL DEFAULT 'plain' CHECK (value_format IN ('plain', 'json')),
  source_hash text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, field_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_content_translations_entity
  ON ecommerce.content_translations (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_content_translations_locale
  ON ecommerce.content_translations (entity_type, entity_id, locale);

-- Glosario de marca: términos fijos → ahorra tokens y mantiene consistencia
CREATE TABLE IF NOT EXISTS ecommerce.i18n_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_es text NOT NULL UNIQUE,
  translations jsonb NOT NULL DEFAULT '{}',
  do_not_translate boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO ecommerce.i18n_glossary (term_es, translations, do_not_translate, notes) VALUES
  ('BePelican', '{}', true, 'Marca — no traducir'),
  ('turismo de transformación', '{"en": "transformation tourism"}', false, 'Eslogan'),
  ('comunidades locales', '{"en": "local communities"}', false, NULL),
  ('Colombia auténtica', '{"en": "authentic Colombia"}', false, NULL)
ON CONFLICT (term_es) DO NOTHING;

-- Auditoría / control de costos (opcional, solo service role escribe)
CREATE TABLE IF NOT EXISTS ecommerce.i18n_translation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  locale text NOT NULL,
  field_keys text[] NOT NULL DEFAULT '{}',
  tokens_in int,
  tokens_out int,
  model text,
  skipped boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ecommerce.content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.i18n_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.i18n_glossary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read content_translations" ON ecommerce.content_translations;
CREATE POLICY "Public read content_translations" ON ecommerce.content_translations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read i18n_locales" ON ecommerce.i18n_locales;
CREATE POLICY "Public read i18n_locales" ON ecommerce.i18n_locales
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read i18n_glossary" ON ecommerce.i18n_glossary;
CREATE POLICY "Public read i18n_glossary" ON ecommerce.i18n_glossary
  FOR SELECT USING (true);

COMMENT ON TABLE ecommerce.content_translations IS
  'Traducciones por entidad/campo/idioma. Fuente: es en tablas principales. Hash evita retraducir.';

-- Config del agente (prompt override opcional desde Supabase Studio)
CREATE TABLE IF NOT EXISTS ecommerce.i18n_agent_config (
  config_key text PRIMARY KEY,
  config_value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO ecommerce.i18n_agent_config (config_key, config_value, description) VALUES
  (
    'use_file_prompt',
    'true',
    'Si true, usa scripts/i18n/translation-system-prompt.md. Si false, usa system_prompt de esta tabla.'
  )
ON CONFLICT (config_key) DO NOTHING;

ALTER TABLE ecommerce.i18n_agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read i18n_agent_config" ON ecommerce.i18n_agent_config;
CREATE POLICY "Public read i18n_agent_config" ON ecommerce.i18n_agent_config
  FOR SELECT USING (config_key IN ('use_file_prompt'));

-- Solo service role escribe (sin policy INSERT/UPDATE para anon/authenticated)
