import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlockedDate {
  id: string;
  experience_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string | null;
}

export const useBlockedDates = (experienceId: string | undefined) => {
  return useQuery({
    queryKey: ['blocked-dates', experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from('experience_blocked_dates' as any)
        .select('*')
        .eq('experience_id', experienceId)
        .order('blocked_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as BlockedDate[];
    },
    enabled: !!experienceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAddBlockedDate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ experienceId, date, reason }: { experienceId: string; date: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('experience_blocked_dates' as any)
        .insert({ experience_id: experienceId, blocked_date: date, reason: reason || null } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates', vars.experienceId] });
      queryClient.invalidateQueries({ queryKey: ['experience-availability'] });
    },
  });
};

export const useRemoveBlockedDate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, experienceId }: { id: string; experienceId: string }) => {
      const { error } = await supabase
        .from('experience_blocked_dates' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates', vars.experienceId] });
      queryClient.invalidateQueries({ queryKey: ['experience-availability'] });
    },
  });
};
