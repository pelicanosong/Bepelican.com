-- Briselda — clima por destino BePelican (OpenWeatherMap + n8n). Esquema aislado del ecommerce.
SET search_path TO public;

CREATE SCHEMA IF NOT EXISTS briselda;

COMMENT ON SCHEMA briselda IS 'Briselda — snapshots horarios de clima en destinos BePelican (OpenWeatherMap / n8n)';

GRANT USAGE ON SCHEMA briselda TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON SCHEMA briselda TO postgres, service_role;

-- Una fila por destino y hora de snapshot (cron horario en n8n).
CREATE TABLE briselda.destination_weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciudad text NOT NULL,
  temperatura numeric(5, 2) NOT NULL,
  sensacion_termica numeric(5, 2) NOT NULL,
  humedad smallint NOT NULL,
  descripcion text NOT NULL,
  viento_kmh numeric(6, 2) NOT NULL,
  presion smallint,
  visibilidad_m integer,
  icono text,
  condicion_id integer,
  lat numeric(9, 6),
  lon numeric(9, 6),
  nubes_pct smallint,
  fetched_at timestamptz NOT NULL,
  snapshot_hour timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT destination_weather_one_per_city_hour UNIQUE (ciudad, snapshot_hour),
  CONSTRAINT destination_weather_humedad_range CHECK (humedad >= 0 AND humedad <= 100),
  CONSTRAINT destination_weather_nubes_range CHECK (nubes_pct IS NULL OR (nubes_pct >= 0 AND nubes_pct <= 100))
);

COMMENT ON TABLE briselda.destination_weather IS 'Briselda: lectura horaria OpenWeatherMap por destino BePelican';
COMMENT ON COLUMN briselda.destination_weather.snapshot_hour IS 'Inicio de hora UTC del snapshot (upsert n8n on_conflict ciudad,snapshot_hour)';

CREATE INDEX idx_briselda_weather_city_hour
  ON briselda.destination_weather (ciudad, snapshot_hour DESC);

CREATE INDEX idx_briselda_weather_fetched
  ON briselda.destination_weather (fetched_at DESC);

CREATE OR REPLACE FUNCTION briselda.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_briselda_destination_weather_updated_at
  BEFORE UPDATE ON briselda.destination_weather
  FOR EACH ROW
  EXECUTE FUNCTION briselda.set_updated_at();

-- Última lectura por destino (consulta rápida en app / reportes).
CREATE VIEW briselda.latest_destination_weather AS
SELECT DISTINCT ON (ciudad)
  id,
  ciudad,
  temperatura,
  sensacion_termica,
  humedad,
  descripcion,
  viento_kmh,
  presion,
  visibilidad_m,
  icono,
  condicion_id,
  lat,
  lon,
  nubes_pct,
  fetched_at,
  snapshot_hour,
  created_at,
  updated_at
FROM briselda.destination_weather
ORDER BY ciudad, snapshot_hour DESC, fetched_at DESC;

COMMENT ON VIEW briselda.latest_destination_weather IS 'Último snapshot horario por destino';

ALTER TABLE briselda.destination_weather ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read briselda weather" ON briselda.destination_weather;
CREATE POLICY "Public can read briselda weather"
  ON briselda.destination_weather
  FOR SELECT
  USING (true);

GRANT SELECT ON ALL TABLES IN SCHEMA briselda TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA briselda TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA briselda TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA briselda TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA briselda TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA briselda
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA briselda
  GRANT ALL ON TABLES TO service_role;

-- PostgREST: agregar briselda a PGRST_DB_SCHEMAS y reiniciar rest/kong (mismo paso que moni_exchange).
