import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface LocalPricingRule {
  id?: string;
  rule_type: "per_person" | "per_origin" | "per_accommodation" | "per_origin_accommodation";
  label: string;
  origin_label: string | null;
  min_pax: number | null;
  max_pax: number | null;
  price: number;
  sort_order: number;
  is_active: boolean;
}

interface PricingRulesEditorProps {
  pricingType: "fixed" | "per_person" | "per_origin" | "per_accommodation" | "per_origin_accommodation";
  rules: LocalPricingRule[];
  onRulesChange: (rules: LocalPricingRule[]) => void;
}

const PLACEHOLDER_LABELS: Record<string, string> = {
  per_person: "Ej: 1-4 personas",
  per_origin: "Ej: Bogotá",
  per_accommodation: "Ej: Doble",
  per_origin_accommodation: "Ej: Múltiple",
};

export function PricingRulesEditor({
  pricingType,
  rules,
  onRulesChange,
}: PricingRulesEditorProps) {
  if (pricingType === "fixed") {
    return (
      <p className="text-sm text-muted-foreground">
        Precio fijo: se usa el campo "Precio (COP)" de arriba.
      </p>
    );
  }

  // --- per_origin_accommodation: matrix UI ---
  if (pricingType === "per_origin_accommodation") {
    return (
      <OriginAccommodationEditor rules={rules} onRulesChange={onRulesChange} />
    );
  }

  // --- Simple rule types ---
  const addRule = () => {
    const newRule: LocalPricingRule = {
      rule_type: pricingType as LocalPricingRule["rule_type"],
      label: "",
      origin_label: null,
      min_pax: pricingType === "per_person" ? 1 : null,
      max_pax: pricingType === "per_person" ? 4 : null,
      price: 0,
      sort_order: rules.length,
      is_active: true,
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (index: number, updates: Partial<LocalPricingRule>) => {
    const updated = rules.map((r, i) => (i === index ? { ...r, ...updates } : r));
    onRulesChange(updated);
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  const typeLabel =
    pricingType === "per_person"
      ? "Rango de personas"
      : pricingType === "per_origin"
      ? "Lugar de origen"
      : "Tipo de acomodación";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Reglas de {typeLabel}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRule}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar regla
        </Button>
      </div>

      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No hay reglas configuradas. Agrega al menos una.
        </p>
      )}

      {rules.map((rule, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border border-border rounded-md bg-muted/30"
        >
          <div className={pricingType === "per_person" ? "md:col-span-3" : "md:col-span-5"}>
            <Label className="text-xs">Etiqueta</Label>
            <Input
              value={rule.label}
              onChange={(e) => updateRule(index, { label: e.target.value })}
              placeholder={PLACEHOLDER_LABELS[pricingType]}
            />
          </div>

          {pricingType === "per_person" && (
            <>
              <div className="md:col-span-2">
                <Label className="text-xs">Mín. pax</Label>
                <Input
                  type="number"
                  min={1}
                  value={rule.min_pax ?? ""}
                  onChange={(e) =>
                    updateRule(index, { min_pax: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Máx. pax</Label>
                <Input
                  type="number"
                  min={1}
                  value={rule.max_pax ?? ""}
                  onChange={(e) =>
                    updateRule(index, { max_pax: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
            </>
          )}

          <div className={pricingType === "per_person" ? "md:col-span-3" : "md:col-span-5"}>
            <Label className="text-xs">Precio (COP)</Label>
            <Input
              type="number"
              min={0}
              value={rule.price}
              onChange={(e) => updateRule(index, { price: Number(e.target.value) })}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => removeRule(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Origin × Accommodation matrix editor ---

function OriginAccommodationEditor({
  rules,
  onRulesChange,
}: {
  rules: LocalPricingRule[];
  onRulesChange: (rules: LocalPricingRule[]) => void;
}) {
  const [newOrigin, setNewOrigin] = useState("");
  const [newAccommodation, setNewAccommodation] = useState("");

  // Derive unique origins and accommodations from existing rules
  const origins = [...new Set(rules.map((r) => r.origin_label).filter(Boolean))] as string[];
  const accommodations = [...new Set(rules.map((r) => r.label).filter(Boolean))] as string[];

  const getPrice = (origin: string, accommodation: string): number => {
    const rule = rules.find((r) => r.origin_label === origin && r.label === accommodation);
    return rule?.price ?? 0;
  };

  const setPrice = (origin: string, accommodation: string, price: number) => {
    const idx = rules.findIndex((r) => r.origin_label === origin && r.label === accommodation);
    if (idx >= 0) {
      const updated = [...rules];
      updated[idx] = { ...updated[idx], price };
      onRulesChange(updated);
    }
  };

  const addOrigin = () => {
    const trimmed = newOrigin.trim();
    if (!trimmed || origins.includes(trimmed)) return;
    // Create a rule for each existing accommodation, or one placeholder if none
    const accs = accommodations.length > 0 ? accommodations : [""];
    const newRules: LocalPricingRule[] = accs.map((acc, i) => ({
      rule_type: "per_origin_accommodation" as const,
      label: acc,
      origin_label: trimmed,
      min_pax: null,
      max_pax: null,
      price: 0,
      sort_order: rules.length + i,
      is_active: true,
    }));
    onRulesChange([...rules, ...newRules]);
    setNewOrigin("");
  };

  const addAccommodation = () => {
    const trimmed = newAccommodation.trim();
    if (!trimmed || accommodations.includes(trimmed)) return;
    // Create a rule for each existing origin
    const origs = origins.length > 0 ? origins : [""];
    const newRules: LocalPricingRule[] = origs.map((orig, i) => ({
      rule_type: "per_origin_accommodation" as const,
      label: trimmed,
      origin_label: orig || null,
      min_pax: null,
      max_pax: null,
      price: 0,
      sort_order: rules.length + i,
      is_active: true,
    }));
    onRulesChange([...rules, ...newRules]);
    setNewAccommodation("");
  };

  const removeOrigin = (origin: string) => {
    onRulesChange(rules.filter((r) => r.origin_label !== origin));
  };

  const removeAccommodation = (accommodation: string) => {
    onRulesChange(rules.filter((r) => r.label !== accommodation));
  };

  return (
    <div className="space-y-4">
      {/* Add origin */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">Agregar origen</Label>
          <Input
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            placeholder="Ej: Bogotá o Bucaramanga"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOrigin())}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addOrigin}>
          <Plus className="h-4 w-4 mr-1" /> Origen
        </Button>
      </div>

      {/* Add accommodation */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">Agregar acomodación</Label>
          <Input
            value={newAccommodation}
            onChange={(e) => setNewAccommodation(e.target.value)}
            placeholder="Ej: Múltiple, Doble, Individual"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAccommodation())}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addAccommodation}>
          <Plus className="h-4 w-4 mr-1" /> Acomodación
        </Button>
      </div>

      {origins.length === 0 && accommodations.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Agrega al menos un origen y una acomodación para configurar precios.
        </p>
      )}

      {/* Matrix table */}
      {origins.length > 0 && accommodations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-md">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-2 text-left font-medium">Origen \ Acomodación</th>
                {accommodations.map((acc) => (
                  <th key={acc} className="p-2 text-center font-medium">
                    <div className="flex items-center justify-center gap-1">
                      {acc}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeAccommodation(acc)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {origins.map((origin) => (
                <tr key={origin} className="border-t border-border">
                  <td className="p-2 font-medium">
                    <div className="flex items-center gap-1">
                      {origin}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeOrigin(origin)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  {accommodations.map((acc) => (
                    <td key={acc} className="p-2">
                      <Input
                        type="number"
                        min={0}
                        className="text-center"
                        value={getPrice(origin, acc)}
                        onChange={(e) => setPrice(origin, acc, Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
