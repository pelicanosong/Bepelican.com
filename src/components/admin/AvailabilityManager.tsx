import { useState } from 'react';
import { useAdminExperiences } from '@/hooks/useAdminExperiences';
import { useBlockedDates, useAddBlockedDate, useRemoveBlockedDate } from '@/hooks/useBlockedDates';
import { useUpdateExperience } from '@/hooks/useAdminExperiences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Trash2, Plus, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ALL_WEEKDAYS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

export function AvailabilityManager() {
  const { data: experiences, isLoading } = useAdminExperiences();
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  const selectedExp = experiences?.find((e) => e.id === selectedExpId);

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (selectedExpId && selectedExp) {
    return (
      <ExperienceAvailabilityEditor
        experience={selectedExp}
        onBack={() => setSelectedExpId(null)}
      />
    );
  }

  return (
    <div className="space-y-2">
      {experiences?.map((exp) => (
        <button
          key={exp.id}
          onClick={() => setSelectedExpId(exp.id)}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
        >
          <div>
            <p className="font-medium text-foreground">{exp.title}</p>
            <p className="text-sm text-muted-foreground">
              {exp.available_days?.length || 0} días activos · {exp.location_city}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

function ExperienceAvailabilityEditor({
  experience,
  onBack,
}: {
  experience: any;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const updateExperience = useUpdateExperience();
  const { data: blockedDates = [], isLoading: blockedLoading } = useBlockedDates(experience.id);
  const addBlockedDate = useAddBlockedDate();
  const removeBlockedDate = useRemoveBlockedDate();

  const [selectedDays, setSelectedDays] = useState<string[]>(experience.available_days || []);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [savingDays, setSavingDays] = useState(false);

  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveDays = async () => {
    setSavingDays(true);
    try {
      await updateExperience.mutateAsync({
        id: experience.id,
        available_days: selectedDays,
      } as any);
      toast({ title: 'Días actualizados correctamente' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setSavingDays(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;
    try {
      await addBlockedDate.mutateAsync({
        experienceId: experience.id,
        date: newBlockedDate,
        reason: newBlockedReason || undefined,
      });
      toast({ title: 'Fecha bloqueada agregada' });
      setNewBlockedDate('');
      setNewBlockedReason('');
    } catch (err: any) {
      const isDuplicate = err?.message?.includes('duplicate') || err?.code === '23505';
      toast({
        title: isDuplicate ? 'Esta fecha ya está bloqueada' : 'Error al agregar fecha',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      await removeBlockedDate.mutateAsync({ id, experienceId: experience.id });
      toast({ title: 'Fecha desbloqueada' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a la lista
      </Button>

      <h3 className="text-lg font-semibold text-foreground">{experience.title}</h3>

      {/* Weekday selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Días de la semana disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_WEEKDAYS.map((day) => (
              <label
                key={day.value}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedDays.includes(day.value)}
                  onCheckedChange={() => handleToggleDay(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
          <Button
            onClick={handleSaveDays}
            disabled={savingDays}
            size="sm"
          >
            {savingDays ? 'Guardando...' : 'Guardar días'}
          </Button>
        </CardContent>
      </Card>

      {/* Blocked dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fechas bloqueadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new blocked date */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="sm:w-48"
            />
            <Input
              placeholder="Razón (opcional)"
              value={newBlockedReason}
              onChange={(e) => setNewBlockedReason(e.target.value)}
              className="sm:flex-1"
            />
            <Button
              onClick={handleAddBlockedDate}
              disabled={!newBlockedDate || addBlockedDate.isPending}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          {/* List of blocked dates */}
          {blockedLoading ? (
            <Skeleton className="h-20" />
          ) : blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay fechas bloqueadas. Las fechas bloqueadas aparecerán deshabilitadas en el calendario del usuario.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div
                  key={bd.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/20"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(bd.blocked_date + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
                    </p>
                    {bd.reason && (
                      <p className="text-xs text-muted-foreground">{bd.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBlockedDate(bd.id)}
                    disabled={removeBlockedDate.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
