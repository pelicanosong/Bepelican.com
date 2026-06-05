import { formatPrice } from '@/lib/formatPrice';
import type { MoniDailyRateCop } from '@/integrations/supabase/moni-client';

export const DISPLAY_CURRENCY_ORDER = [
  'COP',
  'USD',
  'EUR',
  'GBP',
  'MXN',
  'CAD',
  'BRL',
  'CLP',
  'ARS',
] as const;

export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCY_ORDER)[number] | string;

export const CURRENCY_NAMES: Record<string, string> = {
  COP: 'Peso colombiano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  MXN: 'Peso mexicano',
  CAD: 'Dólar canadiense',
  BRL: 'Real brasileño',
  CLP: 'Peso chileno',
  ARS: 'Peso argentino',
};

const foreignFormatterCache = new Map<string, Intl.NumberFormat>();

function getForeignFormatter(code: string, decimals: number): Intl.NumberFormat {
  const key = `${code}:${decimals}`;
  let fmt = foreignFormatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    foreignFormatterCache.set(key, fmt);
  }
  return fmt;
}

export function currencyDecimals(code: string): number {
  return code === 'COP' || code === 'CLP' ? 0 : 2;
}

export function sortCurrencyCodes(codes: string[]): string[] {
  const set = new Set(codes);
  const ordered = DISPLAY_CURRENCY_ORDER.filter((c) => set.has(c));
  const rest = [...set].filter((c) => !DISPLAY_CURRENCY_ORDER.includes(c as (typeof DISPLAY_CURRENCY_ORDER)[number])).sort();
  return [...ordered, ...rest];
}

/** Convierte un monto en COP a la divisa elegida (sin invertir la tasa). */
export function convertCopToQuote(
  priceCop: number,
  quoteCurrency: string,
  row: MoniDailyRateCop | undefined
): number | null {
  if (quoteCurrency === 'COP') return priceCop;
  if (!row || row.cop_per_unit <= 0) return null;
  return priceCop / row.cop_per_unit;
}

export function formatConvertedAmount(amount: number, currency: string): string {
  if (currency === 'COP') return formatPrice(amount);
  const decimals = currencyDecimals(currency);
  try {
    return getForeignFormatter(currency, decimals).format(amount);
  } catch {
    return `${amount.toFixed(decimals)} ${currency}`;
  }
}

export function formatCopPerUnit(copPerUnit: number, quoteCurrency: string): string {
  const rounded = Math.round(copPerUnit);
  return `1 ${quoteCurrency} = ${formatPrice(rounded).replace(/\s/g, ' ')}`;
}

export function buildConversionFormula(
  priceCop: number,
  quoteCurrency: string,
  copPerUnit: number
): string {
  if (quoteCurrency === 'COP' || copPerUnit <= 0) return '';
  const converted = priceCop / copPerUnit;
  const copStr = formatPrice(priceCop);
  const rateStr = `${Math.round(copPerUnit).toLocaleString('es-CO')} COP/${quoteCurrency}`;
  const resultStr = formatConvertedAmount(converted, quoteCurrency);
  return `${copStr} ÷ ${rateStr} ≈ ${resultStr}`;
}
