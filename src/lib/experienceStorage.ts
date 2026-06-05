import { supabase } from '@/integrations/supabase/client';
import { storagePathsForImageBase } from '@/lib/imagePipeline';
import { parseStoragePublicUrl } from '@/lib/mediaUrl';

/** Prefijo en Storage (sin extensión ni sufijo de ancho) a partir de la ruta del objeto. */
export function imageBasePathFromStorageObjectPath(objectPath: string): string | null {
  const clean = objectPath.split('?')[0];
  const pipeline = clean.match(/^(.+)-(400|800|1920)\.(webp|jpe?g)$/i);
  if (pipeline) return pipeline[1];
  const legacyCover = clean.match(/^(.+)-cover\.jpe?g$/i);
  if (legacyCover) return legacyCover[1];
  if (/\/gallery\//.test(clean)) {
    return clean.replace(/\.(jpe?g|webp)$/i, '');
  }
  return null;
}

/** Elimina variantes y legado asociados a una URL pública del bucket `experiences`. */
export async function purgeExperienceMediaAtUrl(url: string | null | undefined): Promise<void> {
  const parsed = parseStoragePublicUrl(url);
  if (!parsed || parsed.bucket !== 'experiences') return;
  const base = imageBasePathFromStorageObjectPath(parsed.path);
  if (!base) return;
  await supabase.storage.from('experiences').remove(storagePathsForImageBase(base));
}
