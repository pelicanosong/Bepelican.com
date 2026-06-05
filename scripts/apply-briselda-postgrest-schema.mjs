#!/usr/bin/env node
/**
 * Añade briselda a PGRST_DB_SCHEMAS en Supabase self-hosted (Contabo) y reinicia REST.
 */
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
  ? ['-i', keyPath, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=20', `${user}@${host}`]
  : ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=20', `${user}@${host}`];

const bashScript = `set -e
patch_line() {
  f="$1"
  [ -f "$f" ] || return 0
  grep -q '^PGRST_DB_SCHEMAS=' "$f" || return 0
  if grep '^PGRST_DB_SCHEMAS=' "$f" | grep -q briselda; then
    echo "  · ya incluye briselda: $f"
    return 0
  fi
  sed -i.bak 's/^PGRST_DB_SCHEMAS=\\(.*\\)$/PGRST_DB_SCHEMAS=\\1,briselda/' "$f"
  echo "  ✓ actualizado: $f"
}
while IFS= read -r f; do patch_line "$f"; done <<EOF2
/root/supabase/.env
/root/supabase/docker/.env
EOF2
find /root/supabase -maxdepth 4 -type f \\( -name 'docker-compose.yml' -o -name 'docker-compose.yaml' \\) 2>/dev/null | while read -r yml; do
  if grep -q 'PGRST_DB_SCHEMAS' "$yml" 2>/dev/null && ! grep 'PGRST_DB_SCHEMAS' "$yml" | grep -q briselda; then
    sed -i.bak 's/PGRST_DB_SCHEMAS=\\([^" ]*\\)/PGRST_DB_SCHEMAS=\\1,briselda/g' "$yml"
    echo "  ✓ actualizado: $yml"
  fi
done
for dir in /root/supabase/docker /root/supabase; do
  [ -f "$dir/docker-compose.yml" ] || [ -f "$dir/docker-compose.yaml" ] || continue
  (cd "$dir" && docker compose up -d --force-recreate rest 2>/dev/null) && echo "  ✓ compose up rest en $dir" || true
done
REST=$(docker ps --format '{{.Names}}' | grep -E 'supabase-rest' | head -1)
if [ -n "$REST" ]; then docker restart "$REST" 2>/dev/null || true; fi
KONG=$(docker ps --format '{{.Names}}' | grep -E 'supabase-kong|kong' | head -1)
if [ -n "$KONG" ]; then docker restart "$KONG" 2>/dev/null || true; fi
echo "✓ REST/Kong reiniciados (sin volcar variables de entorno)"
`;

console.log('→ PostgREST: exponer esquema briselda…\n');

const result = spawnSync('ssh', [...sshArgs, 'bash', '-s'], {
  input: bashScript,
  encoding: 'utf8',
  timeout: 90000,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status !== 0) {
  console.error('\n✗ No se pudo actualizar PGRST. Editá manualmente PGRST_DB_SCHEMAS y agregá ,briselda');
  process.exit(1);
}
