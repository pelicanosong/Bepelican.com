import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExperienceAvailability } from '@/hooks/useExperienceAvailability';
import { useBlockedDates } from '@/hooks/useBlockedDates';
import type { CalendarPrice } from '@/hooks/useLodgingCalendarPrices';

interface AvailabilityCalendarProps {
  experienceId: string;
  availableDays: string[] | null;
  maxParticipants: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  requestedParticipants: number;
  /** Precios dinámicos por fecha — si existe y un día NO tiene entrada, se bloquea */
  lodgingPrices?: Map<string, CalendarPrice>;
  /** Callback al cambiar de mes (para re-fetch precios) */
  onMonthChange?: (month: Date) => void;
  /** Celdas más compactas para sheets móviles */
  compact?: boolean;
}

const AvailabilityCalendar = ({
  experienceId,
  availableDays,
  maxParticipants,
  selectedDate,
  onSelectDate,
  requestedParticipants,
  lodgingPrices,
  onMonthChange,
  compact = false,
}: AvailabilityCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const { data: availability, isLoading } = useExperienceAvailability(
    experienceId,
    availableDays,
    maxParticipants,
    3
  );

  const { data: blockedDates = [] } = useBlockedDates(experienceId);
  const blockedSet = useMemo(() => {
    return new Set(blockedDates.map((bd) => bd.blocked_date));
  }, [blockedDates]);

  // Create a map for quick lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, {
      isAvailable: boolean;
      isValidDay: boolean;
      remainingSpots: number;
    }>();
    
    availability?.forEach((day) => {
      map.set(day.dateString, {
        isAvailable: day.isAvailable && day.remainingSpots >= requestedParticipants,
        isValidDay: day.isValidDay,
        remainingSpots: day.remainingSpots
      });
    });
    
    return map;
  }, [availability, requestedParticipants]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get empty cells for the first week
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (isSameMonth(prev, new Date()) || prev > new Date()) {
      setCurrentMonth(prev);
      onMonthChange?.(prev);
    }
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    const maxMonth = addMonths(new Date(), 2);
    if (next <= maxMonth) {
      setCurrentMonth(next);
      onMonthChange?.(next);
    }
  };

  const canGoPrev = !isSameMonth(currentMonth, new Date());
  const canGoNext = currentMonth < addMonths(new Date(), 2);

  const getDayStatus = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayData = availabilityMap.get(dateString);
    const isPast = isBefore(date, today);

    if (isPast) return { status: 'past', spots: 0 };
    if (blockedSet.has(dateString)) return { status: 'blocked', spots: 0 };
    if (!dayData) return { status: 'loading', spots: 0 };
    if (!dayData.isValidDay) return { status: 'unavailable', spots: 0 };
    if (!dayData.isAvailable) return { status: 'full', spots: 0 };

    // Si hay precios de hospedaje configurados, bloquear días sin tarifa
    if (lodgingPrices && !lodgingPrices.has(dateString)) {
      return { status: 'unavailable', spots: 0 };
    }
    
    // Available with spots
    const spotsRatio = dayData.remainingSpots / maxParticipants;
    if (spotsRatio <= 0.2) return { status: 'few', spots: dayData.remainingSpots };
    return { status: 'available', spots: dayData.remainingSpots };
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className={cn(
            'min-h-11 min-w-11 flex items-center justify-center rounded-full transition-all',
            canGoPrev
              ? 'hover:bg-muted text-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h3 className="font-medium text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          aria-label="Mes siguiente"
          className={cn(
            'min-h-11 min-w-11 flex items-center justify-center rounded-full transition-all',
            canGoNext
              ? 'hover:bg-muted text-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className={cn(
              'py-2 text-center font-medium text-muted-foreground',
              compact ? 'text-[10px] py-1' : 'text-xs'
            )}
          >
            {compact ? day.charAt(0) : day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className={cn('grid grid-cols-7 gap-px bg-border/50', compact ? 'p-0.5' : 'p-1')}>
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-card" />
        ))}

        {days.map((day) => {
          const dateString = format(day, 'yyyy-MM-dd');
          const { status, spots } = getDayStatus(day);
          const isSelected = selectedDate === dateString;
          const isTodayDate = isToday(day);
          const isClickable = status === 'available' || status === 'few';

          // Precio dinámico del día (si hay hospedaje con temporadas)
          const dayPrice = lodgingPrices?.get(dateString);
          const formatShortPrice = (p: number) => {
            if (p >= 1000000) return `${(p / 1000000).toFixed(1)}M`;
            if (p >= 1000) return `${Math.round(p / 1000)}k`;
            return p.toString();
          };

          return (
            <button
              key={dateString}
              type="button"
              onClick={() => isClickable && onSelectDate(dateString)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center justify-center relative bg-card transition-all rounded-md',
                compact ? 'h-10 m-0.5' : 'aspect-square m-0.5',
                status === 'past' && "text-muted-foreground/30 cursor-not-allowed",
                status === 'unavailable' && "text-muted-foreground/40 cursor-not-allowed bg-muted/20",
                status === 'blocked' && "text-destructive/60 cursor-not-allowed bg-destructive/10 line-through",
                status === 'full' && "text-destructive/60 cursor-not-allowed bg-destructive/5",
                status === 'few' && "text-warning hover:bg-warning/10 cursor-pointer",
                status === 'available' && "text-foreground hover:bg-primary/10 cursor-pointer",
                status === 'loading' && "text-muted-foreground/50",
                isSelected && isClickable && "ring-2 ring-primary bg-primary text-primary-foreground hover:bg-primary",
                isTodayDate && !isSelected && "font-bold"
              )}
            >
              <span className={cn(
                "text-xs leading-tight",
                isTodayDate && !isSelected && "underline underline-offset-2"
              )}>
                {format(day, 'd')}
              </span>

              {/* Precio por noche del hospedaje */}
              {dayPrice && isClickable && (
                <span className={cn(
                  "text-[9px] leading-tight font-medium",
                  isSelected ? "text-primary-foreground/80" : "text-primary/70"
                )}>
                  {formatShortPrice(dayPrice.pricePerNight)}
                </span>
              )}
              
              {/* Availability indicator */}
              {(status === 'available' || status === 'few') && !isSelected && !dayPrice && (
                <span className={cn(
                  "absolute bottom-0.5 w-1.5 h-1.5 rounded-full",
                  status === 'available' && "bg-success",
                  status === 'few' && "bg-warning"
                )} />
              )}
              
              {(status === 'full' || status === 'blocked') && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span>Últimos cupos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span>Agotado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <span>No disponible</span>
          </div>
        </div>
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="px-4 py-3 border-t border-border bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(selectedDate + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              {availabilityMap.get(selectedDate) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users className="h-3 w-3" />
                  {availabilityMap.get(selectedDate)!.remainingSpots} cupos disponibles
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
