import { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { DurationInput } from "../DurationInput";
import type { ExperienceFormData } from "./types";
import { DIFFICULTY_LEVELS, LANGUAGE_OPTIONS } from "./types";
import { ItineraryEditor, ItineraryDay } from "./ItineraryEditor";

interface Step3Props {
  form: UseFormReturn<ExperienceFormData>;
  durationUnit: "minutes" | "hours" | "days";
  onDurationUnitChange: (unit: "minutes" | "hours" | "days") => void;
  itinerary: ItineraryDay[];
  onItineraryChange: (days: ItineraryDay[]) => void;
}

export function Step3Details({ form, durationUnit, onDurationUnitChange, itinerary, onItineraryChange }: Step3Props) {
  const durationMinutes = form.watch("duration_minutes");
  const totalDays = durationUnit === "days" ? Math.round(durationMinutes / 1440) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Detalles de la experiencia</h3>
        <p className="text-sm text-muted-foreground">Configura la duración, capacidad y características.</p>
      </div>

      {/* Duration */}
      <FormField control={form.control} name="duration_minutes" render={({ field }) => (
        <FormItem>
          <FormLabel>Duración *</FormLabel>
          <FormControl>
            <DurationInput
              durationMinutes={field.value}
              durationUnit={durationUnit}
              onDurationMinutesChange={field.onChange}
              onDurationUnitChange={onDurationUnitChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Itinerary editor for multi-day experiences */}
      {durationUnit === "days" && (
        <ItineraryEditor
          days={itinerary}
          onChange={onItineraryChange}
          totalDays={totalDays}
        />
      )}

      {/* Max participants */}
      <FormField control={form.control} name="max_participants" render={({ field }) => (
        <FormItem>
          <FormLabel>Máximo de participantes *</FormLabel>
          <FormControl><Input type="number" min={1} className="max-w-[200px]" {...field} /></FormControl>
          <FormDescription>Capacidad máxima del grupo por sesión.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      {/* Difficulty */}
      <FormField control={form.control} name="difficulty" render={({ field }) => (
        <FormItem>
          <FormLabel>Nivel de dificultad</FormLabel>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = field.value === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => field.onChange(isSelected ? "" : level.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected ? level.color + " border-current" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs mt-0.5 opacity-75">{level.description}</div>
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="difficulty_notes" render={({ field }) => (
        <FormItem>
          <FormLabel>Comentario sobre dificultad</FormLabel>
          <FormControl>
            <Input placeholder="Ej: Se recomienda experiencia previa en senderismo" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Languages */}
      <FormField control={form.control} name="languages" render={({ field }) => (
        <FormItem>
          <FormLabel>Idiomas disponibles</FormLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = field.value?.includes(lang.value);
              return (
                <label
                  key={lang.value}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all text-sm ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      field.onChange(
                        checked ? [...current, lang.value] : current.filter((v: string) => v !== lang.value)
                      );
                    }}
                    className="sr-only"
                  />
                  {lang.label}
                </label>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="extra_language_cost" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-sm font-medium">Idiomas adicionales con costo extra</FormLabel>
            <FormDescription>Activar si los idiomas diferentes al principal tienen un costo adicional.</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value || false} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )} />
    </div>
  );
}
