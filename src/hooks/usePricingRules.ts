import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PricingRule {
  id: string;
  experience_id: string;
  rule_type: 'fixed' | 'per_person' | 'per_origin' | 'per_accommodation' | 'per_origin_accommodation';
  label: string;
  origin_label: string | null;
  min_pax: number | null;
  max_pax: number | null;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PricingRuleInsert {
  experience_id: string;
  rule_type: 'fixed' | 'per_person' | 'per_origin' | 'per_accommodation' | 'per_origin_accommodation';
  label: string;
  origin_label?: string | null;
  min_pax?: number | null;
  max_pax?: number | null;
  price: number;
  sort_order?: number;
  is_active?: boolean;
}

export const usePricingRules = (experienceId?: string) => {
  return useQuery({
    queryKey: ['pricing-rules', experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('experience_id', experienceId!)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as PricingRule[];
    },
    enabled: !!experienceId,
  });
};

export const useCreatePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: PricingRuleInsert) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert(rule as any)
        .select()
        .single();

      if (error) throw error;
      return data as PricingRule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules', variables.experience_id] });
    },
  });
};

export const useUpdatePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, experience_id, ...updates }: Partial<PricingRule> & { id: string; experience_id: string }) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PricingRule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules', variables.experience_id] });
    },
  });
};

export const useDeletePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, experience_id }: { id: string; experience_id: string }) => {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules', variables.experience_id] });
    },
  });
};
