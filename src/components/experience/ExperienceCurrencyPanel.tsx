import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatPrice';
import { useMoniExchangeCopView } from '@/hooks/useMoniExchangeCopView';
import {
  buildConversionFormula,
  convertCopToQuote,
  CURRENCY_NAMES,
  formatConvertedAmount,
  formatCopPerUnit,
  sortCurrencyCodes,
} from '@/lib/moniConversion';
import {
  approxLongLabel,
  approxShortLabel,
  conversionPanelDisclaimer,
} from '@/lib/moniDisplayLabels';
import {
  ConvertedPrice,
  ConversionSourceFootnote,
} from '@/components/experience/ConversionPriceDisplay';
import { toast } from 'sonner';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';

export interface ExperienceCurrencyPanelProps {
  unitPriceCop?: number;
  subtotalCop?: number;
  totalCop: number;
  perPersonSuffix?: string;
  subtotalLabel?: string;
  totalLabel?: string;
  showUnitPrice?: boolean;
  /** Moneda controlada desde el padre (p. ej. barra móvil). */
  displayCurrency?: string;
  onDisplayCurrencyChange?: (code: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function ExperienceCurrencyPanel({
  unitPriceCop,
  subtotalCop,
  totalCop,
  perPersonSuffix,
  subtotalLabel,
  totalLabel,
  showUnitPrice = true,
  displayCurrency: controlledCurrency,
  onDisplayCurrencyChange,
  children,
  className,
}: ExperienceCurrencyPanelProps) {
  const { displayCurrency: contextCurrency, setDisplayCurrency: setContextCurrency } =
    useDisplayCurrency();
  const currency = controlledCurrency ?? contextCurrency;
  const setCurrency = onDisplayCurrencyChange ?? setContextCurrency;

  const moni = useMoniExchangeCopView();
  const hasRates = !!moni.data?.rates.length;
  const currencies = useMemo(
    () => (hasRates ? sortCurrencyCodes(moni.data!.rates.map((r) => r.quote_currency)) : ['COP']),
    [hasRates, moni.data]
  );

  const selectedRow = moni.data?.rates.find((r) => r.quote_currency === currency);
  const copPerUnit = selectedRow?.cop_per_unit;
  const rateDate = moni.data?.rateDate;
  const copUsdRate = moni.data?.copUsdRate;

  useEffect(() => {
    if (moni.isError || (!moni.isLoading && !hasRates)) {
      toast.message('Sin tasas de referencia', {
        description: 'Mostramos precios en COP. El pago sigue siendo en pesos colombianos.',
        id: 'moni-rates-unavailable',
      });
    }
  }, [moni.isError, moni.isLoading, hasRates]);

  useEffect(() => {
    if (currency !== 'COP' && !currencies.includes(currency)) {
      setCurrency('COP');
    }
  }, [currencies, currency, setCurrency]);

  const selectorDisabled = moni.isLoading || !hasRates;

  const formulaUnit =
    showUnitPrice && unitPriceCop != null && currency !== 'COP' && copPerUnit
      ? buildConversionFormula(unitPriceCop, currency, copPerUnit)
      : null;
  const formulaTotal =
    currency !== 'COP' && copPerUnit ? buildConversionFormula(totalCop, currency, copPerUnit) : null;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Ver precio en:</label>
        <Select value={currency} onValueChange={setCurrency} disabled={selectorDisabled}>
          <SelectTrigger className="w-full font-sans">
            <SelectValue placeholder="COP — Peso colombiano" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((code) => (
              <SelectItem key={code} value={code}>
                {code} — {CURRENCY_NAMES[code] ?? code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currency !== 'COP' && (
          <>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5 font-sans">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-bepelican-turquoise" />
              <span>{conversionPanelDisclaimer()}</span>
            </p>
            <ConversionSourceFootnote currency={currency} />
          </>
        )}
        {rateDate && (
          <p className="text-xs text-muted-foreground">
            Fecha de referencia:{' '}
            {format(new Date(rateDate + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        )}
      </div>

      {showUnitPrice && unitPriceCop != null && (
        <div className="flex items-baseline gap-2">
          <ConvertedPrice amountCop={unitPriceCop} currency={currency} variant="hero" />
          {perPersonSuffix && (
            <span className="text-muted-foreground">{perPersonSuffix}</span>
          )}
        </div>
      )}

      {children}

      {(subtotalCop != null || totalLabel) && (
        <div className="border-t border-border pt-4 space-y-2">
          {subtotalCop != null && subtotalLabel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{subtotalLabel}</span>
              <ConvertedPrice amountCop={subtotalCop} currency={currency} />
            </div>
          )}
          {totalLabel && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium">{totalLabel}</span>
              <ConvertedPrice amountCop={totalCop} currency={currency} variant="total" />
            </div>
          )}
        </div>
      )}

      <Collapsible className="rounded-lg border border-border bg-muted/30">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:text-bepelican-orange transition-colors">
          Cómo se calcula
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 text-xs text-muted-foreground space-y-2 font-sans">
          {currency === 'COP' ? (
            <p>Precio en pesos colombianos (COP). No se aplica conversión.</p>
          ) : !hasRates || !copPerUnit ? (
            <p>No hay tasa disponible para esta divisa. Usa COP.</p>
          ) : (
            <>
              <p className="text-foreground font-medium">{formatCopPerUnit(copPerUnit, currency)}</p>
              {copUsdRate != null && currency !== 'USD' && (
                <p>Referencia USD: 1 USD = {formatPrice(Math.round(copUsdRate))}</p>
              )}
              {formulaUnit && (
                <p>
                  <span className="text-foreground">Por persona: </span>
                  {formulaUnit}
                </p>
              )}
              {formulaTotal && (
                <p>
                  <span className="text-foreground">Total: </span>
                  {formulaTotal}
                </p>
              )}
              <p className="pt-1 border-t border-border/60">
                Fórmula: precio COP ÷ COP por 1 {currency} (columna <code className="text-[11px]">cop_per_unit</code>
                ).
              </p>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/** Precio unitario convertido para barra móvil (usa la misma moneda que el panel). */
export function MobileConvertedUnitPrice({
  unitPriceCop,
  currency,
}: {
  unitPriceCop: number;
  currency: string;
}) {
  const moni = useMoniExchangeCopView();
  const row = moni.data?.rates.find((r) => r.quote_currency === currency);
  const converted = convertCopToQuote(unitPriceCop, currency, row);

  if (currency === 'COP' || converted == null) {
    return <>{formatPrice(unitPriceCop)}</>;
  }
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span>{formatConvertedAmount(converted, currency)}</span>
      <span
        className="font-sans text-xs font-normal text-muted-foreground"
        aria-label={approxLongLabel()}
      >
        {approxShortLabel()}
      </span>
    </span>
  );
}

export { ConvertedPrice } from '@/components/experience/ConversionPriceDisplay';
