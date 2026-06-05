#!/usr/bin/env bash
# Escribe /root/n8n/.env.supabase + docker-compose.override.yml (no toca el compose principal).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.selfhosted}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ Falta $ENV_FILE (VITE_SUPABASE_URL y SERVICE_ROLE_KEY)"
  exit 1
fi

SUPABASE_URL=$(grep -E '^VITE_SUPABASE_URL=|^SUPABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
SERVICE_KEY=$(grep -E '^SERVICE_ROLE_KEY=|^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

if [[ -z "$SUPABASE_URL" || -z "$SERVICE_KEY" ]]; then
  echo "✗ Falta VITE_SUPABASE_URL y SERVICE_ROLE_KEY en $ENV_FILE"
  exit 1
fi

HOST=$(grep '^CONTABO_SSH_HOST=' "$ROOT/.env.contabo" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
if [[ -z "$HOST" && -f "$ROOT/accesos-bepelican.env" ]]; then
  HOST=$(grep '^CONTABO_SSH_HOST=' "$ROOT/accesos-bepelican.env" | cut -d= -f2- | tr -d '"')
fi
if [[ -z "$HOST" ]]; then
  echo "✗ Falta CONTABO_SSH_HOST en .env.contabo"
  exit 1
fi

TMP_ENV=$(mktemp)
chmod 600 "$TMP_ENV"
cat > "$TMP_ENV" <<EOF
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
EOF

scp -o StrictHostKeyChecking=accept-new "$TMP_ENV" "root@${HOST}:/root/n8n/.env.supabase"
rm -f "$TMP_ENV"

ssh -o StrictHostKeyChecking=accept-new "root@${HOST}" 'bash -s' <<'REMOTE'
set -e
cd /root/n8n
COMPOSE=docker-compose.yaml
if [ -f "${COMPOSE}.bak" ] && ! docker compose config >/dev/null 2>&1; then
  cp "${COMPOSE}.bak" "$COMPOSE"
  echo "  · Restaurado docker-compose.yaml"
fi
cat > docker-compose.override.yml <<'YAML'
services:
  n8n:
    env_file:
      - .env.supabase
YAML
docker compose config >/dev/null
docker compose up -d
echo "✓ n8n reiniciado (override + .env.supabase)"
REMOTE
