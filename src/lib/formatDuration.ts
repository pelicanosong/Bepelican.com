/**
 * Format duration based on unit, with smart display:
 * - 120 minutes → "2 horas"
 * - 90 minutes → "1 h 30 min"
 * - 3 days → "3 días"
 */
export function formatDuration(
  value: number,
  unit: 'minutes' | 'hours' | 'days' = 'minutes'
): string {
  if (unit === 'days') {
    return value === 1 ? '1 día' : `${value} días`;
  }

  // Convert to minutes for smart formatting
  const totalMinutes = unit === 'hours' ? value * 60 : value;

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) {
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }

  return `${hours} h ${mins} min`;
}

/**
 * Convert a duration value to minutes for storage.
 */
export function toMinutes(value: number, unit: 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'hours': return value * 60;
    case 'days': return value * 60 * 24;
    default: return value;
  }
}

/**
 * Convert minutes to the best display value for a given unit.
 */
export function fromMinutes(minutes: number, unit: 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'hours': return Math.round((minutes / 60) * 100) / 100;
    case 'days': return Math.round((minutes / (60 * 24)) * 100) / 100;
    default: return minutes;
  }
}
