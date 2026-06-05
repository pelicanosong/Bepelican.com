#!/usr/bin/env node
/**
 * Sube archivos locales al Supabase self-hosted respetando la ruta en Storage.
 *
 * Estructura esperada (desde la raíz del repo):
 *   storage-import/experiences/{slug}/{slug}-cover.jpg
 *   storage-import/experiences/{slug}/gallery/{slug}-1.jpg
 *   storage-import/lodgings/...
 *
 * También acepta un ZIP descomprimido o copia del bucket exportado de Supabase.
 *
 * Uso:
 *   npm run storage:import
 *   npm run storage:import -- --dir=/ruta/a/carpeta
 *   npm run storage:import -- --dry-run
 *   npm run storage:import -- --reprocess   # tras subir, genera variantes 400/800/1920
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './lib/notion-client.mjs';
import { uploadToStorage } from './lib/media-storage.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const reprocess = process.argv.includes('--reprocess');
const dirArg = process.argv.find((a) => a.startsWith('--dir='))?.split('=')[1];
const importRoot = resolve(dirArg || join(root, 'storage-import'));

const ALLOWED_BUCKETS = new Set(['experiences', 'lodgings', 'flipbooks', 'hero_slides']);

function walkFiles(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkFiles(full, base));
    else if (/\.(jpe?g|png|webp|gif)$/i.test(name)) {
      out.push({ full, rel: relative(base, full).split('\\').join('/') });
    }
  }
  return out;
}

function contentTypeForPath(path) {
  if (/\.png$/i.test(path)) return 'image/png';
  if (/\.webp$/i.test(path)) return 'image/webp';
  if (/\.gif$/i.test(path)) return 'image/gif';
  return 'image/jpeg';
}

async function main() {
  if (!existsSync(importRoot)) {
    console.error(`No existe la carpeta de importación: ${importRoot}`);
    console.error('Creá storage-import/experiences/... con las fotos o pasá --dir=/ruta');
    process.exit(1);
  }

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

  const files = walkFiles(importRoot);
  if (!files.length) {
    console.error(`Sin imágenes en ${importRoot}`);
    process.exit(1);
  }

  console.log(`Importando ${files.length} archivo(s) desde ${importRoot}${dryRun ? ' (dry-run)' : ''}\n`);

  let ok = 0;
  let skip = 0;

  for (const { full, rel } of files) {
    const parts = rel.split('/');
    const bucket = parts[0];
    if (!ALLOWED_BUCKETS.has(bucket)) {
      console.warn(`  omitido (bucket desconocido): ${rel}`);
      skip++;
      continue;
    }
    const path = parts.slice(1).join('/');
    if (!path) {
      skip++;
      continue;
    }

    process.stdout.write(`${bucket}/${path} … `);
    if (dryRun) {
      console.log('dry-run');
      ok++;
      continue;
    }

    try {
      const buffer = readFileSync(full);
      await uploadToStorage(supabase, bucket, path, {
        buffer,
        contentType: contentTypeForPath(path),
      });
      console.log('✓');
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
  }

  console.log(`\nSubidos: ${ok}, omitidos: ${skip}`);

  if (!dryRun && reprocess && ok > 0) {
    console.log('\nReprocesando experiencias (variantes WebP)…');
    const { spawnSync } = await import('child_process');
    const r = spawnSync('node', ['scripts/reprocess-experience-images.mjs'], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }

  if (!dryRun && ok > 0) {
    console.log(
      '\nSi la BD aún apunta a Cloud, ejecutá: npm run storage:migrate (con Cloud activo) o actualizá URLs en admin.'
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
