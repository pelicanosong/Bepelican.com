import { cn } from '@/lib/utils';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { ConvertedPrice } from '@/components/experience/ConversionPriceDisplay';

type PriceVariant = 'hero' | 'body' | 'total' | 'card';

interface ExperiencePriceWithCurrencyProps {
  amountCop: number;
  variant?: PriceVariant;
  className?: string;
}

const variantClass: Record<PriceVariant, string> = {
  hero: 'text-3xl font-bold',
  body: 'text-foreground',
  total: 'text-2xl font-bold',
  card: 'text-lg font-medium tabular-nums',
};

/** Precio convertido según la moneda elegida en el sitio (solo visualización). */
export function ExperiencePriceWithCurrency({
  amountCop,
  variant = 'body',
  className,
}: ExperiencePriceWithCurrencyProps) {
  const { displayCurrency } = useDisplayCurrency();
  const mappedVariant = variant === 'card' ? 'body' : variant;

  return (
    <ConvertedPrice
      amountCop={amountCop}
      currency={displayCurrency}
      variant={mappedVariant}
      className={cn(variant === 'card' && variantClass.card, className)}
    />
  );
}
