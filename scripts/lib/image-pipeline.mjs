/**
 * Pipeline de imágenes (Node / scripts) — espejo de src/lib/imagePipeline.ts
 */
import sharp from 'sharp';

export const IMAGE_VARIANT_WIDTHS = [400, 800, 1920];
export const IMAGE_CANONICAL_WIDTH = 1920;
export const IMAGE_CACHE_CONTROL = '31536000';

const PIPELINE_SUFFIX_RE = /-(400|800|1920)\.(webp|jpe?g)$/i;
const LEGACY_COVER_RE = /-cover\.jpe?g$/i;
const LEGACY_GALLERY_RE = /\/gallery\/.+-\d+\.jpe?g$/i;

export function storagePathsForImageBase(basePath) {
  const paths = [`${basePath}.jpg`, `${basePath}.jpeg`];
  for (const w of IMAGE_VARIANT_WIDTHS) {
    paths.push(`${basePath}-${w}.webp`, `${basePath}-${w}.jpg`);
  }
  return paths;
}

export function isPipelineCanonicalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.split('?')[0].toLowerCase().endsWith(`-${IMAGE_CANONICAL_WIDTH}.webp`);
}

export function isExperienceStorageUrl(url) {
  return typeof url === 'string' && url.includes('/storage/v1/object/public/');
}

/** Necesita reprocesar si es Storage y no es la URL canónica del pipeline. */
export function needsReprocess(url) {
  if (!url || !isExperienceStorageUrl(url)) return false;
  if (isPipelineCanonicalUrl(url)) return false;
  return true;
}

/**
 * Ruta en bucket → prefijo base para variantes.
 * ej. `slug/slug-cover.jpg` → `slug/slug-cover`
 */
export function resolveStorageBasePath(storagePath) {
  if (!storagePath) return null;

  const pipeline = storagePath.match(/^(.+)-(400|800|1920)\.(webp|jpe?g)$/i);
  if (pipeline) return pipeline[1];

  if (LEGACY_COVER_RE.test(storagePath)) {
    return storagePath.replace(/\.(jpe?g)$/i, '');
  }

  if (LEGACY_GALLERY_RE.test(storagePath)) {
    return storagePath.replace(/\.(jpe?g)$/i, '');
  }

  if (PIPELINE_SUFFIX_RE.test(storagePath)) {
    return storagePath.replace(PIPELINE_SUFFIX_RE, '');
  }

  return null;
}

/**
 * @param {Buffer} inputBuffer
 * @returns {Promise<{ labelWidth: number, webp: Buffer, jpeg: Buffer }[]>}
 */
export async function processImageBuffer(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const srcW = meta.width || IMAGE_CANONICAL_WIDTH;
  const variants = [];

  for (const labelWidth of IMAGE_VARIANT_WIDTHS) {
    const width = Math.min(labelWidth, srcW);
    const resized = sharp(inputBuffer).resize({ width, withoutEnlargement: true });
    const webp = await resized.clone().webp({ quality: 82 }).toBuffer();
    const jpeg = await resized.clone().jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    variants.push({ labelWidth, webp, jpeg });
  }

  return variants;
}
