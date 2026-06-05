import { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import SearchBar, { type SearchBarInitialValues } from './SearchBar';

interface MobileSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: SearchBarInitialValues;
}

function formatTriggerDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? format(parsed, "d MMM", { locale: es }) : null;
}

/** Compact trigger button + bottom sheet with stacked search form. */
interface MobileSearchTriggerProps {
  initialValues?: SearchBarInitialValues;
  className?: string;
  /** Controlled open state (optional — uses internal state when omitted). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileSearchTrigger({
  initialValues,
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: MobileSearchTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const city = initialValues?.destination;
  const dateLabel = formatTriggerDate(initialValues?.date);
  const guests = initialValues?.guests;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card',
          'px-4 py-3.5 shadow-md text-left transition-shadow hover:shadow-lg',
          'min-h-11',
          className
        )}
        aria-label="Buscar experiencias"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bepelican-orange">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium text-foreground truncate">
            {city || '¿A dónde quieres ir?'}
          </p>
          <p className="font-sans text-xs text-muted-foreground truncate flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {dateLabel || 'Cualquier fecha'}
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 shrink-0" />
              {guests ? `${guests} pers.` : 'Participantes'}
            </span>
          </p>
        </div>
        {city && (
          <MapPin className="h-4 w-4 shrink-0 text-bepelican-turquoise" aria-hidden />
        )}
      </button>

      <MobileSearchSheet open={open} onOpenChange={setOpen} initialValues={initialValues} />
    </>
  );
}

export function MobileSearchSheet({ open, onOpenChange, initialValues }: MobileSearchSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] rounded-t-2xl p-0 flex flex-col [&>button.absolute]:hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0 text-left">
          <SheetTitle className="font-display text-xl text-foreground">Buscar experiencias</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 px-6 py-4">
          <SearchBar
            variant="stacked"
            initialValues={initialValues}
            onSearchComplete={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileSearchSheet;
