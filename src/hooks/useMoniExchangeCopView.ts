import { useQuery } from '@tanstack/react-query';
import { moniExchange, type MoniDailyRateCop } from '@/integrations/supabase/moni-client';

export type MoniCopRatesSnapshot = {
  rateDate: string;
  rates: MoniDailyRateCop[];
  /** COP por 1 USD (`cop_per_unit` de la fila USD). */
  copUsdRate: number | null;
};

export function useMoniExchangeCopView() {
  return useQuery({
    queryKey: ['moni-exchange', 'daily_rates_cop'],
    queryFn: async (): Promise<MoniCopRatesSnapshot | null> => {
      const { data, error } = await moniExchange
        .from('daily_rates_cop')
        .select('*')
        .order('rate_date', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as MoniDailyRateCop[];
      if (!rows.length) return null;

      const rateDate = rows[0].rate_date;
      const rates = rows.filter((r) => r.rate_date === rateDate);
      const usdRow = rates.find((r) => r.quote_currency === 'USD');

      return {
        rateDate,
        rates,
        copUsdRate: usdRow?.cop_per_unit ?? null,
      };
    },
    staleTime: 1000 * 60 * 60,
  });
}
