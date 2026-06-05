#!/usr/bin/env node
/** Repara docker-compose.yaml de n8n y aplica override + .env.supabase */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function expandPath(p) {
  if (p?.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

const contabo = {
  ...loadEnv(resolve(root, '.env.contabo')),
  ...loadEnv(resolve(root, 'accesos-bepelican.env')),
};
const host = contabo.CONTABO_SSH_HOST;
const user = contabo.CONTABO_SSH_USER || 'root';
const keyPath = expandPath(contabo.CONTABO_SSH_KEY_PATH);
if (!host) {
  console.error('✗ Falta CONTABO_SSH_HOST');
  process.exit(1);
}
const sshArgs = keyPath
  ? ['-i', keyPath, '-o', 'StrictHostKeyChecking=accept-new', user + '@' + host]
  : ['-o', 'StrictHostKeyChecking=accept-new', user + '@' + host];

const bashScript = `set -e
cd /root/n8n
strip_injected() {
  grep -vE '^[[:space:]]*-[[:space:]]*(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|N8N_BLOCK_ENV_ACCESS_IN_NODE|FINNHUB_API_KEY)=' "$1" | \\
    grep -vE '^[[:space:]]*env_file:' | grep -vE '^[[:space:]]*- \\.env\\.supabase' || true
}
for candidate in docker-compose.yaml.bak docker-compose.yaml; do
  [ -f "$candidate" ] || continue
  strip_injected "$candidate" > docker-compose.yaml.tmp
  if docker compose -f docker-compose.yaml.tmp config >/dev/null 2>&1; then
    mv docker-compose.yaml.tmp docker-compose.yaml
    echo "✓ compose válido desde $candidate"
    break
  fi
done
cat > docker-compose.override.yml <<'YAML'
services:
  n8n:
    env_file:
      - .env.supabase
YAML
docker compose config >/dev/null
docker compose up -d
docker ps --format '{{.Names}}' | grep n8n
`;

const r = spawnSync('ssh', [...sshArgs, 'bash', '-s'], {
  input: bashScript,
  encoding: 'utf8',
  timeout: 120000,
});
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status === 0 ? 0 : 1);
