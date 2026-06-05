#!/usr/bin/env bash
# Añade OPENWEATHER_API_KEY a /root/n8n/.env.supabase y reinicia n8n.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/n8n/.env.openweather}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ Falta $ENV_FILE (OPENWEATHER_API_KEY=…)"
  echo "  Creá el archivo con tu key de https://openweathermap.org/api"
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

if [[ -z "${OPENWEATHER_API_KEY:-}" ]]; then
  echo "✗ Falta OPENWEATHER_API_KEY en $ENV_FILE"
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

ssh -o StrictHostKeyChecking=accept-new "root@${HOST}" bash -s <<REMOTE
set -e
cd /root/n8n
ENV_FILE=.env.supabase
touch "\$ENV_FILE"
if grep -q '^OPENWEATHER_API_KEY=' "\$ENV_FILE"; then
  sed -i.bak "s|^OPENWEATHER_API_KEY=.*|OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}|" "\$ENV_FILE"
else
  echo "OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}" >> "\$ENV_FILE"
fi
if ! grep -q '^N8N_BLOCK_ENV_ACCESS_IN_NODE=' "\$ENV_FILE"; then
  echo "N8N_BLOCK_ENV_ACCESS_IN_NODE=false" >> "\$ENV_FILE"
fi
docker compose up -d
echo "✓ n8n reiniciado (OPENWEATHER_API_KEY en .env.supabase)"
REMOTE
