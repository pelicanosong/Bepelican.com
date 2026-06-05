/** Mensaje legible desde Error, PostgrestError u objetos de Supabase. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const o = error as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message) return o.message;
    if (typeof o.details === 'string' && o.details) return o.details;
    if (typeof o.hint === 'string' && o.hint) return o.hint;
    if (typeof o.code === 'string' && o.code) return o.code;
  }
  if (typeof error === 'string' && error) return error;
  return 'Error desconocido';
}
