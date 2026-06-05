/** Textos de visualización de tasas Moni (aproximado, fuentes). Una sola fuente de verdad. */

export const MONI_SOURCE_BANREP = 'Banrep';
export const MONI_SOURCE_FRANKFURTER = 'Frankfurter';
export const MONI_PROVIDER_BLENDED = 'blended';

export function isNativeCopDisplay(currency: string): boolean {
  return currency === 'COP';
}

export function showsApproximateConversion(currency: string): boolean {
  return !isNativeCopDisplay(currency);
}

export function approxShortLabel(): string {
  return 'Aprox.';
}

export function approxLongLabel(): string {
  return 'Aproximado';
}

export function approxParenthetical(): string {
  return '(aprox.)';
}

/** Línea discreta de fuentes cuando hay conversión visible. */
export function conversionSourceLine(): string {
  return `Fuente: ${MONI_SOURCE_BANREP} · ${MONI_SOURCE_FRANKFURTER}`;
}

/** Pie del selector compacto (listados / home). */
export function compactSelectorFootnote(): string {
  return `Valores aproximados · ${conversionSourceLine()}`;
}

/** Aviso bajo el selector del panel de detalle / checkout. */
export function conversionPanelDisclaimer(): string {
  return `${approxLongLabel()} · Referencia ${MONI_SOURCE_BANREP} / ${MONI_SOURCE_FRANKFURTER} (solo visualización; el cobro es en COP).`;
}

export function currencyPerPersonApprox(currency: string): string {
  return `${currency} / persona ${approxParenthetical()}`;
}

/** Etiqueta legible desde filas daily_rates (source / provider). */
export function formatRateSourceName(source?: string | null, provider?: string | null): string {
  const s = (source ?? '').toLowerCase();
  if (s.includes('banrep')) return MONI_SOURCE_BANREP;
  if (s.includes('frankfurter')) {
    return provider === MONI_PROVIDER_BLENDED || !provider
      ? MONI_SOURCE_FRANKFURTER
      : `${MONI_SOURCE_FRANKFURTER} (${provider})`;
  }
  if (!source) return MONI_SOURCE_FRANKFURTER;
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/** Fuente por divisa: COP → Banrep; resto → Frankfurter (blended en ingestión). */
export function sourceLabelForQuoteCurrency(quoteCurrency: string): string {
  return quoteCurrency === 'COP' ? MONI_SOURCE_BANREP : MONI_SOURCE_FRANKFURTER;
}
