#!/bin/bash
# Aplicar tablas i18n en Supabase self-hosted (Contabo).
# Ejecutar EN EL SERVIDOR donde corre docker supabase-db.
#
# Uso:
#   bash scripts/apply-i18n-migration.sh
#   # o desde tu Mac vía SSH:
#   scp supabase/migrations/20260531150000_i18n_content_translations.sql root@TU_SERVIDOR:/tmp/
#   ssh root@TU_SERVIDOR "docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < /tmp/20260531150000_i18n_content_translations.sql"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATION="$REPO_ROOT/supabase/migrations/20260531150000_i18n_content_translations.sql"

if [[ ! -f "$MIGRATION" ]]; then
  echo "No se encontró: $MIGRATION"
  exit 1
fi

echo "Aplicando migración i18n en supabase-db…"
docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$MIGRATION"

echo ""
echo "Verificando tablas…"
docker exec supabase-db psql -U supabase_admin -d postgres -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'ecommerce'
  AND (table_name LIKE 'i18n%' OR table_name = 'content_translations')
ORDER BY 1;
"

echo ""
echo "✓ Migración i18n aplicada."
echo "  Tablas: i18n_locales, content_translations, i18n_glossary, i18n_translation_log, i18n_agent_config"
