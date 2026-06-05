import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { useMoniExchangeCopView } from '@/hooks/useMoniExchangeCopView';
import { CURRENCY_NAMES, sortCurrencyCodes } from '@/lib/moniConversion';
import { compactSelectorFootnote } from '@/lib/moniDisplayLabels';

interface DisplayCurrencyCompactSelectorProps {
  className?: string;
  /** Etiqueta visible; omitir en layouts muy compactos. */
  showLabel?: boolean;
}

/** Selector compacto para listados (home, catálogo). Persiste en sessionStorage vía contexto. */
export function DisplayCurrencyCompactSelector({
  className,
  showLabel = true,
}: DisplayCurrencyCompactSelectorProps) {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const moni = useMoniExchangeCopView();
  const hasRates = !!moni.data?.rates.length;
  const currencies = useMemo(
    () => (hasRates ? sortCurrencyCodes(moni.data!.rates.map((r) => r.quote_currency)) : ['COP']),
    [hasRates, moni.data]
  );

  useEffect(() => {
    if (displayCurrency !== 'COP' && !currencies.includes(displayCurrency)) {
      setDisplayCurrency('COP');
    }
  }, [currencies, displayCurrency, setDisplayCurrency]);

  const disabled = moni.isLoading || !hasRates;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        {showLabel && (
          <span className="font-sans text-xs text-muted-foreground shrink-0">Ver precios en:</span>
        )}
        <Select value={displayCurrency} onValueChange={setDisplayCurrency} disabled={disabled}>
          <SelectTrigger
            className="h-10 w-full sm:h-8 sm:w-[130px] font-sans text-xs border-bepelican-beige/60 bg-card/80"
            aria-label="Moneda de visualización"
          >
            {moni.isLoading ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                COP
              </span>
            ) : (
              <SelectValue placeholder="COP" />
            )}
          </SelectTrigger>
          <SelectContent>
            {currencies.map((code) => (
              <SelectItem key={code} value={code} className="font-sans text-xs">
                {code} — {CURRENCY_NAMES[code] ?? code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="font-sans text-[10px] leading-snug text-muted-foreground max-w-[280px]">
        {compactSelectorFootnote()}
      </p>
    </div>
  );
}
