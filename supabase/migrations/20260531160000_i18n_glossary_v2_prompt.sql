-- Glosario alineado con BePelican_Translation_Prompt_v2
-- El agente inyecta estos términos como obligatorios en cada batch.

INSERT INTO ecommerce.i18n_glossary (term_es, translations, do_not_translate, notes) VALUES
  ('turismo de transformación', '{"en": "Travel That Means Something"}', false, 'Eslogan — prompt v2'),
  ('Experiencias auténticas', '{"en": "real experiences"}', false, 'Headlines: "the real deal" también válido'),
  ('comunidades locales', '{"en": "the people who actually live there"}', false, 'Prompt v2'),
  ('Artesanías', '{"en": "Artisan Shop"}', false, 'Nav / UI'),
  ('Librería', '{"en": "Bookshop"}', false, 'Nav / UI'),
  ('Diario de viaje', '{"en": "Travel Journal"}', false, 'Nav / UI'),
  ('Próximas salidas', '{"en": "Coming Up Soon"}', false, 'UI'),
  ('Cupos limitados', '{"en": "Spots go fast"}', false, 'UI')
ON CONFLICT (term_es) DO UPDATE SET
  translations = EXCLUDED.translations,
  notes = EXCLUDED.notes,
  updated_at = now();
