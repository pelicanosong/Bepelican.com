/** Anchos de variantes generadas al subir (nombre de archivo = este valor). */
export const IMAGE_VARIANT_WIDTHS = [400, 800, 1920] as const;

export type ImageVariantLabel = (typeof IMAGE_VARIANT_WIDTHS)[number];

export const IMAGE_CANONICAL_WIDTH: ImageVariantLabel = 1920;

export const IMAGE_CACHE_CONTROL = '31536000';

export interface EncodedVariant {
  /** Sufijo en Storage, p. ej. 800 → `...-cover-800.webp` */
  labelWidth: ImageVariantLabel;
  webp: Blob;
  jpeg: Blob;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`No se pudo codificar ${type}`))),
      type,
      quality
    );
  });
}

function resizeToCanvas(bitmap: ImageBitmap, targetWidth: number): HTMLCanvasElement {
  const width = Math.min(targetWidth, bitmap.width);
  const height = Math.round((bitmap.height / bitmap.width) * width);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

let webpEncodeSupported: boolean | null = null;

async function supportsWebpEncode(): Promise<boolean> {
  if (webpEncodeSupported !== null) return webpEncodeSupported;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const blob = await canvasToBlob(canvas, 'image/webp', 0.8);
    webpEncodeSupported = blob.type === 'image/webp';
  } catch {
    webpEncodeSupported = false;
  }
  return webpEncodeSupported;
}

/**
 * Genera variantes 400 / 800 / 1920 px (sin ampliar por encima del original).
 */
export async function processImageForUpload(file: File): Promise<EncodedVariant[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const useWebp = await supportsWebpEncode();
    const variants: EncodedVariant[] = [];

    for (const labelWidth of IMAGE_VARIANT_WIDTHS) {
      const canvas = resizeToCanvas(bitmap, labelWidth);
      const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.85);
      let webp: Blob;
      if (useWebp) {
        webp = await canvasToBlob(canvas, 'image/webp', 0.82);
      } else {
        webp = jpeg;
      }
      variants.push({ labelWidth, webp, jpeg });
    }

    return variants;
  } finally {
    bitmap.close();
  }
}

/** Rutas a borrar para un prefijo de imagen (variantes + legado). */
export function storagePathsForImageBase(basePath: string): string[] {
  const paths: string[] = [`${basePath}.jpg`, `${basePath}.jpeg`];
  for (const w of IMAGE_VARIANT_WIDTHS) {
    paths.push(`${basePath}-${w}.webp`, `${basePath}-${w}.jpg`);
  }
  return paths;
}
