-- Briselda: vínculo persistente experiencia → destino clima + preset de animación.
SET search_path TO public;

-- Catálogo de escenas animadas por territorio (registro en Supabase, no solo runtime).
CREATE TABLE IF NOT EXISTS ecommerce.climate_scene_presets (
  key text PRIMARY KEY,
  briselda_destino text NOT NULL,
  label_es text NOT NULL,
  label_en text,
  animation_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE ecommerce.climate_scene_presets IS 'Presets de escena climática Briselda por territorio';

INSERT INTO ecommerce.climate_scene_presets (key, briselda_destino, label_es, label_en, animation_config)
VALUES
  ('sierra_costa', 'Santa Marta', 'Sierra y costa', 'Sierra and coast', '{"mistBase":0.35,"windBase":0.4,"particleStyle":"leaf"}'),
  ('andes_urbana', 'Bogota', 'Cerros urbanos', 'Urban hills', '{"mistBase":0.25,"windBase":0.5,"particleStyle":"cloud"}'),
  ('barrio_urbana', 'Bogota', 'Barrio urbano', 'Urban neighborhood', '{"mistBase":0.15,"windBase":0.25,"particleStyle":"warm"}'),
  ('desierto_guajira', 'Riohacha', 'Desierto guajiro', 'Guajira desert', '{"mistBase":0.05,"windBase":0.85,"particleStyle":"dust"}'),
  ('nevado_alto', 'El Cocuy', 'Nevado alto', 'High mountain', '{"mistBase":0.2,"windBase":0.35,"particleStyle":"snow"}'),
  ('amazonia', 'Leticia', 'Amazonía', 'Amazon', '{"mistBase":0.55,"windBase":0.3,"particleStyle":"rain"}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE ecommerce.experiences
  ADD COLUMN IF NOT EXISTS briselda_destino text,
  ADD COLUMN IF NOT EXISTS climate_scene_preset text;

ALTER TABLE ecommerce.experiences
  DROP CONSTRAINT IF EXISTS experiences_briselda_destino_check;

ALTER TABLE ecommerce.experiences
  ADD CONSTRAINT experiences_briselda_destino_check
  CHECK (
    briselda_destino IS NULL
    OR briselda_destino IN ('El Cocuy', 'Santa Marta', 'Leticia', 'Riohacha', 'Bogota')
  );

ALTER TABLE ecommerce.experiences
  DROP CONSTRAINT IF EXISTS experiences_climate_scene_preset_fkey;

ALTER TABLE ecommerce.experiences
  ADD CONSTRAINT experiences_climate_scene_preset_fkey
  FOREIGN KEY (climate_scene_preset)
  REFERENCES ecommerce.climate_scene_presets (key)
  ON DELETE SET NULL;

ALTER TABLE ecommerce.experiences
  DROP CONSTRAINT IF EXISTS experiences_briselda_binding_pair;

ALTER TABLE ecommerce.experiences
  ADD CONSTRAINT experiences_briselda_binding_pair
  CHECK (
    (briselda_destino IS NULL AND climate_scene_preset IS NULL)
    OR (briselda_destino IS NOT NULL AND climate_scene_preset IS NOT NULL)
  );

COMMENT ON COLUMN ecommerce.experiences.briselda_destino IS 'Ciudad canónica Briselda/n8n para clima en vivo';
COMMENT ON COLUMN ecommerce.experiences.climate_scene_preset IS 'Preset de animación registrado (climate_scene_presets.key)';

-- Vista unificada: experiencia + preset + último clima (PostgREST ecommerce).
CREATE OR REPLACE VIEW ecommerce.experience_climate_display AS
SELECT
  e.id AS experience_id,
  e.slug,
  e.title,
  e.location_city,
  e.location_name,
  e.temperature_range,
  e.recommended_season,
  e.briselda_destino,
  e.climate_scene_preset,
  p.label_es AS preset_label_es,
  p.label_en AS preset_label_en,
  p.animation_config AS preset_animation_config,
  w.temperatura,
  w.sensacion_termica,
  w.humedad,
  w.descripcion AS weather_descripcion,
  w.viento_kmh,
  w.presion,
  w.visibilidad_m,
  w.icono,
  w.condicion_id,
  w.lat AS weather_lat,
  w.lon AS weather_lon,
  w.nubes_pct,
  w.fetched_at AS weather_fetched_at,
  w.snapshot_hour AS weather_snapshot_hour
FROM ecommerce.experiences e
LEFT JOIN ecommerce.climate_scene_presets p ON p.key = e.climate_scene_preset
LEFT JOIN briselda.latest_destination_weather w ON w.ciudad = e.briselda_destino;

COMMENT ON VIEW ecommerce.experience_climate_display IS 'Experiencia con preset Briselda y clima en vivo por destino';

GRANT SELECT ON ecommerce.climate_scene_presets TO anon, authenticated, authenticator;
GRANT SELECT ON ecommerce.experience_climate_display TO anon, authenticated, authenticator;

ALTER TABLE ecommerce.climate_scene_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read climate scene presets" ON ecommerce.climate_scene_presets;
CREATE POLICY "Public can read climate scene presets"
  ON ecommerce.climate_scene_presets
  FOR SELECT
  USING (true);
