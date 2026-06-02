import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlipbookCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
}

export interface Flipbook {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  pdf_url: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  categories?: FlipbookCategory[];
}

export interface FlipbookFilters {
  categorySlug?: string;
  search?: string;
  sortBy?: 'recent' | 'popular' | 'featured';
  featured?: boolean;
}

export const useFlipbooks = (filters?: FlipbookFilters) => {
  return useQuery({
    queryKey: ['flipbooks', filters],
    queryFn: async () => {
      let query = supabase
        .from('flipbooks')
        .select(`
          *,
          flipbook_category_relations(
            flipbook_categories(*)
          )
        `)
        .eq('status', 'published');

      // Filter by featured
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      // Search by title, description or tags
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      // Sort
      if (filters?.sortBy === 'popular') {
        query = query.order('view_count', { ascending: false });
      } else if (filters?.sortBy === 'featured') {
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include categories
      const flipbooks = data?.map((flipbook: any) => ({
        ...flipbook,
        categories: flipbook.flipbook_category_relations?.map(
          (rel: any) => rel.flipbook_categories
        ).filter(Boolean) || []
      })) as Flipbook[];

      // Filter by category if specified
      if (filters?.categorySlug) {
        return flipbooks.filter(fb => 
          fb.categories?.some(cat => cat.slug === filters.categorySlug)
        );
      }

      return flipbooks;
    }
  });
};

export const useFlipbook = (slug: string) => {
  return useQuery({
    queryKey: ['flipbook', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flipbooks')
        .select(`
          *,
          flipbook_category_relations(
            flipbook_categories(*)
          ),
          flipbook_experience_links(
            experiences(*)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        categories: data.flipbook_category_relations?.map(
          (rel: any) => rel.flipbook_categories
        ).filter(Boolean) || [],
        related_experiences: data.flipbook_experience_links?.map(
          (link: any) => link.experiences
        ).filter(Boolean) || []
      } as Flipbook & { related_experiences: any[] };
    },
    enabled: !!slug
  });
};

export const useFlipbookCategories = () => {
  return useQuery({
    queryKey: ['flipbook-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flipbook_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as FlipbookCategory[];
    }
  });
};

export const useIncrementViewCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flipbookId: string) => {
      const { data: current } = await supabase
        .from('flipbooks')
        .select('view_count')
        .eq('id', flipbookId)
        .single();

      const { error } = await supabase
        .from('flipbooks')
        .update({ view_count: (current?.view_count || 0) + 1 })
        .eq('id', flipbookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
    }
  });
};
