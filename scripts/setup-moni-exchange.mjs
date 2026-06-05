#!/usr/bin/env node
/**
 * Conecta Moni Exchange: PostgREST + env n8n + deploy workflow + prueba REST.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

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

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'inherit', ...opts });
  return r.status === 0;
}

const self = loadEnv(resolve(root, '.env.selfhosted'));
const url = (self.VITE_SUPABASE_URL || self.SUPABASE_URL || '').replace(/\/$/, '');
const key = self.SERVICE_ROLE_KEY || self.SUPABASE_SERVICE_ROLE_KEY;

console.log('BePelican — Moni Exchange (conectar todo)\n');

if (url && key) {
  const probe = {
    rate_date: '2099-01-01',
    base_currency: 'USD',
    quote_currency: 'EUR',
    par: 'EUR/USD',
    c: 1,
    h: 1,
    rate: 1,
    source: 'probe',
    provider: 'test',
    fetched_at: new Date().toISOString(),
  };
  const res = await fetch(`${url}/rest/v1/daily_rates?on_conflict=rate_date,quote_currency`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'moni_exchange',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(probe),
  });
  if (res.ok) {
    await fetch(
      `${url}/rest/v1/daily_rates?rate_date=eq.2099-01-01&quote_currency=eq.EUR`,
      {
        method: 'DELETE',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Profile': 'moni_exchange',
        },
      },
    );
    console.log('✓ REST upsert moni_exchange.daily_rates OK\n');
  } else {
    const body = await res.text();
    console.log(`⚠ REST upsert falló (${res.status}): ${body.slice(0, 200)}`);
    console.log('  → Corré: npm run db:moni-postgrest\n');
  }
} else {
  console.log('ℹ Sin .env.selfhosted — omitiendo prueba REST\n');
}

run('node', ['scripts/apply-moni-postgrest-schema.mjs'], { stdio: 'inherit' });

if (existsSync(resolve(root, '.env.selfhosted'))) {
  const sh = resolve(root, 'scripts/set-n8n-supabase-env.sh');
  if (!run('bash', [sh], { stdio: 'inherit' })) {
    console.log('⚠ No se pudo actualizar env de n8n (revisá SSH)\n');
  }
} else {
  console.log('ℹ Sin .env.selfhosted — configurá SUPABASE_* en n8n a mano\n');
}

if (!run('npm', ['run', 'n8n:deploy'], { stdio: 'inherit' })) {
  process.exit(1);
}

console.log(`
✓ Pipeline en repo:
  Frankfurter → Normalizar → Mapear → Guardar en Supabase

En n8n: activá el workflow y ejecutá "Manual (probar ahora)".
Verificá filas: moni_exchange.daily_rates o vista latest_daily_rates.
`);
