import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.DEV && typeof window !== 'undefined'
    ? window.location.origin
    : import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Cliente Supabase para esquema moni_exchange (tasas diarias). */
export const moniExchange = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'moni_exchange' },
});

export type MoniDailyRate = {
  id: string;
  rate_date: string;
  base_currency: string;
  quote_currency: string;
  par: string;
  c: number;
  h: number;
  rate: number;
  source: string;
  provider: string;
  fetched_at: string;
  created_at: string;
  updated_at: string;
};

/** Fila de `moni_exchange.daily_rates_cop` (COP por 1 unidad de divisa en `cop_per_unit`). */
export type MoniDailyRateCop = {
  rate_date: string;
  quote_currency: string;
  par: string;
  rate_vs_usd: number;
  cop_usd_rate: number;
  cop_per_unit: number;
  units_per_cop: number;
};
