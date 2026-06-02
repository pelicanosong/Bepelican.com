import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FlipbookCategoryAdmin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number | null;
  created_at: string | null;
}

export interface FlipbookCategoryFormData {
  name: string;
  description?: string;
  icon?: string; // emoji or image URL
  color?: string;
  display_order?: number;
}

export const useAdminFlipbookCategories = () => {
  return useQuery({
    queryKey: ['admin-flipbook-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flipbook_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as FlipbookCategoryAdmin[];
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

export const useCreateFlipbookCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ formData, iconFile }: { formData: FlipbookCategoryFormData; iconFile?: File }) => {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let icon = formData.icon || 'book-open';

      if (iconFile) {
        const path = `category-icons/${Date.now()}-${sanitizeFileName(iconFile.name)}`;
        const { error } = await supabase.storage.from('flipbooks').upload(path, iconFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('flipbooks').getPublicUrl(path);
        icon = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('flipbook_categories')
        .insert({
          name: formData.name,
          slug,
          description: formData.description || null,
          icon,
          color: formData.color || '#08949B',
          display_order: formData.display_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flipbook-categories'] });
      queryClient.invalidateQueries({ queryKey: ['flipbook-categories'] });
      toast({ title: 'Categoría creada', description: 'La categoría se ha creado exitosamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo crear la categoría.', variant: 'destructive' });
    },
  });
};

export const useUpdateFlipbookCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formData, iconFile }: { id: string; formData: FlipbookCategoryFormData; iconFile?: File }) => {
      const updates: any = {
        name: formData.name,
        description: formData.description || null,
        color: formData.color || '#08949B',
        display_order: formData.display_order ?? 0,
      };

      if (iconFile) {
        const path = `category-icons/${Date.now()}-${sanitizeFileName(iconFile.name)}`;
        const { error } = await supabase.storage.from('flipbooks').upload(path, iconFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('flipbooks').getPublicUrl(path);
        updates.icon = urlData.publicUrl;
      } else if (formData.icon !== undefined) {
        updates.icon = formData.icon;
      }

      // Update slug from name
      updates.slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('flipbook_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flipbook-categories'] });
      queryClient.invalidateQueries({ queryKey: ['flipbook-categories'] });
      toast({ title: 'Categoría actualizada', description: 'La categoría se ha actualizado exitosamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar la categoría.', variant: 'destructive' });
    },
  });
};

export const useDeleteFlipbookCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete relations first
      await supabase.from('flipbook_category_relations').delete().eq('category_id', id);
      const { error } = await supabase.from('flipbook_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flipbook-categories'] });
      queryClient.invalidateQueries({ queryKey: ['flipbook-categories'] });
      toast({ title: 'Categoría eliminada', description: 'La categoría se ha eliminado exitosamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo eliminar la categoría.', variant: 'destructive' });
    },
  });
};
