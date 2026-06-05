import { ImageUploader } from "../ImageUploader";
import { GalleryManager } from "../GalleryManager";
import type { GalleryImage } from "@/hooks/useExperienceImages";

interface Step7Props {
  coverImageUrl: string | null;
  galleryImages: GalleryImage[];
  isUploading: boolean;
  currentSlug: string;
  onCoverUpload: (file: File) => Promise<string | null>;
  onCoverRemove: () => Promise<void>;
  onGalleryUpload: (file: File, index: number) => Promise<string | null>;
  onGalleryDelete: (index: number) => Promise<boolean>;
  onGalleryImagesChange: (images: GalleryImage[]) => void;
  onSetAsCover: (imageUrl: string) => void;
}

export function Step7Multimedia({
  coverImageUrl,
  galleryImages,
  isUploading,
  currentSlug,
  onCoverUpload,
  onCoverRemove,
  onGalleryUpload,
  onGalleryDelete,
  onGalleryImagesChange,
  onSetAsCover,
}: Step7Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Multimedia</h3>
        <p className="text-sm text-muted-foreground">
          Sube las imágenes que los viajeros verán en la ficha de tu experiencia.
        </p>
      </div>

      {!currentSlug && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-sm text-warning">
          ⚠️ Ingresa un título en el Paso 1 para habilitar la subida de imágenes.
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Imagen de portada</h4>
        <p className="text-sm text-muted-foreground">
          La imagen principal que aparecerá en las tarjetas y al inicio de la ficha. Al subir,
          generamos automáticamente versiones optimizadas (WebP y JPEG en 400, 800 y 1920&nbsp;px).
          {currentSlug ? " Los cambios se guardan en la ficha al subir o cambiar imágenes." : ""}
        </p>
        <ImageUploader
          label="Portada"
          currentImage={coverImageUrl}
          onUpload={onCoverUpload}
          onRemove={onCoverRemove}
          isUploading={isUploading}
        />
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <h4 className="font-medium text-foreground">Galería de imágenes</h4>
        <p className="text-sm text-muted-foreground">
          Agrega hasta 10 imágenes para la galería. Puedes subir JPEG, PNG o WebP en alta calidad;
          el sistema comprime y crea las variantes para carga rápida en la web.
        </p>
        <GalleryManager
          images={galleryImages}
          onImagesChange={onGalleryImagesChange}
          onSetAsCover={onSetAsCover}
          onUploadImage={onGalleryUpload}
          onDeleteImage={onGalleryDelete}
          isUploading={isUploading}
          maxImages={10}
        />
      </div>
    </div>
  );
}
