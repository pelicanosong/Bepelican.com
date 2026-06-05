import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { briseldaDb, type BriseldaDestinationWeather } from '@/integrations/supabase/briselda-client';
import type { BriseldaDestino, ClimateScenePresetKey } from '@/lib/briseldaDestino';

export type ExperienceClimateDisplay = {
  experience_id: string;
  slug: string;
  title: string;
  location_city: string;
  location_name: string;
  temperature_range: string | null;
  recommended_season: string | null;
  briselda_destino: string | null;
  climate_scene_preset: ClimateScenePresetKey | null;
  preset_label_es: string | null;
  preset_label_en: string | null;
  preset_animation_config: Record<string, unknown> | null;
  temperatura: number | null;
  sensacion_termica: number | null;
  humedad: number | null;
  weather_descripcion: string | null;
  viento_kmh: number | null;
  presion: number | null;
  visibilidad_m: number | null;
  icono: string | null;
  condicion_id: number | null;
  weather_lat: number | null;
  weather_lon: number | null;
  nubes_pct: number | null;
  weather_fetched_at: string | null;
  weather_snapshot_hour: string | null;
};

function mergeWeatherRow(
  row: ExperienceClimateDisplay,
  weather: BriseldaDestinationWeather | null,
): ExperienceClimateDisplay {
  if (!weather || row.sensacion_termica != null) return row;
  return {
    ...row,
    temperatura: weather.temperatura,
    sensacion_termica: weather.sensacion_termica,
    humedad: weather.humedad,
    weather_descripcion: weather.descripcion,
    viento_kmh: weather.viento_kmh,
    presion: weather.presion,
    visibilidad_m: weather.visibilidad_m,
    icono: weather.icono,
    condicion_id: weather.condicion_id,
    weather_lat: weather.lat,
    weather_lon: weather.lon,
    nubes_pct: weather.nubes_pct,
    weather_fetched_at: weather.fetched_at,
    weather_snapshot_hour: weather.snapshot_hour,
  };
}

export function useExperienceClimate(slug: string | undefined) {
  return useQuery({
    queryKey: ['experience-climate', slug],
    enabled: !!slug,
    retry: 1,
    throwOnError: false,
    queryFn: async (): Promise<ExperienceClimateDisplay | null> => {
      const { data, error } = await supabase
        .from('experience_climate_display' as 'experiences')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();

      if (error) {
        // Vista aún no desplegada: leer experiencia + clima por separado
        const { data: exp, error: expErr } = await supabase
          .from('experiences')
          .select(
            'id, slug, title, location_city, location_name, temperature_range, recommended_season, briselda_destino, climate_scene_preset',
          )
          .eq('slug', slug!)
          .maybeSingle();
        if (expErr || !exp) return null;

        let row: ExperienceClimateDisplay = {
          experience_id: exp.id,
          slug: exp.slug,
          title: exp.title,
          location_city: exp.location_city,
          location_name: exp.location_name,
          temperature_range: exp.temperature_range,
          recommended_season: exp.recommended_season,
          briselda_destino: (exp as { briselda_destino?: string }).briselda_destino ?? null,
          climate_scene_preset:
            ((exp as { climate_scene_preset?: string }).climate_scene_preset as ClimateScenePresetKey) ??
            null,
          preset_label_es: null,
          preset_label_en: null,
          preset_animation_config: null,
          temperatura: null,
          sensacion_termica: null,
          humedad: null,
          weather_descripcion: null,
          viento_kmh: null,
          presion: null,
          visibilidad_m: null,
          icono: null,
          condicion_id: null,
          weather_lat: null,
          weather_lon: null,
          nubes_pct: null,
          weather_fetched_at: null,
          weather_snapshot_hour: null,
        };

        if (row.briselda_destino) {
          const { data: w } = await briseldaDb
            .from('latest_destination_weather')
            .select('*')
            .eq('ciudad', row.briselda_destino)
            .maybeSingle();
          row = mergeWeatherRow(row, (w as BriseldaDestinationWeather | null) ?? null);
        }
        return row;
      }

      const row = (data as ExperienceClimateDisplay | null) ?? null;
      if (!row?.briselda_destino || row.sensacion_termica != null) return row;

      const { data: w } = await briseldaDb
        .from('latest_destination_weather')
        .select('*')
        .eq('ciudad', row.briselda_destino)
        .maybeSingle();

      return mergeWeatherRow(row, (w as BriseldaDestinationWeather | null) ?? null);
    },
    staleTime: 1000 * 60 * 15,
  });
}
