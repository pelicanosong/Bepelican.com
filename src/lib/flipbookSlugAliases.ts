/**
 * URLs alternativas (/libreria/...) que muestran el mismo flipbook que el slug canónico en Supabase.
 * Clave = slug en la URL; valor = slug en la base de datos.
 */
export const FLIPBOOK_SLUG_ALIASES: Record<string, string> = {
  'huellas-boyaca-territorio-de-cocteles-sagrados': 'boyaca-tierra-de-cocteles-sagrados',
};

export function resolveFlipbookSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return FLIPBOOK_SLUG_ALIASES[normalized] ?? normalized;
}

export function isFlipbookSlugAlias(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return normalized in FLIPBOOK_SLUG_ALIASES;
}

export type FlipbookLibraryBasePath = '/biblioteca' | '/libreria';

export function getFlipbookLibraryBasePath(pathname: string): FlipbookLibraryBasePath {
  return pathname.startsWith('/libreria') ? '/libreria' : '/biblioteca';
}
