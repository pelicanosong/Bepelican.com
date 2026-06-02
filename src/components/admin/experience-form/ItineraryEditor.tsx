import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

export interface ItineraryActivity {
  description: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  activities: ItineraryActivity[];
}

interface ItineraryEditorProps {
  days: ItineraryDay[];
  onChange: (days: ItineraryDay[]) => void;
  totalDays?: number;
}

export function ItineraryEditor({ days, onChange, totalDays }: ItineraryEditorProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(days.length > 0 ? 0 : null);
  const [newActivity, setNewActivity] = useState<Record<number, string>>({});

  const addDay = () => {
    const nextNumber = days.length > 0 ? Math.max(...days.map(d => d.dayNumber)) + 1 : 1;
    onChange([...days, { dayNumber: nextNumber, title: "", activities: [] }]);
    setExpandedDay(days.length);
  };

  const removeDay = (index: number) => {
    const updated = days.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedDay === index) setExpandedDay(null);
    else if (expandedDay !== null && expandedDay > index) setExpandedDay(expandedDay - 1);
  };

  const updateDayTitle = (index: number, title: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], title };
    onChange(updated);
  };

  const addActivity = (dayIndex: number) => {
    const text = (newActivity[dayIndex] || "").trim();
    if (!text) return;
    const updated = [...days];
    updated[dayIndex] = {
      ...updated[dayIndex],
      activities: [...updated[dayIndex].activities, { description: text }],
    };
    onChange(updated);
    setNewActivity({ ...newActivity, [dayIndex]: "" });
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const updated = [...days];
    updated[dayIndex] = {
      ...updated[dayIndex],
      activities: updated[dayIndex].activities.filter((_, i) => i !== actIndex),
    };
    onChange(updated);
  };

  const autoPopulateDays = () => {
    if (!totalDays || totalDays < 1) return;
    const newDays: ItineraryDay[] = [];
    for (let i = 1; i <= totalDays; i++) {
      const existing = days.find(d => d.dayNumber === i);
      newDays.push(existing || { dayNumber: i, title: "", activities: [] });
    }
    onChange(newDays);
    setExpandedDay(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Itinerario día a día</p>
        <div className="flex gap-2">
          {totalDays && totalDays > 0 && days.length === 0 && (
            <Button type="button" variant="outline" size="sm" onClick={autoPopulateDays} className="text-xs">
              Crear {totalDays} días
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addDay} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Agregar día
          </Button>
        </div>
      </div>

      {days.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No hay días agregados.</p>
          <p className="text-xs text-muted-foreground mt-1">Agrega días para crear el itinerario de la experiencia.</p>
        </div>
      )}

      <div className="space-y-2">
        {days.map((day, dayIndex) => {
          const isExpanded = expandedDay === dayIndex;
          return (
            <div key={dayIndex} className="border border-border rounded-lg overflow-hidden bg-card">
              {/* Day header */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold text-primary min-w-[52px]">Día {day.dayNumber}</span>
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {day.title || "Sin título"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {day.activities.length} actividad{day.activities.length !== 1 ? "es" : ""}
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeDay(dayIndex); }}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Day content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
                  <Input
                    placeholder="Nombre del día (Ej: Ascenso al campamento base)"
                    value={day.title}
                    onChange={(e) => updateDayTitle(dayIndex, e.target.value)}
                    className="text-sm"
                  />

                  {/* Activities list */}
                  {day.activities.length > 0 && (
                    <div className="space-y-1.5">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-center gap-2 bg-muted/40 rounded-md px-3 py-2">
                          <span className="text-xs font-medium text-primary min-w-[18px]">{actIndex + 1}.</span>
                          <span className="text-sm text-foreground flex-1">{activity.description}</span>
                          <button
                            type="button"
                            onClick={() => removeActivity(dayIndex, actIndex)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add activity */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar actividad..."
                      value={newActivity[dayIndex] || ""}
                      onChange={(e) => setNewActivity({ ...newActivity, [dayIndex]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addActivity(dayIndex);
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addActivity(dayIndex)}
                      disabled={!(newActivity[dayIndex] || "").trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
