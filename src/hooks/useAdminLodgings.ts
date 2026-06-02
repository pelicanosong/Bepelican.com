import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { QueryEnabledOptions } from '@/lib/queryClient';

export interface AdminLodging {
  id: string;
  name: string;
  slug: string;
  lodging_type: string;
  categories: string[];
  city: string;
  address: string | null;
  department: string | null;
  short_description: string | null;
  long_description: string | null;
  main_image_url: string | null;
  gallery_images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminRoomType {
  id: string;
  lodging_id: string;
  name: string;
  short_description: string | null;
  capacity: number;
  base_price: number;
  units_available: number;
  main_image_url: string | null;
  gallery_images: string[];
  is_active: boolean;
  created_at: string;
}

export const useAdminLodgings = (options?: QueryEnabledOptions) => {
  return useQuery({
    queryKey: ['admin-lodgings'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lodgings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AdminLodging[];
    },
  });
};

export const useLodgingRoomTypes = (lodgingId?: string) => {
  return useQuery({
    queryKey: ['lodging-room-types', lodgingId],
    queryFn: async () => {
      if (!lodgingId) return [];
      const { data, error } = await supabase
        .from('lodging_room_types')
        .select('*')
        .eq('lodging_id', lodgingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AdminRoomType[];
    },
    enabled: !!lodgingId,
  });
};

export const useCreateLodging = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: result, error } = await supabase
        .from('lodgings')
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lodgings'] });
      toast({ title: "Hospedaje creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al crear hospedaje", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateLodging = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase
        .from('lodgings')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lodgings'] });
      toast({ title: "Hospedaje actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteLodging = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lodgings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lodgings'] });
      toast({ title: "Hospedaje eliminado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    },
  });
};

export const useSyncRoomTypes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lodgingId, roomTypes }: { lodgingId: string; roomTypes: Omit<AdminRoomType, 'id' | 'lodging_id' | 'created_at'>[] }) => {
      // Delete existing room types
      await supabase.from('lodging_room_types').delete().eq('lodging_id', lodgingId);

      if (roomTypes.length > 0) {
        const rows = roomTypes.map(rt => ({
          lodging_id: lodgingId,
          name: rt.name,
          short_description: rt.short_description || null,
          capacity: rt.capacity,
          base_price: rt.base_price,
          units_available: rt.units_available ?? 1,
          main_image_url: rt.main_image_url || null,
          gallery_images: rt.gallery_images || [],
          is_active: rt.is_active,
        }));
        const { error } = await supabase.from('lodging_room_types').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-room-types'] });
    },
  });
};
