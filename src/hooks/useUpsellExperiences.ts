import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpsellExperience {
  id: string;
  title: string;
  slug: string;
  price: number;
  duration_minutes: number;
  cover_image: string | null;
  location_city: string;
  location_name: string;
  short_description: string | null;
}

interface UseUpsellExperiencesParams {
  currentExperienceId: string;
  destinationCity: string;
  currentPrice: number;
  maxResults?: number;
}

/**
 * Hook to fetch upsell experiences based on:
 * 1. Same destination (location_city)
 * 2. Shorter duration and lower price than current experience
 * 3. Sorted by upsell_priority
 */
export const useUpsellExperiences = ({
  currentExperienceId,
  destinationCity,
  currentPrice,
  maxResults = 3
}: UseUpsellExperiencesParams) => {
  return useQuery({
    queryKey: ['upsell-experiences', currentExperienceId, destinationCity],
    queryFn: async () => {
      const { data: experiences, error } = await supabase
        .from('experiences')
        .select(`
          id,
          title,
          slug,
          price,
          duration_minutes,
          cover_image,
          location_city,
          location_name,
          short_description,
          upsell_priority
        `)
        .eq('status', 'activa')
        .neq('id', currentExperienceId)
        .eq('location_city', destinationCity)
        .lte('price', currentPrice)
        .order('upsell_priority', { ascending: false, nullsFirst: false })
        .order('duration_minutes', { ascending: true })
        .order('price', { ascending: true })
        .limit(maxResults);

      if (error) {
        console.error('Error fetching upsell experiences:', error);
        return [];
      }

      return (experiences || []) as UpsellExperience[];
    },
    enabled: !!currentExperienceId && !!destinationCity
  });
};

/**
 * Hook to fetch upsell experiences for post-purchase based on order
 */
export const usePostPurchaseUpsell = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['post-purchase-upsell', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          experience_id,
          experiences (
            id,
            location_city,
            price
          )
        `)
        .eq('order_id', orderId);

      if (orderError || !orderItems || orderItems.length === 0) {
        return [];
      }

      const experiences = orderItems
        .map(item => item.experiences)
        .filter(Boolean) as Array<{
          id: string;
          location_city: string;
          price: number;
        }>;
      
      if (experiences.length === 0) return [];

      const primaryExperience = experiences.reduce((max, exp) => 
        exp.price > max.price ? exp : max
      , experiences[0]);

      const purchasedIds = experiences.map(exp => exp.id);

      const { data: upsellExperiences, error } = await supabase
        .from('experiences')
        .select(`
          id,
          title,
          slug,
          price,
          duration_minutes,
          cover_image,
          location_city,
          location_name,
          short_description,
          upsell_priority
        `)
        .eq('status', 'activa')
        .not('id', 'in', `(${purchasedIds.join(',')})`)
        .eq('location_city', primaryExperience.location_city)
        .order('upsell_priority', { ascending: false, nullsFirst: false })
        .order('price', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error fetching post-purchase upsell:', error);
        return [];
      }

      return (upsellExperiences || []) as UpsellExperience[];
    },
    enabled: !!orderId
  });
};
