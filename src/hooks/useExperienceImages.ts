import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GalleryImage {
  url: string;
  alt: string;
  index: number;
}

export const useExperienceImages = (slug: string) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('experiences').getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    if (!slug) return null;
    setIsUploading(true);

    try {
      const filePath = `${slug}/${slug}-cover.jpg`;
      
      // Delete existing cover if present
      await supabase.storage.from('experiences').remove([filePath]);

      // Upload new cover
      const { error } = await supabase.storage
        .from('experiences')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      return getPublicUrl(filePath);
    } catch (error: any) {
      toast({
        title: 'Error al subir imagen',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadGalleryImage = async (file: File, index: number): Promise<string | null> => {
    if (!slug) return null;
    setIsUploading(true);

    try {
      const filePath = `${slug}/gallery/${slug}-${index}.jpg`;

      // Delete existing file at this index if present
      await supabase.storage.from('experiences').remove([filePath]);

      // Upload new image
      const { error } = await supabase.storage
        .from('experiences')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      return getPublicUrl(filePath);
    } catch (error: any) {
      toast({
        title: 'Error al subir imagen de galería',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteGalleryImage = async (index: number): Promise<boolean> => {
    if (!slug) return false;

    try {
      const filePath = `${slug}/gallery/${slug}-${index}.jpg`;
      const { error } = await supabase.storage.from('experiences').remove([filePath]);
      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: 'Error al eliminar imagen',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCoverImage = async (): Promise<boolean> => {
    if (!slug) return false;

    try {
      const filePath = `${slug}/${slug}-cover.jpg`;
      const { error } = await supabase.storage.from('experiences').remove([filePath]);
      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: 'Error al eliminar portada',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    isUploading,
    uploadCoverImage,
    uploadGalleryImage,
    deleteGalleryImage,
    deleteCoverImage,
    getPublicUrl,
  };
};
