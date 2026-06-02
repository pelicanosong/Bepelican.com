import { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ExperienceFormData } from "./types";
import { WEEKDAYS } from "./types";

interface Step5Props {
  form: UseFormReturn<ExperienceFormData>;
}

export function Step5Logistics({ form }: Step5Props) {
  const endPointSame = form.watch("end_point_same");
  const startTimeFlexible = form.watch("start_time_flexible");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Logística y horarios</h3>
        <p className="text-sm text-muted-foreground">Define puntos de encuentro, horarios y días disponibles.</p>
      </div>

      <FormField control={form.control} name="location_address" render={({ field }) => (
        <FormItem>
          <FormLabel>Punto de encuentro</FormLabel>
          <FormControl>
            <Input placeholder="Ej: Entrada principal del Parque Tayrona" {...field} />
          </FormControl>
          <FormDescription>Dirección o referencia clara para el viajero.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="meeting_point_url" render={({ field }) => (
        <FormItem>
          <FormLabel>Link de Google Maps</FormLabel>
          <FormControl>
            <Input placeholder="https://maps.google.com/..." {...field} />
          </FormControl>
          <FormDescription>Enlace para que el viajero encuentre fácilmente el lugar.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="end_point_same" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-sm font-medium">¿El punto de finalización es el mismo?</FormLabel>
            <FormDescription>Si la experiencia termina en el mismo lugar donde inicia.</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )} />

      {!endPointSame && (
        <FormField control={form.control} name="end_point" render={({ field }) => (
          <FormItem>
            <FormLabel>Punto de finalización</FormLabel>
            <FormControl>
              <Input placeholder="¿Dónde termina la experiencia?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      )}

      {/* Start time */}
      <FormField control={form.control} name="start_time_flexible" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-sm font-medium">Horario flexible / a convenir</FormLabel>
            <FormDescription>Si no hay una hora fija de inicio.</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value || false} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )} />

      {!startTimeFlexible && (
        <FormField control={form.control} name="start_time" render={({ field }) => (
          <FormItem>
            <FormLabel>Hora de inicio</FormLabel>
            <FormControl>
              <Input type="time" className="max-w-[200px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      )}

      {/* Available days */}
      <FormField control={form.control} name="available_days" render={({ field }) => (
        <FormItem>
          <FormLabel>Días disponibles</FormLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {WEEKDAYS.map((day) => {
              const isSelected = field.value?.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    const current = field.value || [];
                    field.onChange(
                      isSelected ? current.filter((d: string) => d !== day.value) : [...current, day.value]
                    );
                  }}
                  className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <FormDescription>Selecciona los días en que la experiencia está disponible.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
