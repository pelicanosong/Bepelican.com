import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toMinutes, fromMinutes } from "@/lib/formatDuration";

interface DurationInputProps {
  durationMinutes: number;
  durationUnit: "minutes" | "hours" | "days";
  onDurationMinutesChange: (minutes: number) => void;
  onDurationUnitChange: (unit: "minutes" | "hours" | "days") => void;
}

export function DurationInput({
  durationMinutes,
  durationUnit,
  onDurationMinutesChange,
  onDurationUnitChange,
}: DurationInputProps) {
  const displayValue = fromMinutes(durationMinutes, durationUnit);

  const handleValueChange = (val: string) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      onDurationMinutesChange(toMinutes(num, durationUnit));
    }
  };

  const handleUnitChange = (newUnit: "minutes" | "hours" | "days") => {
    // Keep the same total minutes, just change the display unit
    onDurationUnitChange(newUnit);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Duración *</Label>
        <Input
          type="number"
          min={1}
          step={durationUnit === "minutes" ? 15 : 1}
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
        />
      </div>
      <div>
        <Label>Unidad</Label>
        <Select value={durationUnit} onValueChange={handleUnitChange as any}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Minutos</SelectItem>
            <SelectItem value="hours">Horas</SelectItem>
            <SelectItem value="days">Días</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
