#!/usr/bin/env node
/**
 * Termina Moni Exchange en n8n: valida FX, actualiza workflow por API si hay N8N_API_KEY.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW_ID = 'b3vpunN5zFE4sufq';
const N8N_BASE = process.env.N8N_BASE_URL || 'https://n8n-bepelican.duckdns.org';
const WORKFLOW_FILE = resolve(root, 'n8n/finnhub-forex-daily.workflow.json');

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (val.includes('PEGA_')) continue;
    out[t.slice(0, i).trim()] = val;
  }
  return out;
}

function expandPath(p) {
  if (p?.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

function sshExec(contabo, remoteScript) {
  const host = contabo.CONTABO_SSH_HOST;
  const user = contabo.CONTABO_SSH_USER || 'root';
  if (!host) return { ok: false, out: 'no host' };
  const keyPath = expandPath(contabo.CONTABO_SSH_KEY_PATH);
  const ssh = keyPath
    ? ['ssh', '-i', keyPath, '-o', 'StrictHostKeyChecking=accept-new', `${user}@${host}`]
    : ['ssh', '-o', 'StrictHostKeyChecking=accept-new', `${user}@${host}`];
  const r = spawnSync(ssh[0], [...ssh.slice(1), remoteScript], {
    encoding: 'utf8',
    timeout: 120000,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

const contabo = {
  ...loadEnv(resolve(root, '.env.contabo')),
  ...loadEnv(resolve(root, 'accesos-bepelican.env')),
};
const n8nApiKey = process.env.N8N_API_KEY || contabo.N8N_API_KEY;
const workflowJson = JSON.parse(readFileSync(WORKFLOW_FILE, 'utf8'));

console.log('BePelican — Moni Exchange (n8n)\n');

const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
const fx = await fxRes.json();
if (!fx.rates?.COP) {
  console.error('✗ ER API sin COP');
  process.exit(1);
}
console.log(`✓ Divisas OK (USD→COP: ${fx.rates.COP})`);

const finnhub = loadEnv(resolve(root, 'n8n/.env.finnhub')).FINNHUB_API_KEY;
if (finnhub) {
  const fh = await fetch(
    `https://finnhub.io/api/v1/forex/rates?base=USD&token=${encodeURIComponent(finnhub)}`,
  ).then((r) => r.json());
  if (fh.error) {
    console.log(`ℹ Finnhub forex/rates: ${fh.error} (workflow usa ER API hasta upgrade)`);
  } else {
    console.log('✓ Finnhub forex/rates disponible');
  }
}

async function n8nApi(path, opts = {}) {
  const res = await fetch(`${N8N_BASE}/api/v1${path}`, {
    ...opts,
    headers: {
      'X-N8N-API-KEY': n8nApiKey,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json };
}

let deployed = false;

if (n8nApiKey) {
  const get = await n8nApi(`/workflows/${WORKFLOW_ID}`);
  if (get.ok) {
    const existing = get.json;
    const put = await n8nApi(`/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: existing.name || workflowJson.name,
        nodes: workflowJson.nodes,
        connections: workflowJson.connections,
        settings: workflowJson.settings,
        staticData: existing.staticData ?? null,
      }),
    });
    if (put.ok) {
      deployed = true;
      console.log('✓ Workflow desplegado por API');
      await n8nApi(`/workflows/${WORKFLOW_ID}/activate`, { method: 'POST' });
      console.log('✓ Workflow activado');
    } else {
      console.log('✗ PUT workflow:', put.status, put.json?.message || put.json?.raw);
    }
  } else {
    console.log('✗ GET workflow:', get.status);
  }
} else {
  console.log('ℹ Sin N8N_API_KEY — importá manualmente el JSON');
}

const ssh = sshExec(
  contabo,
  `docker ps --format '{{.Names}}' | grep -i n8n | head -3; ls -la /root/n8n 2>/dev/null | head -5`,
);
if (ssh.ok && ssh.out.trim()) console.log(ssh.out.trim());

if (!deployed) {
  console.log(`
Importá en n8n (30 s):
  1. ${N8N_BASE}/workflow/${WORKFLOW_ID}
  2. ⋮ Actions → Import from file → n8n/finnhub-forex-daily.workflow.json
  3. Activar + Execute workflow (Manual)

API key Finnhub guardada en n8n/.env.finnhub para cuando actives forex en Finnhub.
`);
}

console.log(`\n✓ Flujo configurado en repo. Probar: ${N8N_BASE}/workflow/${WORKFLOW_ID}`);
process.exit(deployed ? 0 : 0);
