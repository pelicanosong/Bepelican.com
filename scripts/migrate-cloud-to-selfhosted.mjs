/**
 * Migra datos del schema public (Supabase Cloud) al schema ecommerce (self-hosted).
 * Uso: node scripts/migrate-cloud-to-selfhosted.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.includes('=') || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const localEnv = loadEnv(resolve(root, '.env'));
const selfHostedEnv = loadEnv(resolve(root, '.env.selfhosted'));

const CLOUD_URL = 'https://faobrifmlrgxaejnwmep.supabase.co';
const CLOUD_KEY =
  process.env.CLOUD_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhb2JyaWZtbHJneGFlam53bWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzQyNzcsImV4cCI6MjA4MzY1MDI3N30.PH0I4LD4MSUTh5mv564dobkAo7riOb2gyrQ6tDYyc5g';

const TARGET_URL = selfHostedEnv.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL;
const TARGET_KEY = selfHostedEnv.SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!TARGET_URL || !TARGET_KEY) {
  console.error('Falta .env.selfhosted con VITE_SUPABASE_URL y SERVICE_ROLE_KEY');
  console.error('Copiá SERVICE_ROLE_KEY desde Studio → Settings → API en tu self-hosted');
  process.exit(1);
}

// Orden por dependencias FK
const TABLES = [
  'categories_experience',
  'experiences',
  'experience_categories',
  'pricing_rules',
  'hero_slides',
  'flipbook_categories',
  'flipbooks',
  'flipbook_category_relations',
  'flipbook_experience_links',
  'lodgings',
  'lodging_room_types',
  'lodging_seasons',
  'room_season_rates',
  'experience_lodgings',
  'experience_blocked_dates',
  'faqs',
  'site_settings',
  'artesanias',
  'artesania_variantes',
  'blog_posts',
];

async function fetchCloud(table) {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const url = `${CLOUD_URL}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        apikey: CLOUD_KEY,
        Authorization: `Bearer ${CLOUD_KEY}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Cloud GET ${table}: ${res.status} ${body}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

async function insertTarget(table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 filas (skip)`);
    return 0;
  }
  const res = await fetch(`${TARGET_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: TARGET_KEY,
      Authorization: `Bearer ${TARGET_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
      'Accept-Profile': 'ecommerce',
      'Content-Profile': 'ecommerce',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Target POST ${table}: ${res.status} ${body}`);
  }
  console.log(`  ${table}: ${rows.length} filas ✓`);
  return rows.length;
}

async function main() {
  console.log('Cloud →', CLOUD_URL);
  console.log('Target →', TARGET_URL, '(schema ecommerce)\n');

  let total = 0;
  for (const table of TABLES) {
    process.stdout.write(`Migrando ${table}... `);
    try {
      const rows = await fetchCloud(table);
      process.stdout.write(`${rows.length} leídas → `);
      total += await insertTarget(table, rows);
    } catch (e) {
      console.log(`\n  ⚠ ${e.message}`);
    }
  }

  console.log(`\nListo: ${total} filas migradas en total.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
