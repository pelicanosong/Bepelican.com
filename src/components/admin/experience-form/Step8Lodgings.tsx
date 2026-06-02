import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminLodgings, useLodgingRoomTypes, AdminLodging, AdminRoomType } from "@/hooks/useAdminLodgings";
import { Plus, Trash2, Hotel, Star, Building } from "lucide-react";

export interface LodgingLink {
  lodging_id: string;
  room_type_id: string | null;
  is_default_option: boolean;
  is_active: boolean;
}

interface Step8LodgingsProps {
  links: LodgingLink[];
  onLinksChange: (links: LodgingLink[]) => void;
  lodgingRequired: boolean;
  onLodgingRequiredChange: (v: boolean) => void;
}

function RoomTypeSelector({ lodgingId, value, onChange }: { lodgingId: string; value: string | null; onChange: (v: string | null) => void }) {
  const { data: roomTypes } = useLodgingRoomTypes(lodgingId);

  if (!roomTypes || roomTypes.length === 0) return <p className="text-xs text-muted-foreground">Sin habitaciones configuradas</p>;

  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? null : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Todas las habitaciones" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Todas las habitaciones</SelectItem>
        {roomTypes.map((rt) => (
          <SelectItem key={rt.id} value={rt.id}>
            {rt.name} — {rt.capacity} pers. — ${rt.base_price.toLocaleString()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Step8Lodgings({ links, onLinksChange, lodgingRequired, onLodgingRequiredChange }: Step8LodgingsProps) {
  const { data: lodgings, isLoading } = useAdminLodgings();
  const [selectedLodging, setSelectedLodging] = useState<string>("");

  const activeLodgings = lodgings?.filter((l) => l.is_active) || [];
  const linkedIds = links.map((l) => l.lodging_id);
  const availableLodgings = activeLodgings.filter((l) => !linkedIds.includes(l.id));

  const addLodging = () => {
    if (!selectedLodging) return;
    onLinksChange([
      ...links,
      { lodging_id: selectedLodging, room_type_id: null, is_default_option: links.length === 0, is_active: true },
    ]);
    setSelectedLodging("");
  };

  const removeLink = (index: number) => {
    const next = links.filter((_, i) => i !== index);
    // If we removed the default, make first one default
    if (next.length > 0 && !next.some((l) => l.is_default_option)) {
      next[0].is_default_option = true;
    }
    onLinksChange(next);
  };

  const updateLink = (index: number, patch: Partial<LodgingLink>) => {
    const next = links.map((l, i) => (i === index ? { ...l, ...patch } : l));
    // If setting as default, unset others
    if (patch.is_default_option) {
      next.forEach((l, i) => { if (i !== index) l.is_default_option = false; });
    }
    onLinksChange(next);
  };

  const getLodging = (id: string): AdminLodging | undefined => lodgings?.find((l) => l.id === id);

  const lodgingTypeLabel: Record<string, string> = {
    posada: "Posada", hotel: "Hotel", hostal: "Hostal",
    glamping: "Glamping", cabaña: "Cabaña", finca: "Finca",
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Cargando hospedajes…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Hotel className="h-5 w-5" /> Hospedajes vinculados
        </h3>
        <p className="text-sm text-muted-foreground">
          Asocia uno o más hospedajes a esta experiencia.
        </p>
      </div>

      {/* Required toggle */}
      {links.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Switch checked={lodgingRequired} onCheckedChange={onLodgingRequiredChange} />
          <div>
            <Label className="text-sm font-medium">Hospedaje obligatorio</Label>
            <p className="text-xs text-muted-foreground">
              {lodgingRequired
                ? "El usuario DEBE elegir un hospedaje para reservar esta experiencia."
                : "El hospedaje es opcional. El usuario puede reservar solo la experiencia."}
            </p>
          </div>
        </div>
      )}

      {/* Linked lodgings */}
      {links.length > 0 && (
        <div className="space-y-3">
          {links.map((link, idx) => {
            const lodging = getLodging(link.lodging_id);
            if (!lodging) return null;
            return (
              <Card key={idx} className={link.is_default_option ? "border-primary/50 bg-primary/5" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{lodging.name}</span>
                        <Badge variant="outline" className="text-xs">
                          <Building className="h-3 w-3 mr-1" />
                          {lodgingTypeLabel[lodging.lodging_type] || lodging.lodging_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{lodging.city}</Badge>
                        {link.is_default_option && (
                          <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                            <Star className="h-3 w-3 mr-1" /> Por defecto
                          </Badge>
                        )}
                      </div>
                      {lodging.short_description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lodging.short_description}</p>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(idx)} className="text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo de habitación</Label>
                      <RoomTypeSelector
                        lodgingId={link.lodging_id}
                        value={link.room_type_id}
                        onChange={(v) => updateLink(idx, { room_type_id: v })}
                      />
                    </div>
                    <div className="flex items-center gap-6 pt-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.is_default_option}
                          onCheckedChange={(v) => updateLink(idx, { is_default_option: v })}
                        />
                        <Label className="text-xs">Opción principal</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={(v) => updateLink(idx, { is_active: v })}
                        />
                        <Label className="text-xs">Activo</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add lodging */}
      {availableLodgings.length > 0 ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Agregar hospedaje</Label>
            <Select value={selectedLodging} onValueChange={setSelectedLodging}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hospedaje…" />
              </SelectTrigger>
              <SelectContent>
                {availableLodgings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} — {lodgingTypeLabel[l.lodging_type] || l.lodging_type} — {l.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={addLodging} disabled={!selectedLodging} className="gap-1">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      ) : links.length > 0 ? (
        <p className="text-sm text-muted-foreground">Todos los hospedajes activos están vinculados.</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay hospedajes activos. Crea uno primero en la pestaña "Hospedajes".
        </p>
      )}

      {links.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Esta experiencia se ofrecerá sin opción de hospedaje.
        </p>
      )}
    </div>
  );
}
