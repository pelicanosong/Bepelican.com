/** Exporta datos públicos de Cloud a supabase/migration-data/*.json */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'supabase/migration-data');
mkdirSync(outDir, { recursive: true });

const envFile = resolve(root, '.env.cloud');
const localEnv = readFileSync(envFile, 'utf8');
const urlMatch = localEnv.match(/VITE_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = localEnv.match(/VITE_SUPABASE_PUBLISHABLE_KEY="?([^"\n]+)"?/);
const CLOUD_URL = urlMatch?.[1];
const CLOUD_KEY = keyMatch?.[1];
if (!CLOUD_URL || !CLOUD_KEY) throw new Error('Falta .env.cloud con URL y key de Supabase Cloud');

// Solo tablas del SPEC BePelican (sin blog, artesanías, usuarios ni pedidos)
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
];

async function fetchAll(table) {
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${CLOUD_URL}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`,
      { headers: { apikey: CLOUD_KEY, Authorization: `Bearer ${CLOUD_KEY}` } }
    );
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

let total = 0;
for (const table of TABLES) {
  const rows = await fetchAll(table);
  writeFileSync(resolve(outDir, `${table}.json`), JSON.stringify(rows));
  console.log(`${table}: ${rows.length}`);
  total += rows.length;
}
console.log(`Exportado: ${total} filas → ${outDir}`);
