import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { QueryEnabledOptions } from '@/lib/queryClient';
import { getErrorMessage } from '@/lib/errorMessage';

type Experience = Tables<'experiences'>;
type Category = Tables<'categories_experience'>;

export interface AdminExperienceWithCategory extends Experience {
  category: Category | null;
  categories: Category[];
}

// Hook to check if current user has admin role
export const useIsAdmin = (options?: QueryEnabledOptions) => {
  return useQuery({
    queryKey: ['isAdmin'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data === true;
    }
  });
};

// Hook to get ALL experiences for admin (not filtered by status)
export const useAdminExperiences = (options?: QueryEnabledOptions) => {
  return useQuery({
    queryKey: ['admin-experiences'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data: experiences, error } = await supabase
        .from('experiences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!experiences || experiences.length === 0) return [];

      // Fetch categories via junction table
      const expIds = experiences.map(e => e.id);
      const { data: catLinks } = await supabase
        .from('experience_categories')
        .select('experience_id, category_id')
        .in('experience_id', expIds);

      const uniqueCatIds = [...new Set(catLinks?.map(l => l.category_id) || [])];
      let categoriesMap: Record<string, Category> = {};
      if (uniqueCatIds.length > 0) {
        const { data: cats } = await supabase
          .from('categories_experience')
          .select('*')
          .in('id', uniqueCatIds);
        cats?.forEach(c => { categoriesMap[c.id] = c; });
      }

      const expCategoriesMap: Record<string, Category[]> = {};
      catLinks?.forEach(link => {
        if (!expCategoriesMap[link.experience_id]) {
          expCategoriesMap[link.experience_id] = [];
        }
        const cat = categoriesMap[link.category_id];
        if (cat) expCategoriesMap[link.experience_id].push(cat);
      });

      return experiences.map(exp => ({
        ...exp,
        category: expCategoriesMap[exp.id]?.[0] || null,
        categories: expCategoriesMap[exp.id] || [],
      })) as AdminExperienceWithCategory[];
    }
  });
};

// Hook to create a new experience
export const useCreateExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (experience: TablesInsert<'experiences'>) => {
      const { data, error } = await supabase
        .from('experiences')
        .insert(experience)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    }
  });
};

// Hook to update an experience
export const useUpdateExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'experiences'> & { id: string }) => {
      const { data, error } = await supabase
        .from('experiences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    }
  });
};

// Hook to delete an experience
export const useDeleteExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    }
  });
};

// Hook to sync experience categories (junction table)
export const useSyncExperienceCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ experienceId, categoryIds }: { experienceId: string; categoryIds: string[] }) => {
      // Delete existing
      const { error: delError } = await supabase
        .from('experience_categories')
        .delete()
        .eq('experience_id', experienceId);
      if (delError) {
        throw new Error(getErrorMessage(delError));
      }

      if (categoryIds.length > 0) {
        const rows = categoryIds.map((catId) => ({
          experience_id: experienceId,
          category_id: catId,
        }));
        const { error: insError } = await supabase
          .from('experience_categories')
          .insert(rows);
        if (insError) {
          throw new Error(getErrorMessage(insError));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    }
  });
};

// Hook to get admin dashboard stats
export const useAdminStats = (options?: QueryEnabledOptions) => {
  return useQuery({
    queryKey: ['admin-stats'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data: experiences, error: expError } = await supabase
        .from('experiences')
        .select('id, status, price, location_city');

      if (expError) throw expError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount');

      const { data: bookings, error: bookingsError } = await supabase
        .from('experience_bookings')
        .select('id, status');

      const totalExperiences = experiences?.length || 0;
      const activeExperiences = experiences?.filter(e => e.status === 'activa').length || 0;
      const draftExperiences = experiences?.filter(e => e.status === 'borrador').length || 0;
      
      const cities = new Set(experiences?.map(e => e.location_city));
      const totalCities = cities.size;

      const paidOrders = orders?.filter(o => o.status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      
      const statusDistribution = [
        { name: 'Activas', value: activeExperiences, fill: 'hsl(178, 89%, 32%)' },
        { name: 'Borrador', value: draftExperiences, fill: 'hsl(30, 95%, 54%)' },
        { name: 'Inactivas', value: totalExperiences - activeExperiences - draftExperiences, fill: 'hsl(210, 10%, 70%)' }
      ].filter(s => s.value > 0);

      return {
        totalExperiences,
        activeExperiences,
        draftExperiences,
        totalCities,
        totalOrders: orders?.length || 0,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalBookings: bookings?.length || 0,
        confirmedBookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
        statusDistribution
      };
    }
  });
};
