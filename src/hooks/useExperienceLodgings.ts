import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExperienceLodgingLink {
  id: string;
  experience_id: string;
  lodging_id: string;
  room_type_id: string | null;
  is_default_option: boolean;
  is_active: boolean;
  created_at: string;
}

export const useExperienceLodgings = (experienceId?: string) => {
  return useQuery({
    queryKey: ['experience-lodgings', experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from('experience_lodgings')
        .select('*')
        .eq('experience_id', experienceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ExperienceLodgingLink[];
    },
    enabled: !!experienceId,
  });
};

export const useSyncExperienceLodgings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      experienceId,
      links,
    }: {
      experienceId: string;
      links: Omit<ExperienceLodgingLink, 'id' | 'experience_id' | 'created_at'>[];
    }) => {
      // Delete existing
      await supabase
        .from('experience_lodgings')
        .delete()
        .eq('experience_id', experienceId);

      if (links.length > 0) {
        const rows = links.map((l) => ({
          experience_id: experienceId,
          lodging_id: l.lodging_id,
          room_type_id: l.room_type_id || null,
          is_default_option: l.is_default_option,
          is_active: l.is_active,
        }));
        const { error } = await supabase
          .from('experience_lodgings')
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-lodgings'] });
    },
  });
};
