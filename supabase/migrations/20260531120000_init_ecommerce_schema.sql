-- BePelican Ecommerce — schema aislado (no toca public/Chatwoot ni instagram/Marce)
-- Ejecutar en Studio → SQL Editor del Supabase self-hosted

CREATE SCHEMA IF NOT EXISTS ecommerce;

COMMENT ON SCHEMA ecommerce IS 'BePelican ecommerce: experiencias, biblioteca, reservas, pedidos';

-- Roles estándar de Supabase self-hosted
GRANT USAGE ON SCHEMA ecommerce TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA ecommerce TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ecommerce TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ecommerce TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA ecommerce TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce
  GRANT ALL ON TABLES TO service_role;

-- Paso 2 (después): agregar ecommerce a PGRST_DB_SCHEMAS y reiniciar rest/kong
