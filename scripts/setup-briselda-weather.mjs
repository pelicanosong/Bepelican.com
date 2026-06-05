#!/usr/bin/env node
/**
 * Conecta Briselda: migración + PostgREST + env n8n + deploy workflow.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW_ID = 'HfwlEEcF57ra2DO4';
const WORKFLOW_FILE = resolve(root, 'n8n/briselda-weather-hourly.workflow.json');

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

console.log('BePelican — Briselda (clima horario)\n');

if (url && key) {
  const hour = new Date();
  hour.setUTCMinutes(0, 0, 0);
  const probe = {
    ciudad: '__probe__',
    temperatura: 20,
    sensacion_termica: 20,
    humedad: 50,
    descripcion: 'probe',
    viento_kmh: 0,
    fetched_at: new Date().toISOString(),
    snapshot_hour: hour.toISOString(),
  };
  const res = await fetch(`${url}/rest/v1/destination_weather?on_conflict=ciudad,snapshot_hour`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'briselda',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(probe),
  });
  if (res.ok) {
    await fetch(`${url}/rest/v1/destination_weather?ciudad=eq.__probe__`, {
      method: 'DELETE',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Profile': 'briselda',
      },
    });
    console.log('✓ REST upsert briselda.destination_weather OK\n');
  } else {
    const body = await res.text();
    console.log(`⚠ REST upsert falló (${res.status}): ${body.slice(0, 200)}`);
    console.log('  → Corré: npm run db:briselda && npm run db:briselda-postgrest\n');
  }
} else {
  console.log('ℹ Sin .env.selfhosted — omitiendo prueba REST\n');
}

run('npm', ['run', 'db:briselda'], { stdio: 'inherit' });
run('node', ['scripts/apply-briselda-postgrest-schema.mjs'], { stdio: 'inherit' });

if (existsSync(resolve(root, 'n8n/.env.openweather'))) {
  if (!run('bash', ['scripts/set-n8n-openweather-env.sh'], { stdio: 'inherit' })) {
    console.log('⚠ No se pudo actualizar OPENWEATHER_API_KEY en n8n\n');
  }
} else {
  console.log('ℹ Creá n8n/.env.openweather con OPENWEATHER_API_KEY=…\n');
}

if (existsSync(resolve(root, '.env.selfhosted'))) {
  if (!run('bash', ['scripts/set-n8n-supabase-env.sh'], { stdio: 'inherit' })) {
    console.log('⚠ No se pudo actualizar env Supabase en n8n\n');
  }
} else {
  console.log('ℹ Sin .env.selfhosted — configurá SUPABASE_* en n8n a mano\n');
}

if (!run('node', ['scripts/deploy-n8n-workflow.mjs', WORKFLOW_ID, WORKFLOW_FILE], { stdio: 'inherit' })) {
  process.exit(1);
}

console.log(`
✓ Pipeline en repo:
  Destinos → Por ciudad → OpenWeatherMap → Transformar → Guardar en Supabase

En n8n: activá el workflow y ejecutá "Manual (probar ahora)".
Verificá filas: briselda.destination_weather o vista latest_destination_weather.
`);
