import { UseFormReturn } from "react-hook-form";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { PricingRulesEditor, LocalPricingRule } from "../PricingRulesEditor";
import { ListEditor } from "./ListEditor";
import type { ExperienceFormData } from "./types";

const PRICING_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  fixed: { label: "Precio fijo", description: "Un solo precio para todos" },
  per_person: { label: "Variable por personas", description: "El precio cambia según la cantidad de personas" },
  per_origin: { label: "Variable por origen", description: "El precio depende de dónde viene el viajero" },
  per_accommodation: { label: "Variable por acomodación", description: "El precio cambia según el tipo de alojamiento" },
  per_origin_accommodation: { label: "Origen × Acomodación", description: "Combinación de origen y acomodación" },
};

interface Step4Props {
  form: UseFormReturn<ExperienceFormData>;
  localPricingRules: LocalPricingRule[];
  onPricingRulesChange: (rules: LocalPricingRule[]) => void;
}

export function Step4Pricing({ form, localPricingRules, onPricingRulesChange }: Step4Props) {
  const currentPricingType = form.watch("pricing_type");
  const includes = form.watch("includes") || [];
  const notIncludes = form.watch("not_includes") || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Precios y modelo comercial</h3>
        <p className="text-sm text-muted-foreground">Define cómo cobras y qué incluye la experiencia.</p>
      </div>

      <FormField control={form.control} name="price" render={({ field }) => (
        <FormItem>
          <FormLabel>Precio base (COP) *</FormLabel>
          <FormControl>
            <div className="relative max-w-[300px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input type="number" min={0} className="pl-7" {...field} />
            </div>
          </FormControl>
          <FormDescription>Precio mínimo en pesos colombianos.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="pricing_type" render={({ field }) => (
        <FormItem>
          <FormLabel>Modelo de precios</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {Object.entries(PRICING_TYPE_LABELS).map(([value, info]) => {
              const isSelected = field.value === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {info.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{info.description}</div>
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )} />

      {currentPricingType !== "fixed" && (
        <div className="bg-muted/50 rounded-lg p-4">
          <PricingRulesEditor
            pricingType={currentPricingType}
            rules={localPricingRules}
            onRulesChange={onPricingRulesChange}
          />
        </div>
      )}

      <div className="border-t border-border pt-6 space-y-4">
        <h4 className="font-medium text-foreground">¿Qué incluye?</h4>
        <ListEditor
          items={includes}
          onChange={(items) => form.setValue("includes", items)}
          placeholder="Ej: Guía local, seguro básico, almuerzo típico..."
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-foreground">¿Qué NO incluye?</h4>
        <ListEditor
          items={notIncludes}
          onChange={(items) => form.setValue("not_includes", items)}
          placeholder="Ej: Transporte, equipo especializado..."
        />
      </div>
    </div>
  );
}
