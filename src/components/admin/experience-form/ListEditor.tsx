import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface ListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function ListEditor({ items, onChange, placeholder = "Agregar ítem...", label }: ListEditorProps) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addItem} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
