#!/usr/bin/env node
/** Cuenta filas en moni_exchange.daily_rates (REST o SSH psql). */
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

const self = loadEnv(resolve(root, '.env.selfhosted'));
const url = (self.VITE_SUPABASE_URL || self.SUPABASE_URL || '').replace(/\/$/, '');
const key = self.SERVICE_ROLE_KEY || self.SUPABASE_SERVICE_ROLE_KEY;

if (url && key) {
  const res = await fetch(`${url}/rest/v1/daily_rates?select=rate_date,par`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Accept-Profile': 'moni_exchange',
    },
  });
  if (res.ok) {
    const rows = await res.json();
    console.log(`REST: ${rows.length} filas en moni_exchange.daily_rates`);
    if (rows.length) console.log('  Ejemplo:', rows.slice(0, 3).map((r) => `${r.par} @ ${r.rate_date}`).join(', '));
    process.exit(0);
  }
  console.log('REST falló:', res.status, (await res.text()).slice(0, 120));
}

const contabo = {
  ...loadEnv(resolve(root, '.env.contabo')),
  ...loadEnv(resolve(root, 'accesos-bepelican.env')),
};
const host = contabo.CONTABO_SSH_HOST;
const user = contabo.CONTABO_SSH_USER || 'root';
const keyPath = expandPath(contabo.CONTABO_SSH_KEY_PATH);
const sshArgs = keyPath
  ? ['-i', keyPath, '-o', 'StrictHostKeyChecking=accept-new', user + '@' + host]
  : ['-o', 'StrictHostKeyChecking=accept-new', user + '@' + host];

const cmd =
  'docker exec supabase-db psql -U supabase_admin -d postgres -t -c "SELECT count(*) FROM moni_exchange.daily_rates;"';
const r = spawnSync('ssh', [...sshArgs, cmd], { encoding: 'utf8', timeout: 30000 });
if (r.stdout) console.log('SQL count:', r.stdout.trim());
process.exit(r.status === 0 ? 0 : 1);
