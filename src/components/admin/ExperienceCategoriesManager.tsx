import { useState, useRef } from 'react';
import {
  useAdminExperienceCategories,
  useCreateExperienceCategory,
  useUpdateExperienceCategory,
  useDeleteExperienceCategory,
  ExperienceCategoryAdmin,
} from '@/hooks/useAdminExperienceCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Upload, Smile, Image as ImageIcon, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const isImageUrl = (icon: string | null) =>
  !!icon && (icon.startsWith('http://') || icon.startsWith('https://'));

type IconMode = 'emoji' | 'image';

interface CategoryFormState {
  name: string;
  description: string;
  color: string;
  display_order: number;
  icon: string;
  iconMode: IconMode;
}

const defaultForm: CategoryFormState = {
  name: '',
  description: '',
  color: '#08949B',
  display_order: 0,
  icon: '📖',
  iconMode: 'emoji',
};

export function ExperienceCategoriesManager() {
  const { data: categories, isLoading } = useAdminExperienceCategories();
  const createCategory = useCreateExperienceCategory();
  const updateCategory = useUpdateExperienceCategory();
  const deleteCategory = useDeleteExperienceCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExperienceCategoryAdmin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSaving = createCategory.isPending || updateCategory.isPending;

  const openCreate = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setIconFile(null);
    setIconPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: ExperienceCategoryAdmin) => {
    const iconIsUrl = isImageUrl(cat.icon);
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#08949B',
      display_order: cat.display_order ?? 0,
      icon: cat.icon || '📖',
      iconMode: iconIsUrl ? 'image' : 'emoji',
    });
    setIconFile(null);
    setIconPreview(iconIsUrl ? cat.icon : null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const formData = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      color: form.color,
      display_order: form.display_order,
      icon: form.iconMode === 'emoji' ? form.icon : (iconPreview || form.icon),
    };

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, formData, iconFile: iconFile || undefined });
    } else {
      await createCategory.mutateAsync({ formData, iconFile: iconFile || undefined });
    }

    setDialogOpen(false);
    setEditingCategory(null);
    setIconFile(null);
    setIconPreview(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteCategory.mutateAsync(deletingId);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    const url = URL.createObjectURL(file);
    setIconPreview(url);
  };

  const clearImage = () => {
    setIconFile(null);
    setIconPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderIconPreview = (icon: string | null) => {
    if (!icon) return <span className="text-2xl">📖</span>;
    if (isImageUrl(icon)) {
      return <img src={icon} alt="" className="w-8 h-8 rounded object-cover" />;
    }
    return <span className="text-2xl">{icon}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Categorías de Experiencias</h3>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      {(!categories || categories.length === 0) ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay categorías aún.</p>
      ) : (
        <div className="grid gap-2">
          {categories.map((cat) => (
            <Card key={cat.id} className="shadow-sm">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color || '#08949B'}20` }}
                  >
                    {renderIconPreview(cat.icon)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setDeletingId(cat.id); setDeleteDialogOpen(true); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Aventura"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción"
              />
            </div>

            {/* Illustration toggle */}
            <div className="space-y-1.5">
              <Label>Ilustración</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={form.iconMode === 'emoji' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setForm({ ...form, iconMode: 'emoji' })}
                >
                  <Smile className="h-4 w-4" />
                  Emoji
                </Button>
                <Button
                  type="button"
                  variant={form.iconMode === 'image' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setForm({ ...form, iconMode: 'image' })}
                >
                  <ImageIcon className="h-4 w-4" />
                  Imagen
                </Button>
              </div>

              {form.iconMode === 'emoji' ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-lg border flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${form.color}15` }}
                  >
                    {form.icon && !isImageUrl(form.icon) ? form.icon : '📖'}
                  </div>
                  <Input
                    value={isImageUrl(form.icon) ? '' : form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="Pega un emoji aquí"
                    className="max-w-[140px] text-center text-xl"
                    maxLength={4}
                  />
                  <p className="text-xs text-muted-foreground">Pega un emoji</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {iconPreview || (isImageUrl(form.icon) && !iconFile) ? (
                      <>
                        <img
                          src={iconPreview || form.icon}
                          alt="Ícono"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-destructive text-white rounded-bl p-0.5"
                          onClick={clearImage}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="h-4 w-4" />
                      Subir imagen
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Cuadrada, máx 500×500</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="max-w-[120px] font-mono text-sm"
                  placeholder="#08949B"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                className="max-w-[100px]"
                min={0}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategory ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también las relaciones con experiencias. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
