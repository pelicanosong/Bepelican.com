 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import type { QueryEnabledOptions } from '@/lib/queryClient';
 
 export interface AdminFlipbook {
   id: string;
   slug: string;
   title: string;
   description: string | null;
   cover_image: string | null;
   pdf_url: string;
   tags: string[];
   is_featured: boolean;
   view_count: number;
   status: 'draft' | 'published' | 'archived';
   created_at: string;
   updated_at: string;
   categories?: { id: string; name: string; slug: string }[];
 }
 
const sanitizeFileName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/(^_|_$)/g, '');
};

export interface FlipbookFormData {
   title: string;
   description?: string;
   tags: string[];
   is_featured?: boolean;
   status: 'draft' | 'published' | 'archived';
   category_ids: string[];
 }
 
 export const useAdminFlipbooks = (options?: QueryEnabledOptions) => {
   return useQuery({
     queryKey: ['admin-flipbooks'],
     enabled: options?.enabled ?? true,
     queryFn: async () => {
       const { data, error } = await supabase
         .from('flipbooks')
         .select(`
           *,
           flipbook_category_relations(
             flipbook_categories(id, name, slug)
           )
         `)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
 
       return data?.map((fb: any) => ({
         ...fb,
         categories: fb.flipbook_category_relations?.map(
           (rel: any) => rel.flipbook_categories
         ).filter(Boolean) || []
       })) as AdminFlipbook[];
     }
   });
 };
 
 export const useCreateFlipbook = () => {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({
       formData,
       pdfFile,
       coverFile
     }: {
       formData: FlipbookFormData;
       pdfFile: File;
       coverFile?: File;
     }) => {
       // Generate slug from title
       const slug = formData.title
         .toLowerCase()
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/(^-|-$)/g, '');
 
       // Upload PDF
        const pdfPath = `pdfs/${Date.now()}-${sanitizeFileName(pdfFile.name)}`;
       const { error: pdfError } = await supabase.storage
         .from('flipbooks')
         .upload(pdfPath, pdfFile);
 
       if (pdfError) throw pdfError;
 
       const { data: pdfUrlData } = supabase.storage
         .from('flipbooks')
         .getPublicUrl(pdfPath);
 
       // Upload cover if provided
       let coverUrl = null;
       if (coverFile) {
          const coverPath = `covers/${Date.now()}-${sanitizeFileName(coverFile.name)}`;
         const { error: coverError } = await supabase.storage
           .from('flipbooks')
           .upload(coverPath, coverFile);
 
         if (coverError) throw coverError;
 
         const { data: coverUrlData } = supabase.storage
           .from('flipbooks')
           .getPublicUrl(coverPath);
 
         coverUrl = coverUrlData.publicUrl;
       }
 
       // Create flipbook
       const { data: flipbook, error: flipbookError } = await supabase
         .from('flipbooks')
         .insert({
           slug,
           title: formData.title,
           description: formData.description || null,
           pdf_url: pdfUrlData.publicUrl,
           cover_image: coverUrl,
           tags: formData.tags,
           is_featured: formData.is_featured || false,
           status: formData.status
         })
         .select()
         .single();
 
       if (flipbookError) throw flipbookError;
 
       // Create category relations
       if (formData.category_ids.length > 0) {
         const categoryRelations = formData.category_ids.map(catId => ({
           flipbook_id: flipbook.id,
           category_id: catId
         }));
 
         const { error: relError } = await supabase
           .from('flipbook_category_relations')
           .insert(categoryRelations);
 
         if (relError) throw relError;
       }
 
       return flipbook;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-flipbooks'] });
       queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
       toast({
         title: 'Flipbook creado',
         description: 'El flipbook se ha creado exitosamente.'
       });
     },
     onError: (error: any) => {
       toast({
         title: 'Error',
         description: error.message || 'No se pudo crear el flipbook.',
         variant: 'destructive'
       });
     }
   });
 };
 
 export const useUpdateFlipbook = () => {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({
       id,
       formData,
       pdfFile,
       coverFile
     }: {
       id: string;
       formData: FlipbookFormData;
       pdfFile?: File;
       coverFile?: File;
     }) => {
       const updates: any = {
         title: formData.title,
         description: formData.description || null,
         tags: formData.tags,
         is_featured: formData.is_featured || false,
         status: formData.status,
         updated_at: new Date().toISOString()
       };
 
       // Upload new PDF if provided
       if (pdfFile) {
         const pdfPath = `pdfs/${Date.now()}-${sanitizeFileName(pdfFile.name)}`;
         const { error: pdfError } = await supabase.storage
           .from('flipbooks')
           .upload(pdfPath, pdfFile);
 
         if (pdfError) throw pdfError;
 
         const { data: pdfUrlData } = supabase.storage
           .from('flipbooks')
           .getPublicUrl(pdfPath);
 
         updates.pdf_url = pdfUrlData.publicUrl;
       }
 
       // Upload new cover if provided
       if (coverFile) {
         const coverPath = `covers/${Date.now()}-${sanitizeFileName(coverFile.name)}`;
         const { error: coverError } = await supabase.storage
           .from('flipbooks')
           .upload(coverPath, coverFile);
 
         if (coverError) throw coverError;
 
         const { data: coverUrlData } = supabase.storage
           .from('flipbooks')
           .getPublicUrl(coverPath);
 
         updates.cover_image = coverUrlData.publicUrl;
       }
 
       // Update flipbook
       const { data: flipbook, error: flipbookError } = await supabase
         .from('flipbooks')
         .update(updates)
         .eq('id', id)
         .select()
         .single();
 
       if (flipbookError) throw flipbookError;
 
       // Update category relations
       await supabase
         .from('flipbook_category_relations')
         .delete()
         .eq('flipbook_id', id);
 
       if (formData.category_ids.length > 0) {
         const categoryRelations = formData.category_ids.map(catId => ({
           flipbook_id: id,
           category_id: catId
         }));
 
         const { error: relError } = await supabase
           .from('flipbook_category_relations')
           .insert(categoryRelations);
 
         if (relError) throw relError;
       }
 
       return flipbook;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-flipbooks'] });
       queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
       toast({
         title: 'Flipbook actualizado',
         description: 'El flipbook se ha actualizado exitosamente.'
       });
     },
     onError: (error: any) => {
       toast({
         title: 'Error',
         description: error.message || 'No se pudo actualizar el flipbook.',
         variant: 'destructive'
       });
     }
   });
 };
 
 export const useDeleteFlipbook = () => {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('flipbooks')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-flipbooks'] });
       queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
       toast({
         title: 'Flipbook eliminado',
         description: 'El flipbook se ha eliminado exitosamente.'
       });
     },
     onError: (error: any) => {
       toast({
         title: 'Error',
         description: error.message || 'No se pudo eliminar el flipbook.',
         variant: 'destructive'
       });
     }
   });
 };