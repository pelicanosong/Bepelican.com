import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Experience = Tables<'experiences'>;
type Category = Tables<'categories_experience'>;

export interface ExperienceWithCategory extends Experience {
  category: Category | null;
  categories: Category[];
}

export interface ExperienceFilters {
  categorySlug?: string;
  search?: string;
  city?: string;
  minParticipants?: number;
}

export const useExperiences = (filters?: ExperienceFilters) => {
  return useQuery({
    queryKey: ['experiences', filters],
    queryFn: async () => {
      // Fetch sort mode from site_settings
      const { data: sortSetting } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'experience_sort_mode')
        .maybeSingle();
      const sortMode = sortSetting?.value || 'created_desc';

      // If filtering by category slug, get category id first
      let filterCategoryId: string | null = null;
      if (filters?.categorySlug) {
        const { data: category } = await supabase
          .from('categories_experience')
          .select('id')
          .eq('slug', filters.categorySlug)
          .maybeSingle();
        filterCategoryId = category?.id || null;
      }

      // If filtering by category, get experience IDs from junction table
      let experienceIds: string[] | null = null;
      if (filterCategoryId) {
        const { data: links } = await supabase
          .from('experience_categories')
          .select('experience_id')
          .eq('category_id', filterCategoryId);
        experienceIds = links?.map(l => l.experience_id) || [];
        if (experienceIds.length === 0) return [];
      }

      let query = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'activa');

      // Apply DB-level ordering based on sort mode
      if (sortMode === 'manual') {
        query = query.order('display_order', { ascending: true });
      } else if (sortMode === 'created_asc') {
        query = query.order('created_at', { ascending: true });
      } else if (sortMode === 'alpha_asc') {
        query = query.order('title', { ascending: true });
      } else if (sortMode === 'alpha_desc') {
        query = query.order('title', { ascending: false });
      } else {
        // created_desc and random both fetch newest first; random shuffles client-side
        query = query.order('created_at', { ascending: false });
      }

      // Filter by experience IDs (from category filter)
      if (experienceIds) {
        query = query.in('id', experienceIds);
      }

      // Filter by search term
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location_city.ilike.${searchTerm},location_name.ilike.${searchTerm}`);
      }

      // Filter by city
      if (filters?.city) {
        query = query.ilike('location_city', `%${filters.city}%`);
      }

      // Filter by minimum participants capacity
      if (filters?.minParticipants && filters.minParticipants > 0) {
        query = query.gte('max_participants', filters.minParticipants);
      }

      const { data: experiences, error } = await query;
      if (error) throw error;
      if (!experiences || experiences.length === 0) return [];

      // Fetch categories for all experiences via junction table
      const expIds = experiences.map(e => e.id);
      const { data: catLinks } = await supabase
        .from('experience_categories')
        .select('experience_id, category_id')
        .in('experience_id', expIds);

      // Fetch all unique category IDs
      const uniqueCatIds = [...new Set(catLinks?.map(l => l.category_id) || [])];
      let categoriesMap: Record<string, Category> = {};
      if (uniqueCatIds.length > 0) {
        const { data: cats } = await supabase
          .from('categories_experience')
          .select('*')
          .in('id', uniqueCatIds);
        cats?.forEach(c => { categoriesMap[c.id] = c; });
      }

      // Build experience -> categories mapping
      const expCategoriesMap: Record<string, Category[]> = {};
      catLinks?.forEach(link => {
        if (!expCategoriesMap[link.experience_id]) {
          expCategoriesMap[link.experience_id] = [];
        }
        const cat = categoriesMap[link.category_id];
        if (cat) expCategoriesMap[link.experience_id].push(cat);
      });

      const result = experiences.map(exp => ({
        ...exp,
        category: expCategoriesMap[exp.id]?.[0] || null,
        categories: expCategoriesMap[exp.id] || [],
      })) as ExperienceWithCategory[];

      // Shuffle for random mode
      if (sortMode === 'random') {
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
      }

      return result;
    }
  });
};

export const useExperience = (slug: string) => {
  return useQuery({
    queryKey: ['experience', slug],
    queryFn: async () => {
      const { data: exp, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'activa')
        .maybeSingle();

      if (error) throw error;
      if (!exp) return null;

      // Fetch categories via junction table
      const { data: catLinks } = await supabase
        .from('experience_categories')
        .select('category_id')
        .eq('experience_id', exp.id);

      const catIds = catLinks?.map(l => l.category_id) || [];
      let categories: Category[] = [];
      if (catIds.length > 0) {
        const { data: cats } = await supabase
          .from('categories_experience')
          .select('*')
          .in('id', catIds);
        categories = cats || [];
      }

      return {
        ...exp,
        category: categories[0] || null,
        categories,
      } as ExperienceWithCategory;
    },
    enabled: !!slug
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories_experience')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Category[];
    }
  });
};

// Hook to get unique destinations (cities) from experiences
export const useDestinations = () => {
  return useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('location_city, location_department')
        .eq('status', 'activa')
        .order('location_city');

      if (error) throw error;
      
      const uniqueDestinations = new Map<string, { city: string; department: string | null }>();
      
      data?.forEach((exp) => {
        if (exp.location_city && !uniqueDestinations.has(exp.location_city)) {
          uniqueDestinations.set(exp.location_city, {
            city: exp.location_city,
            department: exp.location_department
          });
        }
      });

      return Array.from(uniqueDestinations.values());
    }
  });
};
