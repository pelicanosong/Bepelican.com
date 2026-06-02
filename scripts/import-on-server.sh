#!/bin/bash
# Ejecutar EN EL SERVIDOR después de copiar migration-data/
set -euo pipefail

DATA_DIR="${1:-/root/migration-data}"
SERVICE_ROLE_KEY=$(grep '^SERVICE_ROLE_KEY=' /root/supabase/.env | head -1 | cut -d= -f2-)

TABLES=(
  categories_experience experiences experience_categories pricing_rules
  hero_slides flipbook_categories flipbooks flipbook_category_relations
  flipbook_experience_links lodgings lodging_room_types lodging_seasons
  room_season_rates experience_lodgings experience_blocked_dates
  faqs site_settings
)

API="http://127.0.0.1:8001/rest/v1"
total=0

echo "Limpiando datos previos en schema ecommerce..."
docker exec supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -c "
DO \$\$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'ecommerce' LOOP
    EXECUTE 'TRUNCATE ecommerce.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END \$\$;
" >/dev/null

for table in "${TABLES[@]}"; do
  file="$DATA_DIR/${table}.json"
  [[ -f "$file" ]] || continue
  count=$(python3 -c "import json; print(len(json.load(open('$file'))))")
  if [[ "$count" == "0" ]]; then
    echo "$table: 0 (skip)"
    continue
  fi
  code=$(curl -s -o /tmp/import-out.txt -w "%{http_code}" -X POST "$API/$table" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -H "Accept-Profile: ecommerce" \
    -H "Content-Profile: ecommerce" \
    --data-binary @"$file")
  if [[ "$code" =~ ^2 ]]; then
    echo "$table: $count filas ✓"
    total=$((total + count))
  else
    echo "$table: ERROR $code — $(head -c 200 /tmp/import-out.txt)"
  fi
done

echo "Importadas: $total filas"
