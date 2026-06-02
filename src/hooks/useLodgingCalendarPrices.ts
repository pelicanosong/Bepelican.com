import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface CalendarPrice {
  season: string;
  pricingMode: string;
  pricePerNight: number;
}

/**
 * Hook que llama al RPC get_lodging_calendar_prices para obtener precios
 * dinámicos por noche según temporada, tipo de habitación y número de huéspedes.
 * Se re-ejecuta al cambiar: mes visible, lodging, room_type, guests.
 */
export const useLodgingCalendarPrices = (
  lodgingId?: string | null,
  roomTypeId?: string | null,
  currentMonth?: Date,
  guests: number = 1
) => {
  const month = currentMonth || new Date();
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['lodging-calendar-prices', lodgingId, roomTypeId, startDate, endDate, guests],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_lodging_calendar_prices', {
        _lodging_id: lodgingId!,
        _room_type_id: roomTypeId!,
        _start_date: startDate,
        _end_date: endDate,
        _guests: guests,
      });
      if (error) throw error;

      // Convierte el resultado en un Map para búsqueda rápida por fecha
      const priceMap = new Map<string, CalendarPrice>();
      (data || []).forEach((row: any) => {
        priceMap.set(row.calendar_date, {
          season: row.season_name,
          pricingMode: row.pricing_mode,
          pricePerNight: Number(row.price_per_night),
        });
      });
      return priceMap;
    },
    enabled: !!lodgingId && !!roomTypeId,
  });
};
