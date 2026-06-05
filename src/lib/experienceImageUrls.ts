import { IMAGE_VARIANT_WIDTHS, type ImageVariantLabel } from '@/lib/imagePipeline';

export type ExperienceImageSize = 'thumb' | 'card' | 'hero';

const SIZE_TO_WIDTH: Record<ExperienceImageSize, ImageVariantLabel> = {
  thumb: 400,
  card: 800,
  hero: 1920,
};

const PIPELINE_URL_RE = /^(.+)-(\d+)\.(webp|jpe?g)$/i;
const LEGACY_COVER_RE = /^(.+)-cover\.jpe?g$/i;
const LEGACY_GALLERY_RE = /^(.+)-(\d+)\.jpe?g$/i;

/** Solo variantes reales del pipeline (400 / 800 / 1920), no galería legada `-1.jpg`. */
function pipelineWidthFromPath(path: string): ImageVariantLabel | null {
  const m = path.match(PIPELINE_URL_RE);
  if (!m) return null;
  const w = Number(m[2]);
  return IMAGE_VARIANT_WIDTHS.includes(w as ImageVariantLabel) ? (w as ImageVariantLabel) : null;
}

function isPipelineUrl(url: string): boolean {
  return pipelineWidthFromPath(url.split('?')[0]) != null;
}

function isLegacyUrl(url: string): boolean {
  const path = url.split('?')[0];
  return LEGACY_COVER_RE.test(path) || LEGACY_GALLERY_RE.test(path);
}

/**
 * URL de variante a partir de la canónica guardada en BD (`...-1920.webp`)
 * o legado (`...-cover.jpg`).
 */
export function experienceImageUrl(
  url: string | null | undefined,
  size: ExperienceImageSize,
  format: 'webp' | 'jpeg' = 'webp'
): string | null | undefined {
  if (!url) return url;

  const path = url.split('?')[0];
  const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';

  const pipelineWidth = pipelineWidthFromPath(path);
  if (pipelineWidth != null) {
    const base = path.match(PIPELINE_URL_RE)![1];
    const width = SIZE_TO_WIDTH[size];
    const ext = format === 'webp' ? 'webp' : 'jpg';
    if (!IMAGE_VARIANT_WIDTHS.includes(width)) return url;
    return `${base}-${width}.${ext}${query}`;
  }

  return url;
}

export function experienceImageSources(
  url: string | null | undefined,
  size: ExperienceImageSize
): { webp: string; jpeg: string; legacy: boolean } | null {
  if (!url) return null;

  if (!isPipelineUrl(url) && isLegacyUrl(url)) {
    return { webp: url, jpeg: url, legacy: true };
  }

  if (!isPipelineUrl(url)) {
    return { webp: url, jpeg: url, legacy: true };
  }

  return {
    webp: experienceImageUrl(url, size, 'webp')!,
    jpeg: experienceImageUrl(url, size, 'jpeg')!,
    legacy: false,
  };
}

export const SIZE_DIMENSIONS: Record<
  ExperienceImageSize,
  { width: number; height: number }
> = {
  thumb: { width: 400, height: 300 },
  card: { width: 800, height: 600 },
  hero: { width: 1920, height: 1440 },
};
