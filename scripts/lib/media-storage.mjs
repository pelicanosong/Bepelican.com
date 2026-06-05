/**
 * Subida de medios al Supabase self-hosted y reescritura de URLs Cloud → Contabo.
 */
const CLOUD_HOST = 'faobrifmlrgxaejnwmep.supabase.co';

export function isCloudStorageUrl(url) {
  return typeof url === 'string' && url.includes(CLOUD_HOST);
}

export function isExternalMediaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:') || url.startsWith('/')) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** /storage/v1/object/public/{bucket}/{path} */
export function parseStoragePublicUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const marker = '/storage/v1/object/public/';
    const i = u.pathname.indexOf(marker);
    if (i === -1) return null;
    const rest = u.pathname.slice(i + marker.length);
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

export function buildPublicStorageUrl(supabaseUrl, bucket, path) {
  const base = supabaseUrl.replace(/\/$/, '');
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

export function rewriteCloudStorageUrl(url, supabaseUrl) {
  if (!isCloudStorageUrl(url)) return url;
  const parsed = parseStoragePublicUrl(url);
  if (!parsed) return url;
  return buildPublicStorageUrl(supabaseUrl, parsed.bucket, parsed.path);
}

export async function downloadBytes(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} → ${res.status} ${text.slice(0, 200)}`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

export async function uploadToStorage(supabase, bucket, path, { buffer, contentType }) {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType,
    cacheControl: '31536000',
  });
  if (error) throw error;
  return buildPublicStorageUrl(supabase.supabaseUrl, bucket, path);
}

/** Descarga URL externa (Notion, etc.) y sube al bucket experiences. */
export async function mirrorExperienceCover(supabase, slug, sourceUrl) {
  if (!sourceUrl || !slug) return null;
  if (isCloudStorageUrl(sourceUrl)) {
    const parsed = parseStoragePublicUrl(sourceUrl);
    if (!parsed) return rewriteCloudStorageUrl(sourceUrl, supabase.supabaseUrl);
    try {
      const { buffer, contentType } = await downloadBytes(sourceUrl);
      return uploadToStorage(supabase, parsed.bucket, parsed.path, { buffer, contentType });
    } catch {
      return rewriteCloudStorageUrl(sourceUrl, supabase.supabaseUrl);
    }
  }
  if (!isExternalMediaUrl(sourceUrl)) return sourceUrl;

  const { buffer, contentType } = await downloadBytes(sourceUrl);
  const path = `${slug}/${slug}-cover.jpg`;
  return uploadToStorage(supabase, 'experiences', path, {
    buffer,
    contentType: contentType.includes('image') ? contentType : 'image/jpeg',
  });
}
