/** Ciudades canónicas alineadas con n8n Briselda / destination_weather.ciudad */
export const BRISELDA_DESTINOS = [
  'El Cocuy',
  'Santa Marta',
  'Leticia',
  'Riohacha',
  'Bogota',
] as const;

export type BriseldaDestino = (typeof BRISELDA_DESTINOS)[number];

export type ClimateScenePresetKey =
  | 'sierra_costa'
  | 'andes_urbana'
  | 'barrio_urbana'
  | 'desierto_guajira'
  | 'nevado_alto'
  | 'amazonia';

export type ThermalBand = 'frio' | 'fresco' | 'templado' | 'calido' | 'caluroso';

const CITY_ALIASES: Record<string, BriseldaDestino> = {
  bogota: 'Bogota',
  bogotá: 'Bogota',
  'bogota dc': 'Bogota',
  'bogotá dc': 'Bogota',
  'bogota d.c.': 'Bogota',
  'santa marta': 'Santa Marta',
  leticia: 'Leticia',
  riohacha: 'Riohacha',
  'la guajira': 'Riohacha',
  guajira: 'Riohacha',
  cocuy: 'El Cocuy',
  'el cocuy': 'El Cocuy',
  'nevado del cocuy': 'El Cocuy',
};

/** Preset por defecto al elegir destino en admin */
export const DEFAULT_PRESET_BY_DESTINO: Record<BriseldaDestino, ClimateScenePresetKey> = {
  'Santa Marta': 'sierra_costa',
  Bogota: 'andes_urbana',
  Leticia: 'amazonia',
  Riohacha: 'desierto_guajira',
  'El Cocuy': 'nevado_alto',
};

export function normalizeCity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveBriseldaDestino(
  locationCity: string | null | undefined,
  briseldaDestino?: string | null,
): BriseldaDestino | null {
  if (briseldaDestino && BRISELDA_DESTINOS.includes(briseldaDestino as BriseldaDestino)) {
    return briseldaDestino as BriseldaDestino;
  }
  if (!locationCity?.trim()) return null;
  const key = normalizeCity(locationCity);
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  for (const dest of BRISELDA_DESTINOS) {
    if (normalizeCity(dest) === key) return dest;
  }
  return null;
}

export function getThermalBand(sensacionTermica: number): ThermalBand {
  if (sensacionTermica < 12) return 'frio';
  if (sensacionTermica < 18) return 'fresco';
  if (sensacionTermica < 24) return 'templado';
  if (sensacionTermica < 30) return 'calido';
  return 'caluroso';
}

export function openWeatherIconUrl(icon: string | null | undefined): string | null {
  if (!icon) return null;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function formatWeatherAge(fetchedAt: string | null | undefined, locale: string): string | null {
  if (!fetchedAt) return null;
  const then = new Date(fetchedAt).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (locale.startsWith('en')) {
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const h = Math.floor(mins / 60);
    return `${h} h ago`;
  }
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.floor(mins / 60);
  return `hace ${h} h`;
}
