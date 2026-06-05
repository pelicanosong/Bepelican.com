import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  IMAGE_CACHE_CONTROL,
  IMAGE_CANONICAL_WIDTH,
  processImageForUpload,
  storagePathsForImageBase,
  type EncodedVariant,
} from '@/lib/imagePipeline';
import { purgeExperienceMediaAtUrl } from '@/lib/experienceStorage';
import { withCacheBust } from '@/lib/mediaUrl';

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

  const removePaths = async (paths: string[]) => {
    if (paths.length === 0) return;
    await supabase.storage.from('experiences').remove(paths);
  };

  const uploadBlob = async (path: string, blob: Blob, contentType: string) => {
    const { error } = await supabase.storage.from('experiences').upload(path, blob, {
      cacheControl: IMAGE_CACHE_CONTROL,
      upsert: true,
      contentType,
    });
    if (error) throw error;
  };

  const uploadVariants = async (basePath: string, variants: EncodedVariant[]) => {
    const tasks: Promise<void>[] = [];
    for (const variant of variants) {
      const suffix = variant.labelWidth;
      if (variant.webp.type === 'image/webp') {
        tasks.push(uploadBlob(`${basePath}-${suffix}.webp`, variant.webp, 'image/webp'));
      }
      tasks.push(uploadBlob(`${basePath}-${suffix}.jpg`, variant.jpeg, 'image/jpeg'));
    }
    await Promise.all(tasks);
  };

  const uploadCoverImage = async (
    file: File,
    previousUrl?: string | null
  ): Promise<string | null> => {
    if (!slug) return null;
    setIsUploading(true);

    try {
      if (previousUrl) await purgeExperienceMediaAtUrl(previousUrl);

      const basePath = `${slug}/${slug}-cover`;
      await removePaths(storagePathsForImageBase(basePath));

      const variants = await processImageForUpload(file);
      await uploadVariants(basePath, variants);

      const canonicalPath = `${basePath}-${IMAGE_CANONICAL_WIDTH}.webp`;
      return withCacheBust(getPublicUrl(canonicalPath));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al subir imagen',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadGalleryImage = async (
    file: File,
    index: number,
    previousUrl?: string | null
  ): Promise<string | null> => {
    if (!slug) return null;
    setIsUploading(true);

    try {
      if (previousUrl) await purgeExperienceMediaAtUrl(previousUrl);

      const basePath = `${slug}/gallery/${slug}-${index}`;
      await removePaths(storagePathsForImageBase(basePath));

      const variants = await processImageForUpload(file);
      await uploadVariants(basePath, variants);

      const canonicalPath = `${basePath}-${IMAGE_CANONICAL_WIDTH}.webp`;
      return withCacheBust(getPublicUrl(canonicalPath));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al subir imagen de galería',
        description: message,
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
      const basePath = `${slug}/gallery/${slug}-${index}`;
      const { error } = await supabase.storage
        .from('experiences')
        .remove(storagePathsForImageBase(basePath));
      if (error) throw error;
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al eliminar imagen',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCoverImage = async (currentCoverUrl?: string | null): Promise<boolean> => {
    if (!slug) return false;

    try {
      const basePath = `${slug}/${slug}-cover`;
      const { error } = await supabase.storage
        .from('experiences')
        .remove(storagePathsForImageBase(basePath));
      if (error) throw error;
      if (currentCoverUrl) await purgeExperienceMediaAtUrl(currentCoverUrl);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al eliminar portada',
        description: message,
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
