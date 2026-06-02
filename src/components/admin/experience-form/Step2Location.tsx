import { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import type { ExperienceFormData } from "./types";
import { COLOMBIA_DEPARTMENTS, ENVIRONMENT_TYPES } from "./types";

interface Step2Props {
  form: UseFormReturn<ExperienceFormData>;
}

export function Step2Location({ form }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Ubicación</h3>
        <p className="text-sm text-muted-foreground">¿Dónde se realiza esta experiencia?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="location_department" render={({ field }) => (
          <FormItem>
            <FormLabel>Departamento</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
              <SelectContent>
                {COLOMBIA_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="location_city" render={({ field }) => (
          <FormItem>
            <FormLabel>Ciudad / Municipio *</FormLabel>
            <FormControl><Input placeholder="Ej: Santa Marta" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="location_name" render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre del lugar *</FormLabel>
          <FormControl><Input placeholder="Ej: Finca La Esperanza, Parque Tayrona, Vereda El Carmen" {...field} /></FormControl>
          <FormDescription>El nombre específico del sitio: finca, vereda, barrio, parque, etc.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="environment_type" render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
        const toggle = (val: string) => {
          const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val];
          field.onChange(next);
        };
        return (
          <FormItem>
            <FormLabel>Tipo de entorno</FormLabel>
            <FormDescription>Puedes seleccionar varios</FormDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {ENVIRONMENT_TYPES.map((env) => {
                const isSelected = selected.includes(env.value);
                return (
                  <button
                    key={env.value}
                    type="button"
                    onClick={() => toggle(env.value)}
                    className={`px-4 py-2 rounded-full border text-sm transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-medium"
                        : "bg-card border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {env.label}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }} />
    </div>
  );
}
