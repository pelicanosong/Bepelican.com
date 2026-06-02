import { useState, useEffect } from 'react';
import { Hotel, Users, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicLodgingOption } from '@/hooks/usePublicExperienceLodgings';
import { formatPrice } from '@/lib/formatPrice';

interface LodgingOptionsProps {
  options: PublicLodgingOption[];
  selectedLodgingLinkId: string | null;
  onSelect: (linkId: string | null) => void;
  required?: boolean;
}

const LODGING_TYPE_LABELS: Record<string, string> = {
  posada: 'Posada', hotel: 'Hotel', hostal: 'Hostal',
  glamping: 'Glamping', cabaña: 'Cabaña', finca: 'Finca',
};

const groupByLodging = (options: PublicLodgingOption[]) => {
  const map = new Map<string, { lodging: PublicLodgingOption['lodging']; options: PublicLodgingOption[] }>();
  for (const opt of options) {
    const key = opt.lodging_id;
    if (!map.has(key)) {
      map.set(key, { lodging: opt.lodging, options: [] });
    }
    map.get(key)!.options.push(opt);
  }
  return Array.from(map.values());
};

const LodgingOptions = ({ options, selectedLodgingLinkId, onSelect, required = false }: LodgingOptionsProps) => {
  // Auto-select default option when required
  useEffect(() => {
    if (required && !selectedLodgingLinkId && options.length > 0) {
      const defaultOpt = options.find(o => o.is_default_option);
      onSelect(defaultOpt ? defaultOpt.id : options[0].id);
    }
    // When optional, default to null (no lodging)
    if (!required && selectedLodgingLinkId === undefined) {
      onSelect(null);
    }
  }, [options, required]);

  if (options.length === 0) return null;

  const groups = groupByLodging(options);

  return (
    <div className="space-y-3">
      {/* Dynamic title based on required/optional */}
      <div>
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Hotel className="h-4 w-4" />
          {required ? 'Escoge tu hospedaje' : '¿Quieres agregar hospedaje?'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {required
            ? 'Selecciona la opción donde te vas a quedar durante la experiencia'
            : 'Mejora tu experiencia con una estadía seleccionada por BePelican'}
        </p>
      </div>

      <div className="space-y-2">
        {/* "Solo experiencia" — only when NOT required */}
        {!required && (
          <button
            onClick={() => onSelect(null)}
            className={cn(
              'w-full text-left px-3 py-3 rounded-lg border text-sm transition-colors flex items-center gap-3',
              selectedLodgingLinkId === null
                ? 'border-primary bg-primary/10 text-foreground font-medium'
                : 'border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            <span className={cn(
              'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
              selectedLodgingLinkId === null ? 'border-primary' : 'border-muted-foreground/40'
            )}>
              {selectedLodgingLinkId === null && <span className="w-2 h-2 rounded-full bg-primary" />}
            </span>
            <span>Solo experiencia (sin hospedaje)</span>
          </button>
        )}

        {/* Lodging options grouped by hotel */}
        {groups.map((group) => (
          <div key={group.lodging.id} className="border border-border rounded-lg overflow-hidden">
            {/* Hotel header */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
              {group.lodging.main_image_url && (
                <img
                  src={group.lodging.main_image_url}
                  alt={group.lodging.name}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground block truncate">{group.lodging.name}</span>
                <span className="text-xs text-muted-foreground">
                  {LODGING_TYPE_LABELS[group.lodging.lodging_type] || group.lodging.lodging_type} · {group.lodging.city}
                </span>
              </div>
            </div>

            {/* Room type options */}
            <div className="divide-y divide-border">
              {group.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-3',
                    selectedLodgingLinkId === opt.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/20'
                  )}
                >
                  {/* Radio indicator */}
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                    selectedLodgingLinkId === opt.id ? 'border-primary' : 'border-muted-foreground/40'
                  )}>
                    {selectedLodgingLinkId === opt.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>

                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'truncate',
                        selectedLodgingLinkId === opt.id ? 'text-foreground font-medium' : 'text-foreground'
                      )}>
                        {opt.room_type?.name || 'Habitación'}
                      </span>
                      {opt.is_default_option && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                          <Star className="h-2.5 w-2.5" /> Recomendado
                        </span>
                      )}
                      {opt.room_type && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                          <Users className="h-3 w-3" />{opt.room_type.capacity}
                        </span>
                      )}
                    </div>
                    {opt.room_type && (
                      <span className="text-sm font-medium text-foreground flex-shrink-0">
                        {formatPrice(opt.room_type.base_price)}
                        <span className="text-xs font-normal text-muted-foreground">/noche</span>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hint for optional */}
      {!required && selectedLodgingLinkId && (
        <p className="text-xs text-muted-foreground">
          El hospedaje se sumará al costo de tu experiencia.
        </p>
      )}
    </div>
  );
};

export default LodgingOptions;
