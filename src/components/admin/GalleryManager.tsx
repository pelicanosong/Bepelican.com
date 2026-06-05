import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Star, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/hooks/useExperienceImages';

interface GalleryManagerProps {
  images: GalleryImage[];
  onImagesChange: (images: GalleryImage[]) => void;
  onSetAsCover: (imageUrl: string) => void;
  onUploadImage: (file: File, index: number) => Promise<string | null>;
  onDeleteImage: (index: number) => Promise<boolean>;
  isUploading: boolean;
  maxImages?: number;
}

export function GalleryManager({
  images,
  onImagesChange,
  onSetAsCover,
  onUploadImage,
  onDeleteImage,
  isUploading,
  maxImages = 10,
}: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [uploadingCount, setUploadingCount] = useState<number>(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = images.length;
    const remainingSlots = maxImages - currentCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setUploadingCount(filesToUpload.length);

    // Create upload promises for all files concurrently
    const uploadPromises = filesToUpload.map(async (file, i) => {
      const newIndex = currentCount + i + 1;
      const url = await onUploadImage(file, newIndex);
      if (url) {
        return {
          url,
          alt: '',
          index: newIndex,
        } as GalleryImage;
      }
      return null;
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Filter out failed uploads and add successful ones
    const newImages = results.filter((img): img is GalleryImage => img !== null);
    
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    setUploadingCount(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (index: number) => {
    const success = await onDeleteImage(index);
    if (success) {
      const updated = images.filter((img) => img.index !== index);
      onImagesChange(updated);
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = replacingIndex;
    if (!file || index === null) return;

    const url = await onUploadImage(file, index);
    if (url) {
      onImagesChange(
        images.map((img) => (img.index === index ? { ...img, url } : img))
      );
    }

    setReplacingIndex(null);
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  const startReplace = (index: number) => {
    setReplacingIndex(index);
    replaceInputRef.current?.click();
  };

  const handleAltChange = (index: number, alt: string) => {
    const updated = images.map((img) =>
      img.index === index ? { ...img, alt } : img
    );
    onImagesChange(updated);
  };

  const handleSetAsCover = (imageUrl: string) => {
    onSetAsCover(imageUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Galería de imágenes ({images.length}/{maxImages})</Label>
        {images.length < maxImages && (
          <>
            <Input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Agregar imágenes
            </Button>
          </>
        )}
      </div>

      {images.length === 0 && !isUploading && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay imágenes en la galería</p>
          <p className="text-sm">Haz clic en "Agregar imágenes" para comenzar</p>
        </div>
      )}

      <Input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleReplaceFile}
        disabled={isUploading}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image.index} className="overflow-hidden">
            <div className="relative aspect-square">
              <img
                key={image.url}
                src={image.url}
                alt={image.alt || `Imagen ${image.index}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => startReplace(image.index)}
                  disabled={isUploading}
                  title="Cambiar esta imagen"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleSetAsCover(image.url)}
                  title="Usar como portada"
                >
                  <Star className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDeleteImage(image.index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardContent className="p-2">
              <Input
                type="text"
                placeholder="Texto alternativo..."
                value={image.alt}
                onChange={(e) => handleAltChange(image.index, e.target.value)}
                className="text-xs h-8"
              />
            </CardContent>
          </Card>
        ))}

        {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, i) => (
          <Card key={`uploading-${i}`} className="overflow-hidden">
            <div className="aspect-square flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground text-center">Subiendo...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
