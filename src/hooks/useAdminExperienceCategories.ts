import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExperienceCategoryAdmin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean | null;
  icon: string | null;
  color: string | null;
  display_order: number | null;
  created_at: string | null;
}

export interface ExperienceCategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
}

export const useAdminExperienceCategories = () => {
  return useQuery({
    queryKey: ['admin-experience-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories_experience')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as unknown as ExperienceCategoryAdmin[];
    },
  });
};

const sanitizeFileName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/(^_|_$)/g, '');
};

export const useCreateExperienceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ formData, iconFile }: { formData: ExperienceCategoryFormData; iconFile?: File }) => {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let icon = formData.icon || '📖';

      if (iconFile) {
        const path = `category-icons/${Date.now()}-${sanitizeFileName(iconFile.name)}`;
        const { error } = await supabase.storage.from('experiences').upload(path, iconFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('experiences').getPublicUrl(path);
        icon = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('categories_experience')
        .insert({
          name: formData.name,
          slug,
          description: formData.description || null,
          icon,
          color: formData.color || '#08949B',
          display_order: formData.display_order ?? 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experience-categories'] });
      queryClient.invalidateQueries({ queryKey: ['experience-categories'] });
      toast({ title: 'Categoría creada', description: 'La categoría se ha creado exitosamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo crear la categoría.', variant: 'destructive' });
    },
  });
};

export const useUpdateExperienceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formData, iconFile }: { id: string; formData: ExperienceCategoryFormData; iconFile?: File }) => {
      const updates: any = {
        name: formData.name,
        description: formData.description || null,
        color: formData.color || '#08949B',
        display_order: formData.display_order ?? 0,
      };

      if (iconFile) {
        const path = `category-icons/${Date.now()}-${sanitizeFileName(iconFile.name)}`;
        const { error } = await supabase.storage.from('experiences').upload(path, iconFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('experiences').getPublicUrl(path);
        updates.icon = urlData.publicUrl;
      } else if (formData.icon !== undefined) {
        updates.icon = formData.icon;
      }

      updates.slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('categories_experience')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experience-categories'] });
      queryClient.invalidateQueries({ queryKey: ['experience-categories'] });
      toast({ title: 'Categoría actualizada', description: 'La categoría se ha actualizado exitosamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar la categoría.', variant: 'destructive' });
    },
  });
};

export const useDeleteExperienceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete relations first
      await supabase.from('experience_categories').delete().eq('category_id', id);
      const { error } = await supabase.from('categories_experience').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experience-categories'] });
      queryClient.invalidateQueries({ queryKey: ['experience-categories'] });
      toast({ title: 'Categoría eliminada', description: 'La categoría se ha eliminado exitosamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo eliminar la categoría.', variant: 'destructive' });
    },
  });
};
