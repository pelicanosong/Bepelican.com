import { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ListEditor } from "./ListEditor";
import type { ExperienceFormData } from "./types";
import { CANCELLATION_POLICIES } from "./types";

interface Step6Props {
  form: UseFormReturn<ExperienceFormData>;
}

export function Step6ClimatePolicy({ form }: Step6Props) {
  const requirements = form.watch("requirements") || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Clima, recomendaciones y políticas</h3>
        <p className="text-sm text-muted-foreground">Información importante para que el viajero se prepare.</p>
      </div>

      {/* Climate */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-foreground text-sm">☀️ Información climática</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="temperature_range" render={({ field }) => (
            <FormItem>
              <FormLabel>Rango de temperatura típico</FormLabel>
              <FormControl><Input placeholder="Ej: 18°C - 28°C" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="recommended_season" render={({ field }) => (
            <FormItem>
              <FormLabel>Temporada recomendada</FormLabel>
              <FormControl><Input placeholder="Ej: Diciembre a Marzo (temporada seca)" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Requirements / tips */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground text-sm">🎒 Consejos para el viajero</h4>
        <FormField control={form.control} name="arrival_tips" render={({ field }) => (
          <FormItem>
            <FormLabel>Consejos de llegada</FormLabel>
            <FormControl>
              <Textarea placeholder="Tips sobre cómo llegar, qué llevar, nivel físico requerido..." rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <ListEditor
          label="Recomendaciones"
          items={requirements}
          onChange={(items) => form.setValue("requirements", items)}
          placeholder="Ej: Llevar protector solar, zapatos cómodos..."
        />
      </div>

      {/* Accessibility */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-foreground text-sm">♿ Accesibilidad</h4>
        <div className="space-y-3">
          <FormField control={form.control} name="accessible_reduced_mobility" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel className="text-sm">Apto para movilidad reducida</FormLabel>
              <FormControl>
                <Switch checked={field.value || false} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="accessible_children" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel className="text-sm">Apto para niños</FormLabel>
              <FormControl>
                <Switch checked={field.value || false} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="pets_allowed" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel className="text-sm">Se aceptan mascotas</FormLabel>
              <FormControl>
                <Switch checked={field.value || false} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="accessibility_notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notas adicionales de accesibilidad</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Terreno irregular en algunos tramos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground text-sm">📋 Política de cancelación</h4>
        <FormField control={form.control} name="cancellation_policy_type" render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {CANCELLATION_POLICIES.map((policy) => {
                const isSelected = field.value === policy.value;
                return (
                  <button
                    key={policy.value}
                    type="button"
                    onClick={() => field.onChange(policy.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {policy.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{policy.description}</div>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="cancellation_policy" render={({ field }) => (
          <FormItem>
            <FormLabel>Detalles adicionales de cancelación</FormLabel>
            <FormControl>
              <Textarea placeholder="Información adicional sobre la política de cancelación..." rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}
