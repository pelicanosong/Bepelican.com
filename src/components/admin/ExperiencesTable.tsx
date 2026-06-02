import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2, MapPin } from "lucide-react";
import { AdminExperienceWithCategory, useDeleteExperience } from "@/hooks/useAdminExperiences";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExperiencesTableProps {
  experiences: AdminExperienceWithCategory[] | undefined;
  isLoading: boolean;
  onEdit: (experience: AdminExperienceWithCategory) => void;
}

export function ExperiencesTable({ experiences, isLoading, onEdit }: ExperiencesTableProps) {
  const { toast } = useToast();
  const deleteExperience = useDeleteExperience();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activa':
        return <Badge className="bg-[hsl(var(--bepelican-green))] hover:bg-[hsl(var(--bepelican-green))]">Activa</Badge>;
      case 'borrador':
        return <Badge variant="secondary" className="bg-[hsl(var(--bepelican-orange))] text-white hover:bg-[hsl(var(--bepelican-orange))]">Borrador</Badge>;
      default:
        return <Badge variant="outline">Inactiva</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteExperience.mutateAsync(deleteId);
      toast({
        title: "Experiencia eliminada",
        description: "La experiencia se ha eliminado correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la experiencia",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Creación</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell><div className="h-4 bg-muted rounded w-40" /></TableCell>
                <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                <TableCell><div className="h-4 bg-muted rounded w-20" /></TableCell>
                <TableCell><div className="h-4 bg-muted rounded w-20" /></TableCell>
                <TableCell><div className="h-6 bg-muted rounded w-16" /></TableCell>
                <TableCell><div className="h-8 bg-muted rounded w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!experiences || experiences.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No hay experiencias creadas todavía.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">Ubicación</TableHead>
              <TableHead className="font-semibold">Creación</TableHead>
              <TableHead className="font-semibold">Precio</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="w-[100px] font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiences.map((exp) => (
              <TableRow key={exp.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{exp.title}</span>
                    {(exp as any).categories?.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {(exp as any).categories.map((c: any) => c.name).join(', ')}
                      </span>
                    ) : exp.category && (
                      <span className="text-xs text-muted-foreground">{exp.category.name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {exp.location_city}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(exp.created_at), "dd MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(exp.price)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(exp.status)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(exp)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(exp.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
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
            <AlertDialogTitle>¿Eliminar experiencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La experiencia será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteExperience.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteExperience.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExperience.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
