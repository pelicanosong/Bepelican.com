import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GalleryImage {
  url: string;
  alt: string;
  index: number;
}

export const useLodgingImages = (slug: string) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('lodgings').getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    if (!slug) return null;
    setIsUploading(true);
    try {
      const filePath = `${slug}/${slug}-cover.jpg`;
      await supabase.storage.from('lodgings').remove([filePath]);
      const { error } = await supabase.storage.from('lodgings').upload(filePath, file, {
        cacheControl: '3600', upsert: true, contentType: 'image/jpeg',
      });
      if (error) throw error;
      return getPublicUrl(filePath);
    } catch (error: any) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
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
      await supabase.storage.from('lodgings').remove([filePath]);
      const { error } = await supabase.storage.from('lodgings').upload(filePath, file, {
        cacheControl: '3600', upsert: true, contentType: 'image/jpeg',
      });
      if (error) throw error;
      return getPublicUrl(filePath);
    } catch (error: any) {
      toast({ title: 'Error al subir imagen de galería', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteGalleryImage = async (index: number): Promise<boolean> => {
    if (!slug) return false;
    try {
      const filePath = `${slug}/gallery/${slug}-${index}.jpg`;
      const { error } = await supabase.storage.from('lodgings').remove([filePath]);
      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({ title: 'Error al eliminar imagen', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteCoverImage = async (): Promise<boolean> => {
    if (!slug) return false;
    try {
      const filePath = `${slug}/${slug}-cover.jpg`;
      const { error } = await supabase.storage.from('lodgings').remove([filePath]);
      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({ title: 'Error al eliminar portada', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const uploadRoomCoverImage = async (roomSlug: string, file: File): Promise<string | null> => {
    if (!slug || !roomSlug) return null;
    setIsUploading(true);
    try {
      const filePath = `${slug}/rooms/${roomSlug}-cover.jpg`;
      await supabase.storage.from('lodgings').remove([filePath]);
      const { error } = await supabase.storage.from('lodgings').upload(filePath, file, {
        cacheControl: '3600', upsert: true, contentType: 'image/jpeg',
      });
      if (error) throw error;
      return getPublicUrl(filePath);
    } catch (error: any) {
      toast({ title: 'Error al subir imagen de habitación', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadRoomGalleryImage = async (roomSlug: string, file: File, index: number): Promise<string | null> => {
    if (!slug || !roomSlug) return null;
    setIsUploading(true);
    try {
      const filePath = `${slug}/rooms/${roomSlug}-gallery/${roomSlug}-${index}.jpg`;
      await supabase.storage.from('lodgings').remove([filePath]);
      const { error } = await supabase.storage.from('lodgings').upload(filePath, file, {
        cacheControl: '3600', upsert: true, contentType: 'image/jpeg',
      });
      if (error) throw error;
      return getPublicUrl(filePath);
    } catch (error: any) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadCoverImage, deleteCoverImage,
    uploadGalleryImage, deleteGalleryImage,
    uploadRoomCoverImage, uploadRoomGalleryImage,
    getPublicUrl,
  };
};
