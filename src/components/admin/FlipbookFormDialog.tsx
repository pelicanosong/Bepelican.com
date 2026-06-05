 import { useState, useEffect } from 'react';
 import { useForm } from 'react-hook-form';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { z } from 'zod';
 import { Loader2, Upload, X, Plus } from 'lucide-react';
 import { AdminFlipbook, useCreateFlipbook, useUpdateFlipbook } from '@/hooks/useAdminFlipbooks';
 import { useFlipbookCategories } from '@/hooks/useFlipbooks';
 import { useToast } from '@/hooks/use-toast';

 const MAX_PDF_BYTES = 50 * 1024 * 1024;
 const RECOMMENDED_PDF_BYTES = 20 * 1024 * 1024;
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
 } from '@/components/ui/form';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Checkbox } from '@/components/ui/checkbox';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 
 const formSchema = z.object({
   title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
   description: z.string().optional(),
   status: z.enum(['draft', 'published', 'archived']),
   is_featured: z.boolean().optional(),
   category_ids: z.array(z.string()),
   tags: z.array(z.string()),
 });
 
 type FormData = z.infer<typeof formSchema>;
 
 interface FlipbookFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   flipbook?: AdminFlipbook | null;
 }
 
 export const FlipbookFormDialog = ({ open, onOpenChange, flipbook }: FlipbookFormDialogProps) => {
   const [pdfFile, setPdfFile] = useState<File | null>(null);
   const [coverFile, setCoverFile] = useState<File | null>(null);
   const [newTag, setNewTag] = useState('');
   const { toast } = useToast();
   
   const { data: categories = [] } = useFlipbookCategories();

   const handlePdfSelect = (file: File | null) => {
     if (!file) {
       setPdfFile(null);
       return;
     }
     if (file.size > MAX_PDF_BYTES) {
       toast({
         title: 'PDF demasiado pesado',
         description: `Máximo ${(MAX_PDF_BYTES / (1024 * 1024)).toFixed(0)} MB. Comprimilo en Canva o Acrobat.`,
         variant: 'destructive',
       });
       return;
     }
     if (file.size > RECOMMENDED_PDF_BYTES) {
       toast({
         title: 'PDF muy pesado',
         description: `Pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB. Para que cargue bien en la web, idealmente menos de 20 MB.`,
       });
     }
     setPdfFile(file);
   };
   const createFlipbook = useCreateFlipbook();
   const updateFlipbook = useUpdateFlipbook();
 
   const form = useForm<FormData>({
     resolver: zodResolver(formSchema),
     defaultValues: {
       title: '',
       description: '',
        status: 'published',
        is_featured: false,
        category_ids: [],
        tags: [],
      },
    });

    useEffect(() => {
      if (flipbook) {
        form.reset({
          title: flipbook.title,
          description: flipbook.description || '',
          status: flipbook.status,
          is_featured: flipbook.is_featured,
          category_ids: flipbook.categories?.map(c => c.id) || [],
          tags: flipbook.tags || [],
        });
      } else {
        form.reset({
          title: '',
          description: '',
          status: 'published',
         is_featured: false,
         category_ids: [],
         tags: [],
       });
     }
     setPdfFile(null);
     setCoverFile(null);
   }, [flipbook, form]);
 
   const onSubmit = async (data: FormData) => {
     if (flipbook) {
             await updateFlipbook.mutateAsync({
               id: flipbook.id,
               formData: {
                 title: data.title,
                 description: data.description,
                 status: data.status,
                 is_featured: data.is_featured,
                 category_ids: data.category_ids,
                 tags: data.tags,
               },
         pdfFile: pdfFile || undefined,
         coverFile: coverFile || undefined,
       });
     } else {
       if (!pdfFile) {
         form.setError('title', { message: 'Debes subir un archivo PDF' });
         return;
       }
           await createFlipbook.mutateAsync({
             formData: {
               title: data.title,
               description: data.description,
               status: data.status,
               is_featured: data.is_featured,
               category_ids: data.category_ids,
               tags: data.tags,
             },
         pdfFile,
         coverFile: coverFile || undefined,
       });
     }
     onOpenChange(false);
   };
 
   const handleAddTag = () => {
     if (newTag.trim()) {
       const currentTags = form.getValues('tags');
       if (!currentTags.includes(newTag.trim())) {
         form.setValue('tags', [...currentTags, newTag.trim()]);
       }
       setNewTag('');
     }
   };
 
   const handleRemoveTag = (tag: string) => {
     const currentTags = form.getValues('tags');
     form.setValue('tags', currentTags.filter(t => t !== tag));
   };
 
   const toggleCategory = (categoryId: string) => {
     const currentIds = form.getValues('category_ids');
     if (currentIds.includes(categoryId)) {
       form.setValue('category_ids', currentIds.filter(id => id !== categoryId));
     } else {
       form.setValue('category_ids', [...currentIds, categoryId]);
     }
   };
 
   const isPending = createFlipbook.isPending || updateFlipbook.isPending;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>
             {flipbook ? 'Editar Flipbook' : 'Nuevo Flipbook'}
           </DialogTitle>
         </DialogHeader>
 
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             {/* Title */}
             <FormField
               control={form.control}
               name="title"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Título *</FormLabel>
                   <FormControl>
                     <Input placeholder="Nombre del flipbook" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
 
             {/* Description */}
             <FormField
               control={form.control}
               name="description"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Descripción</FormLabel>
                   <FormControl>
                     <Textarea 
                       placeholder="Descripción corta del contenido" 
                       rows={3}
                       {...field} 
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
 
             {/* PDF Upload */}
             <div className="space-y-2">
               <FormLabel>Archivo PDF {!flipbook && '*'}</FormLabel>
               <p className="text-xs text-muted-foreground">
                 Recomendado: menos de 20 MB (máximo 50 MB). Archivos grandes tardan en abrir en la biblioteca.
               </p>
               <div className="flex items-center gap-4">
                 <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                   <Upload className="h-4 w-4" />
                   <span className="text-sm">
                     {pdfFile ? pdfFile.name : 'Seleccionar PDF'}
                   </span>
                   <input
                     type="file"
                     accept=".pdf"
                     className="hidden"
                     onChange={(e) => handlePdfSelect(e.target.files?.[0] || null)}
                   />
                 </label>
                 {pdfFile && (
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     onClick={() => setPdfFile(null)}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 )}
               </div>
               {flipbook?.pdf_url && !pdfFile && (
                 <p className="text-xs text-muted-foreground">
                   PDF actual: {flipbook.pdf_url.split('/').pop()}
                 </p>
               )}
             </div>
 
             {/* Cover Upload */}
             <div className="space-y-2">
               <FormLabel>Imagen de Portada</FormLabel>
               <div className="flex items-center gap-4">
                 <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                   <Upload className="h-4 w-4" />
                   <span className="text-sm">
                     {coverFile ? coverFile.name : 'Seleccionar imagen'}
                   </span>
                   <input
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                   />
                 </label>
                 {coverFile && (
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     onClick={() => setCoverFile(null)}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 )}
               </div>
               {flipbook?.cover_image && !coverFile && (
                 <div className="flex items-center gap-2">
                   <img 
                     src={flipbook.cover_image} 
                     alt="Portada actual" 
                     className="h-16 w-12 object-cover rounded"
                   />
                   <span className="text-xs text-muted-foreground">Portada actual</span>
                 </div>
               )}
             </div>
 
             {/* Categories */}
             <div className="space-y-2">
               <FormLabel>Categorías</FormLabel>
               <div className="flex flex-wrap gap-2">
                 {categories.map((category) => {
                   const isSelected = form.watch('category_ids').includes(category.id);
                   return (
                     <Badge
                       key={category.id}
                       variant={isSelected ? 'default' : 'outline'}
                       className="cursor-pointer"
                       onClick={() => toggleCategory(category.id)}
                     >
                       {category.name}
                     </Badge>
                   );
                 })}
               </div>
             </div>
 
             {/* Tags */}
             <div className="space-y-2">
               <FormLabel>Etiquetas</FormLabel>
               <div className="flex gap-2">
                 <Input
                   placeholder="Nueva etiqueta"
                   value={newTag}
                   onChange={(e) => setNewTag(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       handleAddTag();
                     }
                   }}
                 />
                 <Button type="button" variant="outline" onClick={handleAddTag}>
                   <Plus className="h-4 w-4" />
                 </Button>
               </div>
               <div className="flex flex-wrap gap-2 mt-2">
                 {form.watch('tags').map((tag) => (
                   <Badge key={tag} variant="secondary" className="gap-1">
                     {tag}
                     <X 
                       className="h-3 w-3 cursor-pointer" 
                       onClick={() => handleRemoveTag(tag)}
                     />
                   </Badge>
                 ))}
               </div>
             </div>
 
             {/* Status and Featured */}
             <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="status"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Estado</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="draft">Borrador</SelectItem>
                         <SelectItem value="published">Publicado</SelectItem>
                         <SelectItem value="archived">Archivado</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="is_featured"
                 render={({ field }) => (
                   <FormItem className="flex items-center gap-2 pt-8">
                     <FormControl>
                       <Checkbox
                         checked={field.value}
                         onCheckedChange={field.onChange}
                       />
                     </FormControl>
                     <FormLabel className="!mt-0 cursor-pointer">Destacado</FormLabel>
                   </FormItem>
                 )}
               />
             </div>
 
             {/* Actions */}
             <div className="flex justify-end gap-3 pt-4">
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => onOpenChange(false)}
                 disabled={isPending}
               >
                 Cancelar
               </Button>
               <Button type="submit" disabled={isPending}>
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {flipbook ? 'Guardar cambios' : 'Crear flipbook'}
               </Button>
             </div>
           </form>
         </Form>
       </DialogContent>
     </Dialog>
   );
 };