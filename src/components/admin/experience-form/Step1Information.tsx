import { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import type { ExperienceFormData } from "./types";
import type { Tables } from "@/integrations/supabase/types";

interface Step1Props {
  form: UseFormReturn<ExperienceFormData>;
  categories: Tables<"categories_experience">[] | undefined;
}

export function Step1Information({ form, categories }: Step1Props) {
  const shortDesc = form.watch("short_description") || "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Información básica</h3>
        <p className="text-sm text-muted-foreground">Define el nombre, categoría y descripción de tu experiencia.</p>
      </div>

      <FormField control={form.control} name="title" render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre de la experiencia *</FormLabel>
          <FormControl>
            <Input placeholder="Ej: Avistamiento de aves en la Sierra Nevada" {...field} />
          </FormControl>
          <FormDescription>Un nombre claro y atractivo que describa la experiencia.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="category_ids" render={({ field }) => (
        <FormItem>
          <FormLabel>Categorías *</FormLabel>
          <FormDescription>Selecciona una o más categorías.</FormDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories?.map((cat) => {
              const isSelected = field.value?.includes(cat.id);
              return (
                <label
                  key={cat.id}
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
                        checked ? [...current, cat.id] : current.filter((id: string) => id !== cat.id)
                      );
                    }}
                    className="sr-only"
                  />
                  {cat.name}
                </label>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="status" render={({ field }) => (
        <FormItem>
          <FormLabel>Estado *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="borrador">🟡 Borrador</SelectItem>
              <SelectItem value="activa">🟢 Activa</SelectItem>
              <SelectItem value="pausada">⏸️ Pausada</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="short_description" render={({ field }) => (
        <FormItem>
          <FormLabel>Descripción corta</FormLabel>
          <FormControl>
            <Input placeholder="Resumen breve para tarjetas y previews" maxLength={200} {...field} />
          </FormControl>
          <div className="flex justify-between">
            <FormDescription>Máximo 200 caracteres.</FormDescription>
            <span className={`text-xs ${shortDesc.length > 180 ? "text-destructive" : "text-muted-foreground"}`}>
              {shortDesc.length}/200
            </span>
          </div>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>Descripción completa *</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe en detalle lo que vivirá el viajero: qué hará, qué verá, qué sentirá..."
              rows={6}
              {...field}
            />
          </FormControl>
          <FormDescription>Sé descriptivo y evocador. Cuenta la historia de la experiencia.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
