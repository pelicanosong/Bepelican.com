import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { AdminExperienceWithCategory } from "@/hooks/useAdminExperiences";

interface ExperienceSortManagerProps {
  experiences: AdminExperienceWithCategory[] | undefined;
}

const SORT_OPTIONS = [
  { value: "manual", label: "Orden manual (personalizado)" },
  { value: "created_desc", label: "Más recientes primero" },
  { value: "created_asc", label: "Más antiguas primero" },
  { value: "alpha_asc", label: "Alfabético (A → Z)" },
  { value: "alpha_desc", label: "Alfabético (Z → A)" },
  { value: "random", label: "Al azar" },
];

export function ExperienceSortManager({ experiences }: ExperienceSortManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortMode, setSortMode] = useState<string>("created_desc");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderedList, setOrderedList] = useState<AdminExperienceWithCategory[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Load current sort mode from site_settings
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "experience_sort_mode")
        .maybeSingle();
      if (data?.value) setSortMode(data.value);
      setLoading(false);
    };
    load();
  }, []);

  // Build ordered list for manual mode
  useEffect(() => {
    if (experiences) {
      setOrderedList([...experiences].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
    }
  }, [experiences]);

  const handleSortModeChange = async (mode: string) => {
    setSortMode(mode);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: mode })
        .eq("key", "experience_sort_mode");
      if (error) throw error;
      toast({ title: "Modo de orden actualizado" });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...orderedList];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setOrderedList(updated);
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
  };

  const saveManualOrder = async () => {
    setSaving(true);
    try {
      const updates = orderedList.map((exp, idx) => ({
        id: exp.id,
        display_order: idx,
      }));

      for (const u of updates) {
        const { error } = await supabase
          .from("experiences")
          .update({ display_order: u.display_order })
          .eq("id", u.id);
        if (error) throw error;
      }

      toast({ title: "Orden guardado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">Orden en la web:</span>
          <Select value={sortMode} onValueChange={handleSortModeChange}>
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {sortMode === "manual" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Arrastra las experiencias para cambiar el orden en que aparecen en la web.
            </p>
            <Button onClick={saveManualOrder} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar orden
            </Button>
          </div>
          <div className="border rounded-lg divide-y">
            {orderedList.map((exp, idx) => (
              <div
                key={exp.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing transition-colors ${
                  dragIdx === idx ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{exp.title}</span>
                  <span className="text-xs text-muted-foreground">{exp.location_city}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  exp.status === "activa"
                    ? "bg-[hsl(var(--bepelican-green))]/20 text-[hsl(var(--bepelican-green))]"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {exp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
