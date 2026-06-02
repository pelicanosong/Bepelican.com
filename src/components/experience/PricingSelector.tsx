import { useState, useEffect, useMemo } from 'react';
import { MapPin, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingRule } from '@/hooks/usePricingRules';
import { formatPrice } from '@/lib/formatPrice';

interface PricingSelectorProps {
  pricingType: string;
  rules: PricingRule[];
  participants: number;
  basePrice: number;
  onPriceChange: (price: number, selectedRule?: PricingRule) => void;
  onSelectionChange?: (origin: string | null, accommodation: string | null) => void;
}

const PricingSelector = ({
  pricingType,
  rules,
  participants,
  basePrice,
  onPriceChange,
  onSelectionChange,
}: PricingSelectorProps) => {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string | null>(null);

  // Filter out rules with price 0 (placeholder rows)
  const activeRules = useMemo(() => rules.filter((r) => r.price > 0), [rules]);

  // Derive unique origins and accommodations
  const origins = useMemo(
    () => [...new Set(activeRules.map((r) => r.origin_label).filter(Boolean))] as string[],
    [activeRules]
  );
  const accommodations = useMemo(
    () => [...new Set(activeRules.map((r) => r.label).filter(Boolean))],
    [activeRules]
  );

  // Auto-select first option
  useEffect(() => {
    if (pricingType === 'per_origin_accommodation' || pricingType === 'per_origin') {
      if (origins.length > 0 && !selectedOrigin) setSelectedOrigin(origins[0]);
    }
    if (pricingType === 'per_origin_accommodation' || pricingType === 'per_accommodation') {
      if (accommodations.length > 0 && !selectedAccommodation) setSelectedAccommodation(accommodations[0]);
    }
  }, [origins, accommodations, pricingType, selectedOrigin, selectedAccommodation]);

  // Find matching rule and update price
  useEffect(() => {
    let matchedRule: PricingRule | undefined;

    if (pricingType === 'per_origin_accommodation') {
      matchedRule = activeRules.find(
        (r) => r.origin_label === selectedOrigin && r.label === selectedAccommodation
      );
    } else if (pricingType === 'per_origin') {
      matchedRule = activeRules.find((r) => r.origin_label === selectedOrigin);
    } else if (pricingType === 'per_accommodation') {
      matchedRule = activeRules.find((r) => r.label === selectedAccommodation);
    } else if (pricingType === 'per_person') {
      matchedRule = activeRules.find(
        (r) => (!r.min_pax || participants >= r.min_pax) && (!r.max_pax || participants <= r.max_pax)
      );
    }

    if (matchedRule) {
      onPriceChange(matchedRule.price, matchedRule);
    } else if (pricingType === 'fixed' || activeRules.length === 0) {
      onPriceChange(basePrice);
    }

    onSelectionChange?.(selectedOrigin, selectedAccommodation);
  }, [selectedOrigin, selectedAccommodation, participants, activeRules, pricingType, basePrice]);

  // Don't render for fixed pricing with no rules
  if (pricingType === 'fixed' && activeRules.length === 0) return null;

  // Per person: show tiers info only
  if (pricingType === 'per_person') {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Precios por persona</label>
        <div className="space-y-1.5">
          {activeRules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                'flex justify-between text-sm px-3 py-2 rounded-md border',
                participants >= (rule.min_pax || 0) && participants <= (rule.max_pax || 999)
                  ? 'border-primary bg-primary/5 text-foreground font-medium'
                  : 'border-border text-muted-foreground'
              )}
            >
              <span>{rule.label}</span>
              <span>{formatPrice(rule.price)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Origin selector */}
      {(pricingType === 'per_origin' || pricingType === 'per_origin_accommodation') && origins.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <MapPin className="inline-block h-4 w-4 mr-1" />
            Ciudad de origen
          </label>
          <div className="grid grid-cols-1 gap-2">
            {origins.map((origin) => (
              <button
                key={origin}
                onClick={() => setSelectedOrigin(origin)}
                className={cn(
                  'text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  selectedOrigin === origin
                    ? 'border-primary bg-primary/10 text-foreground font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {origin}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Accommodation selector */}
      {(pricingType === 'per_accommodation' || pricingType === 'per_origin_accommodation') && accommodations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Home className="inline-block h-4 w-4 mr-1" />
            Acomodación
          </label>
          <div className="grid grid-cols-1 gap-2">
            {accommodations.map((acc) => {
              // Find the price for this accommodation with the selected origin
              const matchingRule = activeRules.find(
                (r) =>
                  r.label === acc &&
                  (pricingType === 'per_accommodation' || r.origin_label === selectedOrigin)
              );
              return (
                <button
                  key={acc}
                  onClick={() => setSelectedAccommodation(acc)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors',
                    selectedAccommodation === acc
                      ? 'border-primary bg-primary/10 text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <span>{acc}</span>
                  {matchingRule && (
                    <span className="text-xs">{formatPrice(matchingRule.price)}/persona</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingSelector;
