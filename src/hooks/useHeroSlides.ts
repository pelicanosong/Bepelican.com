import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withResolvedMedia } from '@/lib/mediaUrl';

export interface HeroSlide {
  id: string;
  image_url: string;
  badge: string | null;
  title: string;
  highlight: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export const useHeroSlides = () => {
  return useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []).map((s) => withResolvedMedia(s)) as HeroSlide[];
    },
  });
};

export const useAdminHeroSlides = () => {
  return useQuery({
    queryKey: ['admin-hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as HeroSlide[];
    },
  });
};

export const useHeroSlideMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `slides/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('hero-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });
    if (error) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data } = supabase.storage.from('hero-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const createSlide = useMutation({
    mutationFn: async (slide: Omit<HeroSlide, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hero_slides').insert(slide);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Slide creado exitosamente' });
    },
    onError: (err: any) => {
      toast({ title: 'Error al crear slide', description: err.message, variant: 'destructive' });
    },
  });

  const updateSlide = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HeroSlide> & { id: string }) => {
      const { error } = await supabase.from('hero_slides').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Slide actualizado' });
    },
    onError: (err: any) => {
      toast({ title: 'Error al actualizar', description: err.message, variant: 'destructive' });
    },
  });

  const deleteSlide = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Slide eliminado' });
    },
    onError: (err: any) => {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    },
  });

  return { uploadImage, createSlide, updateSlide, deleteSlide };
};
