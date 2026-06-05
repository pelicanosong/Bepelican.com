#!/usr/bin/env bash
# Añade FINNHUB_API_KEY al docker-compose de n8n en Contabo y reinicia.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT/n8n/.env.finnhub"
HOST=$(grep '^CONTABO_SSH_HOST=' "$ROOT/.env.contabo" | cut -d= -f2)
KEY_ESC=$(printf '%s' "$FINNHUB_API_KEY" | sed "s/'/'\\\\''/g")
ssh -o StrictHostKeyChecking=accept-new "root@${HOST}" bash -s <<EOF
set -e
COMPOSE=/root/n8n/docker-compose.yaml
if ! grep -q 'FINNHUB_API_KEY' "\$COMPOSE"; then
  sed -i.bak '/environment:/a\\      - FINNHUB_API_KEY=${KEY_ESC}' "\$COMPOSE"
  echo "Added FINNHUB_API_KEY to compose"
else
  sed -i.bak "s|FINNHUB_API_KEY=.*|FINNHUB_API_KEY=${KEY_ESC}|" "\$COMPOSE"
  echo "Updated FINNHUB_API_KEY in compose"
fi
cd /root/n8n && docker compose up -d
echo "n8n restarted"
EOF
