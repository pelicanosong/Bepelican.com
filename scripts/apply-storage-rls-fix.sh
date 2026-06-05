#!/bin/bash
# Corrige RLS de Storage (subida de fotos en /admin).
# Ejecutar EN EL SERVIDOR donde corre docker supabase-db (Contabo).
#
# Uso local en el servidor:
#   bash scripts/apply-storage-rls-fix.sh
#
# Desde tu Mac (recomendado — usa .env.contabo):
#   npm run db:fix-storage-rls
#
# Manual (IP del VPS en docs/despliegue-contabo-cloudflare.md):
#   scp supabase/migrations/20260602120000_fix_experiences_storage_rls.sql root@66.94.96.230:/tmp/
#   ssh root@66.94.96.230 "docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < /tmp/20260602120000_fix_experiences_storage_rls.sql"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATION="$REPO_ROOT/supabase/migrations/20260602120000_fix_experiences_storage_rls.sql"

if [[ ! -f "$MIGRATION" ]]; then
  echo "No se encontró: $MIGRATION"
  exit 1
fi

echo "Aplicando fix RLS Storage (experiences + lodgings)…"
docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < "$MIGRATION"

echo ""
echo "✓ Listo. Probá subir una imagen en https://bepelican.com/admin"
echo "  Si sigue fallando, verificá rol admin:"
echo "    node scripts/grant-admin.mjs tu-email@ejemplo.com"
