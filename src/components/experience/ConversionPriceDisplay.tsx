import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatPrice';
import { useMoniExchangeCopView } from '@/hooks/useMoniExchangeCopView';
import {
  convertCopToQuote,
  formatConvertedAmount,
} from '@/lib/moniConversion';
import {
  approxLongLabel,
  approxShortLabel,
  conversionSourceLine,
  isNativeCopDisplay,
  showsApproximateConversion,
} from '@/lib/moniDisplayLabels';
import { Loader2 } from 'lucide-react';

type PriceVariant = 'hero' | 'body' | 'total';

interface ConvertedPriceProps {
  amountCop: number;
  currency: string;
  variant?: PriceVariant;
  className?: string;
  /** Mostrar línea de fuente debajo del precio (p. ej. panel). */
  showSource?: boolean;
}

export function ConversionSourceFootnote({
  currency,
  className,
}: {
  currency: string;
  className?: string;
}) {
  if (isNativeCopDisplay(currency)) return null;
  return (
    <p className={cn('font-sans text-xs text-muted-foreground', className)}>
      {conversionSourceLine()}
    </p>
  );
}

export function ConvertedPrice({
  amountCop,
  currency,
  variant = 'body',
  className,
  showSource = false,
}: ConvertedPriceProps) {
  const moni = useMoniExchangeCopView();
  const row = moni.data?.rates.find((r) => r.quote_currency === currency);
  const converted = convertCopToQuote(amountCop, currency, row);
  const isCop = isNativeCopDisplay(currency);
  const loading = moni.isLoading && !isCop;
  const showApprox =
    showsApproximateConversion(currency) && converted != null && !loading;

  const sizeClass =
    variant === 'hero'
      ? 'text-3xl font-bold'
      : variant === 'total'
        ? 'text-2xl font-bold'
        : 'text-foreground';

  if (loading) {
    return (
      <span
        className={cn(
          sizeClass,
          'inline-flex items-center gap-2 text-muted-foreground',
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {formatPrice(amountCop)}
      </span>
    );
  }

  const display =
    isCop || converted == null
      ? formatPrice(amountCop)
      : formatConvertedAmount(converted, currency);

  const priceEl = (
    <span
      className={cn(
        sizeClass,
        'text-foreground inline-flex items-baseline gap-1.5 flex-wrap',
        className
      )}
    >
      <span>{display}</span>
      {showApprox && (
        <span
          className="font-sans text-xs font-normal text-muted-foreground shrink-0"
          aria-label={approxLongLabel()}
        >
          {approxShortLabel()}
        </span>
      )}
    </span>
  );

  if (!showSource || !showApprox) return priceEl;

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      {priceEl}
      <ConversionSourceFootnote currency={currency} className="text-right" />
    </span>
  );
}
