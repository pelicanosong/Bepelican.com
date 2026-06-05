import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClimateScenePresetRow = {
  key: string;
  briselda_destino: string;
  label_es: string;
  label_en: string | null;
  animation_config: Record<string, unknown>;
};

export function useClimateScenePresets() {
  return useQuery({
    queryKey: ['climate-scene-presets'],
    queryFn: async (): Promise<ClimateScenePresetRow[]> => {
      const { data, error } = await supabase
        .from('climate_scene_presets' as 'experiences')
        .select('key, briselda_destino, label_es, label_en, animation_config')
        .order('briselda_destino')
        .order('label_es');
      if (error) throw error;
      return (data ?? []) as ClimateScenePresetRow[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
