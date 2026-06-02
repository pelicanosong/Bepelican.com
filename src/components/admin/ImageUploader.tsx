import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  label: string;
  currentImage?: string | null;
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => Promise<void>;
  isUploading?: boolean;
  accept?: string;
  className?: string;
}

export function ImageUploader({
  label,
  currentImage,
  onUpload,
  onRemove,
  isUploading = false,
  accept = 'image/jpeg,image/png,image/webp',
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const uploadedUrl = await onUpload(file);
    
    // Clean up local preview
    URL.revokeObjectURL(localPreview);
    setPreviewUrl(null);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      await onRemove();
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : displayImage ? (
            <>
              <img
                src={displayImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={handleRemove}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {currentImage ? 'Cambiar' : 'Subir'}
          </Button>
          {currentImage && (
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              Imagen cargada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
