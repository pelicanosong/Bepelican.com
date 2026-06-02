import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LodgingSeason {
  id: string;
  lodging_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface RoomSeasonRate {
  id: string;
  room_type_id: string;
  season_id: string;
  pricing_mode: 'per_room' | 'per_person';
  price: number;
  created_at: string;
}

export const useLodgingSeasons = (lodgingId?: string) => {
  return useQuery({
    queryKey: ['lodging-seasons', lodgingId],
    queryFn: async () => {
      if (!lodgingId) return [];
      const { data, error } = await supabase
        .from('lodging_seasons')
        .select('*')
        .eq('lodging_id', lodgingId)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data as LodgingSeason[];
    },
    enabled: !!lodgingId,
  });
};

export const useRoomSeasonRates = (lodgingId?: string) => {
  return useQuery({
    queryKey: ['room-season-rates', lodgingId],
    queryFn: async () => {
      if (!lodgingId) return [];
      // Get all seasons for this lodging, then get rates for those seasons
      const { data: seasons, error: sError } = await supabase
        .from('lodging_seasons')
        .select('id')
        .eq('lodging_id', lodgingId);
      if (sError) throw sError;
      if (!seasons?.length) return [];

      const seasonIds = seasons.map(s => s.id);
      const { data, error } = await supabase
        .from('room_season_rates')
        .select('*')
        .in('season_id', seasonIds);
      if (error) throw error;
      return data as RoomSeasonRate[];
    },
    enabled: !!lodgingId,
  });
};

export const useSyncLodgingSeasons = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      lodgingId,
      seasons,
      rates,
    }: {
      lodgingId: string;
      seasons: Omit<LodgingSeason, 'id' | 'lodging_id' | 'created_at'>[];
      rates: { seasonIndex: number; room_type_id: string; pricing_mode: 'per_room' | 'per_person'; price: number }[];
    }) => {
      // Delete existing seasons (cascades to rates)
      await supabase.from('lodging_seasons').delete().eq('lodging_id', lodgingId);

      if (seasons.length === 0) return;

      // Insert seasons
      const seasonRows = seasons.map(s => ({
        lodging_id: lodgingId,
        name: s.name,
        start_date: s.start_date,
        end_date: s.end_date,
      }));
      const { data: insertedSeasons, error: sErr } = await supabase
        .from('lodging_seasons')
        .insert(seasonRows as any)
        .select();
      if (sErr) throw sErr;

      // Insert rates mapping seasonIndex to actual season ids
      if (rates.length > 0 && insertedSeasons) {
        const rateRows = rates
          .filter(r => r.price > 0 && r.seasonIndex < insertedSeasons.length)
          .map(r => ({
            season_id: insertedSeasons[r.seasonIndex].id,
            room_type_id: r.room_type_id,
            pricing_mode: r.pricing_mode,
            price: r.price,
          }));
        if (rateRows.length > 0) {
          const { error: rErr } = await supabase
            .from('room_season_rates')
            .insert(rateRows as any);
          if (rErr) throw rErr;
        }
      }
    },
    onSuccess: (_, { lodgingId }) => {
      queryClient.invalidateQueries({ queryKey: ['lodging-seasons', lodgingId] });
      queryClient.invalidateQueries({ queryKey: ['room-season-rates', lodgingId] });
      toast({ title: 'Temporadas guardadas exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar temporadas', description: error.message, variant: 'destructive' });
    },
  });
};
