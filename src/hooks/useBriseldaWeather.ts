import { useQuery } from '@tanstack/react-query';
import { briseldaDb, type BriseldaDestinationWeather } from '@/integrations/supabase/briselda-client';
import type { BriseldaDestino } from '@/lib/briseldaDestino';

export function useBriseldaWeather(destino: BriseldaDestino | null | undefined) {
  return useQuery({
    queryKey: ['briselda-weather', destino],
    enabled: !!destino,
    queryFn: async (): Promise<BriseldaDestinationWeather | null> => {
      const { data, error } = await briseldaDb
        .from('latest_destination_weather')
        .select('*')
        .eq('ciudad', destino!)
        .maybeSingle();
      if (error) throw error;
      return (data as BriseldaDestinationWeather | null) ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });
}
