import { useState, useRef } from 'react';
import { useAdminHeroSlides, useHeroSlideMutations, HeroSlide } from '@/hooks/useHeroSlides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, Loader2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeroSlidesManager() {
  const { data: slides, isLoading } = useAdminHeroSlides();
  const { uploadImage, createSlide, updateSlide, deleteSlide } = useHeroSlideMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);

  const handleEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este slide?')) {
      deleteSlide.mutate(id);
    }
  };

  const handleToggleActive = (slide: HeroSlide) => {
    updateSlide.mutate({ id: slide.id, is_active: !slide.is_active });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{slides?.length || 0} slides en el banner</p>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Slide
        </Button>
      </div>

      {(!slides || slides.length === 0) && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay slides en el banner</p>
          <p className="text-sm">Agrega slides para personalizar el banner del Home</p>
        </div>
      )}

      <div className="grid gap-4">
        {slides?.map((slide) => (
          <Card key={slide.id} className={cn(!slide.is_active && 'opacity-60')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden bg-muted">
                  {slide.image_url ? (
                    <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {slide.badge && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{slide.badge}</span>
                    )}
                    <span className="text-xs text-muted-foreground">Orden: {slide.display_order}</span>
                  </div>
                  <h3 className="font-medium text-foreground truncate">
                    {slide.title} <span className="text-primary">{slide.highlight}</span>
                  </h3>
                  {slide.description && (
                    <p className="text-sm text-muted-foreground truncate">{slide.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={slide.is_active}
                    onCheckedChange={() => handleToggleActive(slide)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(slide)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(slide.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SlideFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}
        slide={editing}
        onUploadImage={uploadImage}
        onSave={async (data) => {
          if (editing) {
            await updateSlide.mutateAsync({ id: editing.id, ...data });
          } else {
            await createSlide.mutateAsync(data as any);
          }
          setDialogOpen(false);
          setEditing(null);
        }}
        isSaving={createSlide.isPending || updateSlide.isPending}
      />
    </div>
  );
}

interface SlideFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: HeroSlide | null;
  onUploadImage: (file: File) => Promise<string | null>;
  onSave: (data: Partial<HeroSlide>) => Promise<void>;
  isSaving: boolean;
}

function SlideFormDialog({ open, onOpenChange, slide, onUploadImage, onSave, isSaving }: SlideFormDialogProps) {
  const [title, setTitle] = useState('');
  const [highlight, setHighlight] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTitle(slide?.title || '');
      setHighlight(slide?.highlight || '');
      setBadge(slide?.badge || '');
      setDescription(slide?.description || '');
      setImageUrl(slide?.image_url || '');
      setDisplayOrder(slide?.display_order || 0);
      setIsActive(slide?.is_active ?? true);
    }
    onOpenChange(open);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onUploadImage(file);
    if (url) setImageUrl(url);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title || !highlight || !imageUrl) return;
    await onSave({
      title,
      highlight,
      badge: badge || null,
      description: description || null,
      image_url: imageUrl,
      display_order: displayOrder,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{slide ? 'Editar Slide' : 'Nuevo Slide'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image */}
          <div className="space-y-2">
            <Label>Imagen del banner *</Label>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border">
              {uploading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <p className="text-sm">Sin imagen</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cada experiencia es una" />
            </div>
            <div className="space-y-2">
              <Label>Texto destacado *</Label>
              <Input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="historia viva" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Badge / Etiqueta</Label>
            <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="✨ Turismo de transformación" />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texto descriptivo del slide..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Activo</Label>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSaving || !title || !highlight || !imageUrl} className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {slide ? 'Guardar cambios' : 'Crear slide'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
