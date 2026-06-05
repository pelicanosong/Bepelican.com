/** Variante visual a partir del código OpenWeatherMap (p. ej. 04d, 10n). */
export type WeatherVisualVariant =
  | 'sun'
  | 'cloud-light'
  | 'cloud'
  | 'overcast'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'mist';

export function resolveWeatherVisual(icon: string | null | undefined): WeatherVisualVariant {
  if (!icon || icon.length < 2) return 'cloud';
  const code = icon.slice(0, 2);
  switch (code) {
    case '01':
      return 'sun';
    case '02':
      return 'cloud-light';
    case '03':
      return 'cloud';
    case '04':
      return 'overcast';
    case '09':
    case '10':
      return 'rain';
    case '11':
      return 'storm';
    case '13':
      return 'snow';
    case '50':
      return 'mist';
    default:
      return 'cloud';
  }
}
