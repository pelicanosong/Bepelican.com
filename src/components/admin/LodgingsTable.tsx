import { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { AdminLodging, useDeleteLodging } from '@/hooks/useAdminLodgings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LodgingsTableProps {
  lodgings?: AdminLodging[];
  isLoading: boolean;
  onEdit: (lodging: AdminLodging) => void;
}

const typeEmojis: Record<string, string> = {
  posada: '🏡', hotel: '🏨', hostal: '🛏️', glamping: '⛺', cabaña: '🏠', finca: '🌿',
};

export const LodgingsTable = ({ lodgings, isLoading, onEdit }: LodgingsTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteLodging = useDeleteLodging();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteLodging.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!lodgings?.length ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No hay hospedajes
              </TableCell>
            </TableRow>
          ) : lodgings.map(l => (
            <TableRow key={l.id}>
              <TableCell className="font-medium">{l.name}</TableCell>
              <TableCell>{typeEmojis[l.lodging_type] || ''} {l.lodging_type}</TableCell>
              <TableCell>{l.city}</TableCell>
              <TableCell>
                <Badge className={l.is_active
                  ? 'bg-[hsl(var(--bepelican-green))]/10 text-[hsl(var(--bepelican-green))]'
                  : 'bg-muted text-muted-foreground'
                }>
                  {l.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(l)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(l.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar hospedaje?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará el hospedaje y todos sus tipos de habitación. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteLodging.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
