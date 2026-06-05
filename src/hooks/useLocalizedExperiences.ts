import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useExperiences,
  useExperience,
  useCategories,
  type ExperienceFilters,
  type ExperienceWithCategory,
} from '@/hooks/useExperiences';
import { useContentTranslations } from '@/hooks/useContentTranslations';
import {
  localizeRecord,
  EXPERIENCE_I18N_FIELDS,
  CATEGORY_I18N_FIELDS,
  type ContentTranslationRow,
} from '@/lib/i18n/content';

const SOURCE_LOCALE = 'es';

function localizeCategories<T extends { id: string; name: string }>(
  categories: T[],
  locale: string,
  translations: ContentTranslationRow[]
): T[] {
  if (locale === SOURCE_LOCALE) return categories;
  return categories.map((cat) =>
    localizeRecord(cat, cat.id, locale, translations, [...CATEGORY_I18N_FIELDS])
  );
}

function localizeExperience(
  exp: ExperienceWithCategory,
  locale: string,
  expTranslations: ContentTranslationRow[],
  catTranslations: ContentTranslationRow[]
): ExperienceWithCategory {
  if (locale === SOURCE_LOCALE) return exp;

  const localized = localizeRecord(exp, exp.id, locale, expTranslations, [...EXPERIENCE_I18N_FIELDS]);
  const categories = localizeCategories(exp.categories, locale, catTranslations);
  return {
    ...localized,
    categories,
    category: categories[0] ?? null,
  };
}

export function useLocalizedExperiences(filters?: ExperienceFilters) {
  const { language } = useLanguage();
  const query = useExperiences(filters);

  const expIds = useMemo(() => query.data?.map((e) => e.id) ?? [], [query.data]);
  const catIds = useMemo(
    () => [...new Set(query.data?.flatMap((e) => e.categories.map((c) => c.id)) ?? [])],
    [query.data]
  );

  const { data: expTranslations, isLoading: expTrLoading } = useContentTranslations(
    'experience',
    expIds,
    language
  );
  const { data: catTranslations, isLoading: catTrLoading } = useContentTranslations(
    'category',
    catIds,
    language
  );

  const data = useMemo(() => {
    if (!query.data) return undefined;
    if (language === SOURCE_LOCALE) return query.data;
    if (!expTranslations) return query.data;
    return query.data.map((exp) =>
      localizeExperience(exp, language, expTranslations, catTranslations ?? [])
    );
  }, [query.data, language, expTranslations, catTranslations]);

  return {
    ...query,
    data,
    // No bloquear la ficha si i18n tarda o falla (evita pantalla en blanco / skeleton infinito)
    isLoading: query.isLoading,
  };
}

export function useLocalizedExperience(slug: string) {
  const { language } = useLanguage();
  const query = useExperience(slug);

  const expIds = useMemo(() => (query.data ? [query.data.id] : []), [query.data]);
  const catIds = useMemo(
    () => query.data?.categories.map((c) => c.id) ?? [],
    [query.data]
  );

  const { data: expTranslations, isLoading: expTrLoading } = useContentTranslations(
    'experience',
    expIds,
    language
  );
  const { data: catTranslations, isLoading: catTrLoading } = useContentTranslations(
    'category',
    catIds,
    language
  );

  const data = useMemo(() => {
    if (!query.data) return query.data;
    if (language === SOURCE_LOCALE) return query.data;
    if (!expTranslations) return query.data;
    return localizeExperience(query.data, language, expTranslations, catTranslations ?? []);
  }, [query.data, language, expTranslations, catTranslations]);

  return {
    ...query,
    data,
    isLoading: query.isLoading,
  };
}

export function useLocalizedCategories() {
  const { language } = useLanguage();
  const query = useCategories();

  const catIds = useMemo(() => query.data?.map((c) => c.id) ?? [], [query.data]);
  const { data: translations, isLoading: trLoading } = useContentTranslations(
    'category',
    catIds,
    language
  );

  const data = useMemo(() => {
    if (!query.data) return undefined;
    if (language === SOURCE_LOCALE) return query.data;
    if (!translations) return query.data;
    return localizeCategories(query.data, language, translations);
  }, [query.data, language, translations]);

  return {
    ...query,
    data,
    isLoading: query.isLoading || (language !== SOURCE_LOCALE && trLoading),
  };
}
