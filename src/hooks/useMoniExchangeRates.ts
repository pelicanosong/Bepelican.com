import { useQuery } from '@tanstack/react-query';
import { moniExchange, type MoniDailyRate } from '@/integrations/supabase/moni-client';

export function useMoniExchangeRates() {
  return useQuery({
    queryKey: ['moni-exchange', 'latest'],
    queryFn: async (): Promise<MoniDailyRate[]> => {
      const { data, error } = await moniExchange.from('latest_daily_rates').select('*');
      if (error) throw error;
      return (data ?? []) as MoniDailyRate[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
