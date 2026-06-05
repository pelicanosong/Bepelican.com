#!/usr/bin/env node
/** Importa/actualiza un workflow JSON en n8n Contabo por ID. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowId = process.argv[2] || 'b3vpunN5zFE4sufq';
const workflowPath = process.argv[3] || resolve(root, 'n8n/finnhub-forex-daily.workflow.json');

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
const sshArgs = keyPath
  ? ['-i', keyPath, '-o', 'StrictHostKeyChecking=accept-new', user + '@' + host]
  : ['-o', 'StrictHostKeyChecking=accept-new', user + '@' + host];

const neu = JSON.parse(readFileSync(workflowPath, 'utf8'));

const exportCmd =
  'docker exec n8n n8n export:workflow --id=' +
  workflowId +
  ' --output=/tmp/wf-export.json && docker cp n8n:/tmp/wf-export.json /tmp/wf-export.json';
let r = spawnSync('ssh', [...sshArgs, exportCmd], { encoding: 'utf8', timeout: 60000 });
if (r.status !== 0) {
  console.error('export failed:', r.stderr || r.stdout);
  console.error('→ Probá: node scripts/fix-n8n-compose.mjs && bash scripts/set-n8n-supabase-env.sh');
  process.exit(1);
}

const scpDown = spawnSync(
  'scp',
  ['-o', 'StrictHostKeyChecking=accept-new', user + '@' + host + ':/tmp/wf-export.json', '/tmp/wf-export.json'],
  { stdio: 'inherit' },
);
if (scpDown.status !== 0) process.exit(1);

const cur = JSON.parse(readFileSync('/tmp/wf-export.json', 'utf8'))[0];
const byName = Object.fromEntries((cur.nodes || []).map((n) => [n.name, n]));
cur.nodes = neu.nodes.map((n) => {
  const prev = byName[n.name];
  return prev ? { ...n, id: prev.id } : n;
});
cur.connections = neu.connections;
cur.settings = { ...cur.settings, ...neu.settings };
cur.name = neu.name;
cur.active = true;
writeFileSync('/tmp/wf-update.json', JSON.stringify([cur], null, 2));

spawnSync(
  'scp',
  ['-o', 'StrictHostKeyChecking=accept-new', '/tmp/wf-update.json', user + '@' + host + ':/tmp/wf-update.json'],
  { stdio: 'inherit' },
);

const importCmd =
  'docker cp /tmp/wf-update.json n8n:/tmp/wf-update.json && docker exec n8n n8n import:workflow --input=/tmp/wf-update.json';
r = spawnSync('ssh', [...sshArgs, importCmd], { encoding: 'utf8', timeout: 120000 });
console.log(r.stdout || r.stderr);
if (r.status !== 0) process.exit(1);

const postImport =
  'sleep 5 && docker exec n8n n8n update:workflow --id=' +
  workflowId +
  ' --active=true && docker exec n8n n8n execute --id=' +
  workflowId +
  ' 2>&1 | tail -25';
console.log('\n→ Activar + ejecución de prueba…\n');
const run = spawnSync('ssh', [...sshArgs, postImport], { encoding: 'utf8', timeout: 300000 });
if (run.stdout) process.stdout.write(run.stdout);
if (run.stderr) process.stderr.write(run.stderr);
if (run.status !== 0) {
  console.log('ℹ Si falla execute, activá el workflow en la UI y usá Manual (probar ahora).');
}

process.exit(0);
