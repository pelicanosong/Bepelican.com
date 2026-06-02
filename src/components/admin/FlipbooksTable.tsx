 import { useState } from 'react';
 import { Pencil, Trash2, Eye, Star, Loader2 } from 'lucide-react';
 import { AdminFlipbook, useDeleteFlipbook } from '@/hooks/useAdminFlipbooks';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Skeleton } from '@/components/ui/skeleton';
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
 
 interface FlipbooksTableProps {
   flipbooks?: AdminFlipbook[];
   isLoading: boolean;
   onEdit: (flipbook: AdminFlipbook) => void;
 }
 
 export const FlipbooksTable = ({ flipbooks, isLoading, onEdit }: FlipbooksTableProps) => {
   const [deleteId, setDeleteId] = useState<string | null>(null);
   const deleteFlipbook = useDeleteFlipbook();
 
   const handleDelete = async () => {
     if (deleteId) {
       await deleteFlipbook.mutateAsync(deleteId);
       setDeleteId(null);
     }
   };
 
   const statusColors: Record<string, string> = {
     published: 'bg-[hsl(var(--bepelican-green))]/10 text-[hsl(var(--bepelican-green))]',
     draft: 'bg-[hsl(var(--bepelican-orange))]/10 text-[hsl(var(--bepelican-orange))]',
     archived: 'bg-muted text-muted-foreground'
   };
 
   const statusLabels: Record<string, string> = {
     published: 'Publicado',
     draft: 'Borrador',
     archived: 'Archivado'
   };
 
   if (isLoading) {
     return (
       <div className="space-y-3">
         {[...Array(5)].map((_, i) => (
           <Skeleton key={i} className="h-16 w-full" />
         ))}
       </div>
     );
   }
 
   if (!flipbooks?.length) {
     return (
       <div className="text-center py-12 text-muted-foreground">
         No hay flipbooks. Crea el primero.
       </div>
     );
   }
 
   return (
     <>
       <div className="overflow-x-auto">
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead className="w-[60px]">Portada</TableHead>
               <TableHead>Título</TableHead>
               <TableHead>Categorías</TableHead>
               <TableHead>Estado</TableHead>
               <TableHead className="text-center">Vistas</TableHead>
               <TableHead className="text-right">Acciones</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {flipbooks.map((flipbook) => (
               <TableRow key={flipbook.id}>
                 <TableCell>
                   <div className="w-12 h-16 bg-muted rounded overflow-hidden">
                     {flipbook.cover_image ? (
                       <img
                         src={flipbook.cover_image}
                         alt={flipbook.title}
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                         PDF
                       </div>
                     )}
                   </div>
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-2">
                     <span className="font-medium">{flipbook.title}</span>
                     {flipbook.is_featured && (
                       <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                     )}
                   </div>
                   {flipbook.tags?.length > 0 && (
                     <div className="flex gap-1 mt-1">
                       {flipbook.tags.slice(0, 3).map((tag) => (
                         <Badge key={tag} variant="secondary" className="text-xs">
                           {tag}
                         </Badge>
                       ))}
                     </div>
                   )}
                 </TableCell>
                 <TableCell>
                   <div className="flex flex-wrap gap-1">
                     {flipbook.categories?.map((cat) => (
                       <Badge key={cat.id} variant="outline" className="text-xs">
                         {cat.name}
                       </Badge>
                     ))}
                   </div>
                 </TableCell>
                 <TableCell>
                   <Badge className={statusColors[flipbook.status]}>
                     {statusLabels[flipbook.status]}
                   </Badge>
                 </TableCell>
                 <TableCell className="text-center">
                   <div className="flex items-center justify-center gap-1 text-muted-foreground">
                     <Eye className="h-4 w-4" />
                     {flipbook.view_count}
                   </div>
                 </TableCell>
                 <TableCell className="text-right">
                   <div className="flex justify-end gap-2">
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => onEdit(flipbook)}
                     >
                       <Pencil className="h-4 w-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="text-destructive hover:text-destructive"
                       onClick={() => setDeleteId(flipbook.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </div>
 
       <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>¿Eliminar flipbook?</AlertDialogTitle>
             <AlertDialogDescription>
               Esta acción no se puede deshacer. El flipbook será eliminado permanentemente.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDelete}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               disabled={deleteFlipbook.isPending}
             >
               {deleteFlipbook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Eliminar
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 };