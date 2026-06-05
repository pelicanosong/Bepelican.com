import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.DEV && typeof window !== 'undefined'
    ? window.location.origin
    : import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Cliente Supabase para esquema briselda (clima en vivo). */
export const briseldaDb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'briselda' },
});

export type BriseldaDestinationWeather = {
  id: string;
  ciudad: string;
  temperatura: number;
  sensacion_termica: number;
  humedad: number;
  descripcion: string;
  viento_kmh: number;
  presion: number | null;
  visibilidad_m: number | null;
  icono: string | null;
  condicion_id: number | null;
  lat: number | null;
  lon: number | null;
  nubes_pct: number | null;
  fetched_at: string;
  snapshot_hour: string;
  created_at: string;
  updated_at: string;
};
