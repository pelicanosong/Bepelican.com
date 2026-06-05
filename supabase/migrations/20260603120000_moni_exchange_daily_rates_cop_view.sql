-- Moni Exchange — vista de cruces vs COP (auto-actualiza al insertar en daily_rates).
SET search_path TO public;

-- Columnas numéricas en daily_rates (ver 20260602140000_moni_exchange_schema.sql):
--   c    — tasa de cierre / último día del rango Frankfurter (igual que rate al ingestar)
--   h    — máximo en ventana de 7 días (referencia alta, no usada en cruces COP)
--   rate — tasa diaria de referencia USD→quote (unidades de quote por 1 USD); n8n la escribe
--          igual que c; esta vista usa rate para cop_per_unit y units_per_cop.

CREATE OR REPLACE VIEW moni_exchange.daily_rates_cop AS
SELECT
  q.rate_date,
  q.quote_currency,
  q.quote_currency || '/COP' AS par,
  q.rate AS rate_vs_usd,
  cop.rate AS cop_usd_rate,
  CASE
    WHEN q.quote_currency = 'COP' THEN 1::numeric(18, 4)
    ELSE ROUND((cop.rate / q.rate)::numeric, 4)::numeric(18, 4)
  END AS cop_per_unit,
  CASE
    WHEN q.quote_currency = 'COP' THEN 1::numeric(18, 8)
    ELSE ROUND((q.rate / cop.rate)::numeric, 8)::numeric(18, 8)
  END AS units_per_cop
FROM moni_exchange.daily_rates q
INNER JOIN moni_exchange.daily_rates cop
  ON cop.rate_date = q.rate_date
 AND cop.quote_currency = 'COP';

COMMENT ON VIEW moni_exchange.daily_rates_cop IS
  'Cruces diarios vs COP. rate_vs_usd y cop_usd_rate = unidades por 1 USD. '
  'cop_per_unit = COP por 1 unidad de quote (ej. 1 EUR = X COP). '
  'units_per_cop = quote por 1 COP. Se recalcula sola al añadir filas en daily_rates.';

GRANT SELECT ON moni_exchange.daily_rates_cop TO anon, authenticated, authenticator;
GRANT ALL ON moni_exchange.daily_rates_cop TO service_role;
