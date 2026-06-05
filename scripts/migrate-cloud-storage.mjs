#!/usr/bin/env node
/**
 * Copia archivos de Supabase Cloud → self-hosted y actualiza URLs en la BD.
 * Requiere que Cloud permita descargas (si devuelve 402, reactivá el proyecto Lovable/Cloud primero).
 *
 * Uso: node scripts/migrate-cloud-storage.mjs
 *      node scripts/migrate-cloud-storage.mjs --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/notion-client.mjs';
import {
  isCloudStorageUrl,
  parseStoragePublicUrl,
  downloadBytes,
  uploadToStorage,
  buildPublicStorageUrl,
  rewriteCloudStorageUrl,
} from './lib/media-storage.mjs';

const dryRun = process.argv.includes('--dry-run');

const URL_COLUMNS = [
  { table: 'experiences', columns: ['cover_image', 'gallery_images'] },
  { table: 'flipbooks', columns: ['cover_image', 'pdf_url'] },
  { table: 'hero_slides', columns: ['image_url'] },
  { table: 'lodgings', columns: ['main_image_url', 'gallery_images'] },
  { table: 'lodging_room_types', columns: ['main_image_url', 'gallery_images'] },
  { table: 'blog_posts', columns: ['cover_image'] },
  { table: 'artesanias', columns: ['main_image_url', 'gallery_images'] },
];

function collectUrls(rows, columns) {
  const urls = new Set();
  for (const row of rows) {
    for (const col of columns) {
      const v = row[col];
      if (typeof v === 'string' && isCloudStorageUrl(v)) urls.add(v);
      if (Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === 'string' && isCloudStorageUrl(item)) urls.add(item);
        }
      }
    }
  }
  return [...urls];
}

function applyUrlMap(row, columns, urlMap) {
  const out = { ...row };
  for (const col of columns) {
    const v = out[col];
    if (typeof v === 'string' && urlMap.has(v)) out[col] = urlMap.get(v);
    if (Array.isArray(v)) {
      out[col] = v.map((item) => (typeof item === 'string' && urlMap.has(item) ? urlMap.get(item) : item));
    }
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Falta VITE_SUPABASE_URL y SERVICE_ROLE_KEY (.env.selfhosted)');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    db: { schema: 'ecommerce' },
  });
  supabase.supabaseUrl = supabaseUrl;

  const allUrls = new Set();
  const tableRows = {};

  for (const { table, columns } of URL_COLUMNS) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`⚠ ${table}: ${error.message}`);
      continue;
    }
    tableRows[table] = { rows: data || [], columns };
    for (const u of collectUrls(data || [], columns)) allUrls.add(u);
    console.log(`${table}: ${(data || []).length} filas, ${collectUrls(data || [], columns).length} URLs cloud`);
  }

  console.log(`\nTotal URLs únicas en Cloud: ${allUrls.size}`);
  if (!allUrls.size) {
    console.log('Nada que migrar.');
    return;
  }

  const urlMap = new Map();
  let ok = 0;
  let fail = 0;

  for (const oldUrl of allUrls) {
    const parsed = parseStoragePublicUrl(oldUrl);
    if (!parsed) continue;
    process.stdout.write(`${parsed.bucket}/${parsed.path} … `);
    if (dryRun) {
      console.log('dry-run');
      urlMap.set(oldUrl, buildPublicStorageUrl(supabaseUrl, parsed.bucket, parsed.path));
      ok++;
      continue;
    }
    try {
      const { buffer, contentType } = await downloadBytes(oldUrl);
      const newUrl = await uploadToStorage(supabase, parsed.bucket, parsed.path, { buffer, contentType });
      urlMap.set(oldUrl, newUrl);
      console.log('✓');
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      // No reescribir URL en BD si el archivo no se copió (evita enlaces rotos en self-hosted).
      fail++;
    }
  }

  console.log(`\nArchivos: ${ok} ok, ${fail} fallidos`);
  if (fail > 0) {
    console.log(
      'Si ves 402: el proyecto Cloud (Lovable) está suspendido por cuota. Reactivalo o importá con npm run storage:import.'
    );
  }

  if (dryRun) {
    console.log('Dry-run: no se actualizó la BD.');
    return;
  }

  if (ok === 0) {
    console.log('\nNo se actualizó la BD (ningún archivo migrado).');
    return;
  }

  for (const [table, { rows, columns }] of Object.entries(tableRows)) {
    for (const row of rows) {
      const updated = applyUrlMap(row, columns, urlMap);
      const changed = columns.some((c) => updated[c] !== row[c]);
      if (!changed) continue;
      const { error } = await supabase.from(table).update(updated).eq('id', row.id);
      if (error) console.warn(`  update ${table}/${row.id}: ${error.message}`);
    }
    console.log(`BD ${table}: URLs actualizadas`);
  }

  console.log('\nListo. Purge cache en Cloudflare si hace falta.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
