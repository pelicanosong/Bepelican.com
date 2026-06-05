#!/usr/bin/env node
/**
 * Reprocesa portadas y galerías de experiencias al pipeline 400/800/1920 (WebP + JPEG).
 *
 * Uso:
 *   node scripts/reprocess-experience-images.mjs
 *   node scripts/reprocess-experience-images.mjs --dry-run
 *   node scripts/reprocess-experience-images.mjs --slug=guajira-3-dias-2-noches
 *   node scripts/reprocess-experience-images.mjs --limit=5
 *
 * Requiere: VITE_SUPABASE_URL, SERVICE_ROLE_KEY (.env.selfhosted o .env)
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/notion-client.mjs';
import {
  parseStoragePublicUrl,
  downloadBytes,
  uploadToStorage,
  buildPublicStorageUrl,
  rewriteCloudStorageUrl,
} from './lib/media-storage.mjs';
import {
  IMAGE_CANONICAL_WIDTH,
  needsReprocess,
  resolveStorageBasePath,
  storagePathsForImageBase,
  processImageBuffer,
} from './lib/image-pipeline.mjs';

const dryRun = process.argv.includes('--dry-run');
const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1];
const limitArg = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0);

function collectImageUrls(row) {
  const urls = [];
  if (row.cover_image) urls.push(row.cover_image);
  if (Array.isArray(row.gallery_images)) {
    for (const u of row.gallery_images) {
      if (u) urls.push(u);
    }
  }
  return [...new Set(urls)];
}

async function uploadVariants(supabase, bucket, basePath, variants) {
  for (const { labelWidth, webp, jpeg } of variants) {
    await uploadToStorage(supabase, bucket, `${basePath}-${labelWidth}.webp`, {
      buffer: webp,
      contentType: 'image/webp',
    });
    await uploadToStorage(supabase, bucket, `${basePath}-${labelWidth}.jpg`, {
      buffer: jpeg,
      contentType: 'image/jpeg',
    });
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} supabaseUrl
 * @param {string} url
 * @param {Map<string, string>} urlMap
 */
async function reprocessUrl(supabase, supabaseUrl, url, urlMap) {
  if (urlMap.has(url)) return urlMap.get(url);
  if (!needsReprocess(url)) {
    urlMap.set(url, url);
    return url;
  }

  const fetchUrl = rewriteCloudStorageUrl(url, supabaseUrl);
  const parsed = parseStoragePublicUrl(fetchUrl);
  if (!parsed) {
    console.warn(`  ⚠ URL no parseable: ${url}`);
    urlMap.set(url, url);
    return url;
  }

  if (parsed.bucket !== 'experiences') {
    console.warn(`  ⚠ Bucket "${parsed.bucket}" omitido (solo experiences)`);
    urlMap.set(url, url);
    return url;
  }

  const basePath = resolveStorageBasePath(parsed.path);
  if (!basePath) {
    console.warn(`  ⚠ Ruta no reconocida: ${parsed.path}`);
    urlMap.set(url, url);
    return url;
  }

  const canonicalPath = `${basePath}-${IMAGE_CANONICAL_WIDTH}.webp`;
  const canonicalUrl = buildPublicStorageUrl(supabaseUrl, parsed.bucket, canonicalPath);

  process.stdout.write(`  ${parsed.path} → ${canonicalPath} … `);

  if (dryRun) {
    console.log('dry-run');
    urlMap.set(url, canonicalUrl);
    return canonicalUrl;
  }

  try {
    const { buffer } = await downloadBytes(fetchUrl);
    const variants = await processImageBuffer(buffer);

    await supabase.storage.from(parsed.bucket).remove(storagePathsForImageBase(basePath));
    await uploadVariants(supabase, parsed.bucket, basePath, variants);

    console.log('✓');
    urlMap.set(url, canonicalUrl);
    return canonicalUrl;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    urlMap.set(url, url);
    return url;
  }
}

function applyUrlMapToRow(row, urlMap) {
  let cover = row.cover_image;
  if (cover && urlMap.has(cover)) cover = urlMap.get(cover);

  let gallery = row.gallery_images;
  if (Array.isArray(gallery)) {
    gallery = gallery.map((u) => (u && urlMap.has(u) ? urlMap.get(u) : u));
  }

  return { cover_image: cover, gallery_images: gallery };
}

function rowChanged(before, after) {
  if (before.cover_image !== after.cover_image) return true;
  const g1 = before.gallery_images || [];
  const g2 = after.gallery_images || [];
  if (g1.length !== g2.length) return true;
  return g1.some((u, i) => u !== g2[i]);
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

  let query = supabase
    .from('experiences')
    .select('id, slug, title, cover_image, gallery_images')
    .order('slug');

  if (slugArg) query = query.eq('slug', slugArg);

  const { data: rows, error } = await query;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let experiences = rows || [];
  if (limitArg > 0) experiences = experiences.slice(0, limitArg);

  console.log(
    `Experiencias: ${experiences.length}${dryRun ? ' (dry-run)' : ''}${slugArg ? ` slug=${slugArg}` : ''}\n`
  );

  const urlMap = new Map();
  let imagesTouched = 0;
  let imagesSkipped = 0;

  for (const row of experiences) {
    const urls = collectImageUrls(row);
    const toProcess = urls.filter(needsReprocess);
    if (toProcess.length === 0) continue;

    console.log(`\n[${row.slug}] ${row.title} (${toProcess.length} imagen/es)`);

    for (const url of toProcess) {
      const before = url;
      await reprocessUrl(supabase, supabaseUrl, url, urlMap);
      if (urlMap.get(before) !== before || dryRun) imagesTouched++;
      else imagesSkipped++;
    }
  }

  if (urlMap.size === 0) {
    console.log('\nNada que reprocesar (todas canónicas o sin Storage).');
    return;
  }

  if (dryRun) {
    console.log(`\nDry-run: ${imagesTouched} imagen(es) se procesarían. BD sin cambios.`);
    return;
  }

  let rowsUpdated = 0;
  for (const row of experiences) {
    const updated = applyUrlMapToRow(row, urlMap);
    if (!rowChanged(row, updated)) continue;

    const { error: updErr } = await supabase
      .from('experiences')
      .update({
        cover_image: updated.cover_image,
        gallery_images: updated.gallery_images,
      })
      .eq('id', row.id);

    if (updErr) {
      console.warn(`  BD ${row.slug}: ${updErr.message}`);
    } else {
      rowsUpdated++;
    }
  }

  console.log(
    `\nListo. Imágenes procesadas: ${imagesTouched}, filas BD actualizadas: ${rowsUpdated}.`
  );
  console.log('Purgá cache en CDN si las URLs antiguas siguen en caché.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
