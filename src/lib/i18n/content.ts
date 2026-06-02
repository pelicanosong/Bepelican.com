/**
 * Resuelve un campo de contenido según idioma.
 * Fuente (es): tablas principales. Otros idiomas: content_translations en Supabase.
 */

export type ContentTranslationRow = {
  entity_type: string;
  entity_id: string;
  field_key: string;
  locale: string;
  value: string;
  value_format: 'plain' | 'json';
};

export type LocaleCode = string;

export function buildTranslationIndex(rows: ContentTranslationRow[]) {
  const map = new Map<string, ContentTranslationRow>();
  for (const row of rows) {
    map.set(`${row.entity_id}:${row.field_key}`, row);
  }
  return map;
}

export function resolveContentField<T = string>(
  source: Record<string, unknown>,
  fieldKey: string,
  locale: LocaleCode,
  index: Map<string, ContentTranslationRow>,
  entityId: string,
  sourceLocale = 'es'
): T | null {
  const raw = source[fieldKey];
  if (locale === sourceLocale) {
    return (raw as T) ?? null;
  }

  const tr = index.get(`${entityId}:${fieldKey}`);
  if (!tr?.value) {
    return (raw as T) ?? null;
  }

  if (tr.value_format === 'json') {
    try {
      return JSON.parse(tr.value) as T;
    } catch {
      return tr.value as T;
    }
  }

  return tr.value as T;
}

/** Aplica traducciones a un registro (ej. experiencia) para el locale activo */
export function localizeRecord<T extends Record<string, unknown>>(
  record: T,
  entityId: string,
  locale: LocaleCode,
  translations: ContentTranslationRow[],
  fields: string[],
  sourceLocale = 'es'
): T {
  if (locale === sourceLocale) return record;

  const index = buildTranslationIndex(translations);
  const out = { ...record };

  for (const field of fields) {
    const val = resolveContentField(out, field, locale, index, entityId, sourceLocale);
    if (val !== null && val !== undefined) {
      (out as Record<string, unknown>)[field] = val;
    }
  }

  return out;
}

export const EXPERIENCE_I18N_FIELDS = [
  'title',
  'short_description',
  'description',
  'includes',
  'not_includes',
  'requirements',
] as const;

export const CATEGORY_I18N_FIELDS = ['name'] as const;
