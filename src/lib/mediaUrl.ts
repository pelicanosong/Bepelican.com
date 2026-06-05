const CLOUD_HOST = 'faobrifmlrgxaejnwmep.supabase.co';

const SELF_HOSTED_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ||
  'https://supabase-bepelican.duckdns.org';

/** Reescribe URLs del Supabase Cloud (Lovable) al self-hosted en Contabo. */
/** Ruta en bucket desde URL pública de Supabase Storage. */
export function parseStoragePublicUrl(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    const marker = '/storage/v1/object/public/';
    const i = url.indexOf(marker);
    if (i === -1) return null;
    const rest = url.slice(i + marker.length);
    const slash = rest.indexOf('/');
    if (slash === -1) return null;
    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    };
  } catch {
    return null;
  }
}

function toProxiedStorageUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/';
  const i = url.indexOf(marker);
  if (i === -1) return null;
  // En dev, Vite proxya /storage → Supabase (mismo origen que localhost:8080/8081)
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}${url.slice(i)}`;
  }
  return `${SELF_HOSTED_URL}${url.slice(i)}`;
}

export function resolveMediaUrl(url: string | null | undefined): string | null | undefined {
  if (!url || typeof url !== 'string') return url;

  try {
    if (url.includes(CLOUD_HOST)) {
      return toProxiedStorageUrl(url) ?? url;
    }
    if (url.includes('supabase-bepelican.duckdns.org')) {
      return toProxiedStorageUrl(url) ?? url;
    }
    return url;
  } catch {
    return url;
  }
}

export function resolveMediaUrls(urls: string[] | null | undefined): string[] | undefined {
  if (!urls) return urls;
  return urls.map((u) => resolveMediaUrl(u) ?? u);
}

/** Fuerza recarga tras reemplazar un objeto en la misma ruta (cacheControl largo en Storage). */
export function withCacheBust(url: string, version: number = Date.now()): string {
  try {
    const u = new URL(url);
    u.searchParams.set('v', String(version));
    return u.toString();
  } catch {
    const [base, query] = url.split('?');
    const params = new URLSearchParams(query);
    params.set('v', String(version));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : `${base}?v=${version}`;
  }
}

export function withResolvedMedia<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  if (typeof out.cover_image === 'string') out.cover_image = resolveMediaUrl(out.cover_image);
  if (typeof out.main_image_url === 'string') out.main_image_url = resolveMediaUrl(out.main_image_url);
  if (typeof out.image_url === 'string') out.image_url = resolveMediaUrl(out.image_url);
  if (typeof out.pdf_url === 'string') out.pdf_url = resolveMediaUrl(out.pdf_url);
  if (Array.isArray(out.gallery_images)) {
    out.gallery_images = resolveMediaUrls(out.gallery_images as string[]);
  }
  return out;
}
