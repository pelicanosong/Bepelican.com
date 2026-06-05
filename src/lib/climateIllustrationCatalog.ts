import type { ClimateScenePresetKey } from '@/lib/briseldaDestino';
import type { WeatherVisualVariant } from '@/lib/weatherVisual';

/** Ilustraciones 3D prehechas (Icons8 3D Fluency, alojadas en /public) */
export interface ClimateTerritoryIllustration {
  /** Ruta pública principal */
  src: string;
  altEs: string;
  altEn: string;
}

const BASE = '/climate-illustrations';

export const TERRITORY_ILLUSTRATIONS: Record<ClimateScenePresetKey, ClimateTerritoryIllustration> = {
  desierto_guajira: {
    src: `${BASE}/guajira.png`,
    altEs: 'Playa y sol — desierto y costa guajira',
    altEn: 'Beach and sun — Guajira desert coast',
  },
  sierra_costa: {
    src: `${BASE}/sierra.png`,
    altEs: 'Montaña y selva — Sierra Nevada y costa',
    altEn: 'Mountain and jungle — Sierra and coast',
  },
  andes_urbana: {
    src: `${BASE}/andes.png`,
    altEs: 'Ciudad en los Andes — Bogotá y Monserrate',
    altEn: 'Andean city — Bogotá and Monserrate',
  },
  barrio_urbana: {
    src: `${BASE}/barrio.png`,
    altEs: 'Barrio y hogar — tradición urbana',
    altEn: 'Neighborhood home — urban tradition',
  },
  nevado_alto: {
    src: `${BASE}/nevado.png`,
    altEs: 'Nieve y altura — Nevado del Cocuy',
    altEn: 'Snow and peaks — Nevado del Cocuy',
  },
  amazonia: {
    src: `${BASE}/amazonia.png`,
    altEs: 'Selva amazónica — ríos y bosque',
    altEn: 'Amazon rainforest — rivers and forest',
  },
};

const WEATHER_ILLUSTRATIONS: Partial<Record<WeatherVisualVariant, string>> = {
  sun: `${BASE}/wx-sun.png`,
  'cloud-light': `${BASE}/wx-cloud.png`,
  cloud: `${BASE}/wx-cloud.png`,
  overcast: `${BASE}/wx-cloud.png`,
  rain: `${BASE}/wx-rain.png`,
  storm: `${BASE}/wx-storm.png`,
  snow: `${BASE}/wx-snow.png`,
  mist: `${BASE}/wx-cloud.png`,
};

export function getTerritoryIllustration(preset: ClimateScenePresetKey): ClimateTerritoryIllustration {
  return TERRITORY_ILLUSTRATIONS[preset] ?? TERRITORY_ILLUSTRATIONS.sierra_costa;
}

export function getWeatherIllustration(variant: WeatherVisualVariant): string | null {
  return WEATHER_ILLUSTRATIONS[variant] ?? null;
}
