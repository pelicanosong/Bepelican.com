import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContentTranslationRow } from '@/lib/i18n/content';

const SOURCE_LOCALE = 'es';

export function useContentTranslations(
  entityType: string,
  entityIds: string[],
  locale: string
) {
  return useQuery({
    queryKey: ['content-translations', entityType, entityIds.sort().join(','), locale],
    enabled: locale !== SOURCE_LOCALE && entityIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ContentTranslationRow[]> => {
      const { data, error } = await supabase
        .from('content_translations')
        .select('entity_type, entity_id, field_key, locale, value, value_format')
        .eq('entity_type', entityType)
        .eq('locale', locale)
        .in('entity_id', entityIds);

      if (error) throw error;
      return (data ?? []) as ContentTranslationRow[];
    },
  });
}

export function useActiveLocales() {
  return useQuery({
    queryKey: ['i18n-locales'],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('i18n_locales')
        .select('code, name, is_source, is_active, display_order')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data ?? [];
    },
  });
}
