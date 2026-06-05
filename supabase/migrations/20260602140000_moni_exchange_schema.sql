-- Moni Exchange — tasas diarias Frankfurter (n8n). Esquema aislado del ecommerce.
SET search_path TO public;

CREATE SCHEMA IF NOT EXISTS moni_exchange;

COMMENT ON SCHEMA moni_exchange IS 'Moni Exchange — referencia diaria USD vs divisas (Frankfurter / n8n)';

GRANT USAGE ON SCHEMA moni_exchange TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON SCHEMA moni_exchange TO postgres, service_role;

-- Una fila por divisa y por día de referencia (sin ticks intradía).
CREATE TABLE moni_exchange.daily_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date date NOT NULL,
  base_currency char(3) NOT NULL DEFAULT 'USD',
  quote_currency char(3) NOT NULL,
  par text NOT NULL,
  c numeric(18, 8) NOT NULL,
  h numeric(18, 8) NOT NULL,
  rate numeric(18, 8) NOT NULL,
  source text NOT NULL DEFAULT 'frankfurter',
  provider text NOT NULL DEFAULT 'blended',
  fetched_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_rates_one_per_pair_per_day UNIQUE (rate_date, quote_currency),
  CONSTRAINT daily_rates_c_positive CHECK (c > 0),
  CONSTRAINT daily_rates_h_positive CHECK (h > 0),
  CONSTRAINT daily_rates_h_gte_c CHECK (h >= c)
);

COMMENT ON TABLE moni_exchange.daily_rates IS 'Moni Exchange: un snapshot oficial por par y por rate_date';
COMMENT ON COLUMN moni_exchange.daily_rates.rate_date IS 'Fecha de la tasa en Frankfurter (día hábil de referencia)';
COMMENT ON COLUMN moni_exchange.daily_rates.c IS 'Tasa de cierre / último día del rango';
COMMENT ON COLUMN moni_exchange.daily_rates.h IS 'Máximo en ventana Frankfurter (p. ej. 7 días)';

CREATE INDEX idx_moni_daily_rates_date
  ON moni_exchange.daily_rates (rate_date DESC);

CREATE INDEX idx_moni_daily_rates_quote_date
  ON moni_exchange.daily_rates (quote_currency, rate_date DESC);

CREATE OR REPLACE FUNCTION moni_exchange.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_moni_daily_rates_updated_at
  BEFORE UPDATE ON moni_exchange.daily_rates
  FOR EACH ROW
  EXECUTE FUNCTION moni_exchange.set_updated_at();

-- Última tasa guardada por divisa (consulta rápida en app / reportes).
CREATE VIEW moni_exchange.latest_daily_rates AS
SELECT DISTINCT ON (quote_currency)
  id,
  rate_date,
  base_currency,
  quote_currency,
  par,
  c,
  h,
  rate,
  source,
  provider,
  fetched_at,
  created_at,
  updated_at
FROM moni_exchange.daily_rates
ORDER BY quote_currency, rate_date DESC, fetched_at DESC;

COMMENT ON VIEW moni_exchange.latest_daily_rates IS 'Último snapshot por divisa';

ALTER TABLE moni_exchange.daily_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read moni daily rates" ON moni_exchange.daily_rates;
CREATE POLICY "Public can read moni daily rates"
  ON moni_exchange.daily_rates
  FOR SELECT
  USING (true);

GRANT SELECT ON ALL TABLES IN SCHEMA moni_exchange TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA moni_exchange TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA moni_exchange TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA moni_exchange TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA moni_exchange TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA moni_exchange
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA moni_exchange
  GRANT ALL ON TABLES TO service_role;

-- PostgREST: agregar moni_exchange a PGRST_DB_SCHEMAS y reiniciar rest/kong (mismo paso que ecommerce).
