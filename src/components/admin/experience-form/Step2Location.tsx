import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExperienceFormData } from './types';
import { COLOMBIA_DEPARTMENTS, ENVIRONMENT_TYPES } from './types';
import { BRISELDA_DESTINOS, DEFAULT_PRESET_BY_DESTINO, resolveBriseldaDestino } from '@/lib/briseldaDestino';
import type { BriseldaDestino } from '@/lib/briseldaDestino';
import { useClimateScenePresets } from '@/hooks/useClimateScenePresets';

const AUTO_VALUE = '__auto__';
const NONE_VALUE = '__none__';

interface Step2Props {
  form: UseFormReturn<ExperienceFormData>;
}

export function Step2Location({ form }: Step2Props) {
  const { data: presets = [] } = useClimateScenePresets();
  const locationCity = form.watch('location_city');
  const briseldaDestino = form.watch('briselda_destino');

  useEffect(() => {
    const currentDest = form.getValues('briselda_destino');
    const currentPreset = form.getValues('climate_scene_preset');
    if (currentDest && currentPreset) return;

    const detected = resolveBriseldaDestino(locationCity, null);
    if (!detected) return;

    if (!currentDest) {
      form.setValue('briselda_destino', detected, { shouldDirty: true });
    }
    if (!currentPreset) {
      form.setValue('climate_scene_preset', DEFAULT_PRESET_BY_DESTINO[detected], {
        shouldDirty: true,
      });
    }
  }, [locationCity, form]);

  const filteredPresets = briseldaDestino
    ? presets.filter((p) => p.briselda_destino === briseldaDestino)
    : presets;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Ubicación</h3>
        <p className="text-sm text-muted-foreground">¿Dónde se realiza esta experiencia?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location_department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COLOMBIA_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad / Municipio *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Santa Marta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField control={form.control} name="location_name" render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre del lugar *</FormLabel>
          <FormControl>
            <Input
              placeholder="Ej: Finca La Esperanza, Parque Tayrona, Vereda El Carmen"
              {...field}
            />
          </FormControl>
          <FormDescription>
            El nombre específico del sitio: finca, vereda, barrio, parque, etc.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Clima Briselda</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Vincula la experiencia al clima en vivo y a la escena animada del destino.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="briselda_destino"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destino clima (Briselda)</FormLabel>
                <Select
                  value={field.value || AUTO_VALUE}
                  onValueChange={(v) => {
                    if (v === AUTO_VALUE) {
                      const detected = resolveBriseldaDestino(form.getValues('location_city'), null);
                      field.onChange(detected ?? '');
                      if (detected) {
                        form.setValue(
                          'climate_scene_preset',
                          DEFAULT_PRESET_BY_DESTINO[detected as BriseldaDestino],
                        );
                      }
                      return;
                    }
                    if (v === NONE_VALUE) {
                      field.onChange('');
                      form.setValue('climate_scene_preset', '');
                      return;
                    }
                    field.onChange(v);
                    form.setValue(
                      'climate_scene_preset',
                      DEFAULT_PRESET_BY_DESTINO[v as BriseldaDestino],
                    );
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={AUTO_VALUE}>Detectar automático</SelectItem>
                    <SelectItem value={NONE_VALUE}>Sin clima en vivo</SelectItem>
                    {BRISELDA_DESTINOS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="climate_scene_preset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escena animada</FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={!briseldaDestino}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={briseldaDestino ? 'Seleccionar...' : 'Elige destino primero'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredPresets.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label_es}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField control={form.control} name="environment_type" render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
        const toggle = (val: string) => {
          const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val];
          field.onChange(next);
        };
        return (
          <FormItem>
            <FormLabel>Tipo de entorno</FormLabel>
            <FormDescription>Puedes seleccionar varios</FormDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {ENVIRONMENT_TYPES.map((env) => {
                const isSelected = selected.includes(env.value);
                return (
                  <button
                    key={env.value}
                    type="button"
                    onClick={() => toggle(env.value)}
                    className={`px-4 py-2 rounded-full border text-sm transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary font-medium'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {env.label}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }} />
    </div>
  );
}
