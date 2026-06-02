import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { useLodgingSeasons, useRoomSeasonRates } from '@/hooks/useAdminLodgingSeasons';

interface LocalSeason {
  tempId: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface LocalRate {
  seasonTempId: string;
  room_type_id: string;
  pricing_mode: 'per_room' | 'per_person';
  price: number;
}

interface RoomTypeInfo {
  id: string;
  name: string;
}

interface LodgingSeasonsEditorProps {
  lodgingId?: string;
  roomTypes: RoomTypeInfo[];
  seasons: LocalSeason[];
  onSeasonsChange: (seasons: LocalSeason[]) => void;
  rates: LocalRate[];
  onRatesChange: (rates: LocalRate[]) => void;
}

const SEASON_PRESETS = ['Top', 'Alta', 'Media', 'Baja'];

export function LodgingSeasonsEditor({
  lodgingId,
  roomTypes,
  seasons,
  onSeasonsChange,
  rates,
  onRatesChange,
}: LodgingSeasonsEditorProps) {
  const { data: existingSeasons } = useLodgingSeasons(lodgingId);
  const { data: existingRates } = useRoomSeasonRates(lodgingId);
  const [initialized, setInitialized] = useState(false);

  // Load existing data when editing
  useEffect(() => {
    if (initialized || !lodgingId) return;
    if (existingSeasons && existingRates) {
      const loadedSeasons: LocalSeason[] = existingSeasons.map(s => ({
        tempId: s.id,
        name: s.name,
        start_date: s.start_date,
        end_date: s.end_date,
      }));
      const loadedRates: LocalRate[] = existingRates.map(r => ({
        seasonTempId: r.season_id,
        room_type_id: r.room_type_id,
        pricing_mode: r.pricing_mode as 'per_room' | 'per_person',
        price: r.price,
      }));
      onSeasonsChange(loadedSeasons);
      onRatesChange(loadedRates);
      setInitialized(true);
    }
  }, [existingSeasons, existingRates, lodgingId, initialized]);

  // Reset initialized when lodgingId changes
  useEffect(() => { setInitialized(false); }, [lodgingId]);

  const addSeason = () => {
    onSeasonsChange([...seasons, {
      tempId: crypto.randomUUID(),
      name: '',
      start_date: '',
      end_date: '',
    }]);
  };

  const updateSeason = (tempId: string, field: keyof LocalSeason, value: string) => {
    onSeasonsChange(seasons.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));
  };

  const removeSeason = (tempId: string) => {
    onSeasonsChange(seasons.filter(s => s.tempId !== tempId));
    onRatesChange(rates.filter(r => r.seasonTempId !== tempId));
  };

  const getRate = (seasonTempId: string, roomTypeId: string) => {
    return rates.find(r => r.seasonTempId === seasonTempId && r.room_type_id === roomTypeId);
  };

  const setRate = (seasonTempId: string, roomTypeId: string, field: 'pricing_mode' | 'price', value: any) => {
    const existing = rates.find(r => r.seasonTempId === seasonTempId && r.room_type_id === roomTypeId);
    if (existing) {
      onRatesChange(rates.map(r =>
        r.seasonTempId === seasonTempId && r.room_type_id === roomTypeId
          ? { ...r, [field]: value }
          : r
      ));
    } else {
      onRatesChange([...rates, {
        seasonTempId,
        room_type_id: roomTypeId,
        pricing_mode: field === 'pricing_mode' ? value : 'per_room',
        price: field === 'price' ? value : 0,
      }]);
    }
  };

  if (roomTypes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Agrega al menos un tipo de habitación para configurar temporadas y tarifas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Temporadas y Tarifas
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addSeason}>
          <Plus className="h-4 w-4 mr-2" /> Agregar temporada
        </Button>
      </div>

      {seasons.map((season) => (
        <Card key={season.tempId}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{season.name || 'Nueva temporada'}</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSeason(season.tempId)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Season info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Select value={season.name} onValueChange={v => updateSeason(season.tempId, 'name', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {SEASON_PRESETS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha inicio</Label>
                <Input type="date" value={season.start_date} onChange={e => updateSeason(season.tempId, 'start_date', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha fin</Label>
                <Input type="date" value={season.end_date} onChange={e => updateSeason(season.tempId, 'end_date', e.target.value)} />
              </div>
            </div>

            {/* Rates matrix: one row per room type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Tarifas por habitación</Label>
              <div className="space-y-2">
                {roomTypes.map(rt => {
                  const rate = getRate(season.tempId, rt.id);
                  return (
                    <div key={rt.id} className="grid grid-cols-[1fr_120px_140px] gap-2 items-center">
                      <span className="text-sm truncate">{rt.name}</span>
                      <Select
                        value={rate?.pricing_mode || 'per_room'}
                        onValueChange={v => setRate(season.tempId, rt.id, 'pricing_mode', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_room">Por habitación</SelectItem>
                          <SelectItem value="per_person">Por persona</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs"
                        placeholder="Precio COP"
                        value={rate?.price ?? ''}
                        onChange={e => setRate(season.tempId, rt.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {seasons.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay temporadas configuradas. Las tarifas usarán el precio base de cada habitación.
        </p>
      )}
    </div>
  );
}
