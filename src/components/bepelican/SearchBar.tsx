import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Users, X, Loader2, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDestinations } from '@/hooks/useExperiences';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export interface SearchBarValues {
  destination: string;
  date: Date | null;
  guests: string;
}

export interface SearchBarInitialValues {
  destination?: string;
  date?: string;
  guests?: string;
}

interface SearchBarProps {
  isCompact?: boolean;
  variant?: 'horizontal' | 'stacked';
  onExpandChange?: (expanded: boolean) => void;
  initialValues?: SearchBarInitialValues;
  onSearchComplete?: () => void;
}

function parseInitialDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

const SearchBar = ({
  isCompact = false,
  variant = 'horizontal',
  onExpandChange,
  initialValues,
  onSearchComplete,
}: SearchBarProps) => {
  const [expanded, setExpanded] = useState(!isCompact);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchBarValues>({
    destination: initialValues?.destination ?? '',
    date: parseInitialDate(initialValues?.date),
    guests: initialValues?.guests ?? '',
  });
  const [destinationSearch, setDestinationSearch] = useState(initialValues?.destination ?? '');
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: destinations, isLoading: loadingDestinations } = useDestinations();

  const filteredDestinations =
    destinations?.filter(
      (d) =>
        d.city.toLowerCase().includes(destinationSearch.toLowerCase()) ||
        (d.department && d.department.toLowerCase().includes(destinationSearch.toLowerCase()))
    ) || [];

  useEffect(() => {
    if (!initialValues) return;
    setSearchParams({
      destination: initialValues.destination ?? '',
      date: parseInitialDate(initialValues.date),
      guests: initialValues.guests ?? '',
    });
    setDestinationSearch(initialValues.destination ?? '');
  }, [initialValues?.destination, initialValues?.date, initialValues?.guests]);

  useEffect(() => {
    if (variant === 'stacked') return;

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setActiveField(null);
        if (isCompact) {
          setExpanded(false);
          onExpandChange?.(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCompact, onExpandChange, variant]);

  const handleExpand = () => {
    setExpanded(true);
    onExpandChange?.(true);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.destination) params.set('ciudad', searchParams.destination);
    if (searchParams.date) params.set('fecha', format(searchParams.date, 'yyyy-MM-dd'));
    if (searchParams.guests) params.set('participantes', searchParams.guests);
    navigate(`/experiencias?${params.toString()}`);

    if (isCompact) {
      setExpanded(false);
      onExpandChange?.(false);
    }
    onSearchComplete?.();
  };

  const handleSelectDestination = (city: string) => {
    setSearchParams({ ...searchParams, destination: city });
    setDestinationSearch(city);
    setActiveField(variant === 'stacked' ? null : 'date');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSearchParams({ ...searchParams, date });
      if (variant !== 'stacked') setActiveField('guests');
    }
  };

  const adjustGuests = (delta: number) => {
    const current = parseInt(searchParams.guests) || 0;
    const next = Math.max(0, current + delta);
    setSearchParams({ ...searchParams, guests: next > 0 ? String(next) : '' });
  };

  const formattedDate = searchParams.date
    ? format(searchParams.date, "d 'de' MMMM", { locale: es })
    : '';

  // Compact version (collapsed)
  if (variant === 'horizontal' && isCompact && !expanded) {
    return (
      <button
        onClick={handleExpand}
        className={cn(
          'flex items-center gap-3 bg-white rounded-full shadow-md border border-border/50',
          'px-4 py-2 hover:shadow-lg transition-all duration-300',
          'animate-fade-in'
        )}
      >
        <span className="text-sm font-medium text-foreground">
          {searchParams.destination || 'Experiencias cerca'}
        </span>
        <span className="w-px h-5 bg-border" />
        <span className="text-sm text-muted-foreground">{formattedDate || 'Cualquier fecha'}</span>
        <span className="w-px h-5 bg-border" />
        <span className="text-sm text-muted-foreground">
          {searchParams.guests ? `${searchParams.guests} pers.` : 'Participantes'}
        </span>
        <div className="bg-bepelican-orange rounded-full p-2">
          <Search className="h-4 w-4 text-white" />
        </div>
      </button>
    );
  }

  // Stacked mobile layout
  if (variant === 'stacked') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto space-y-6 px-1">
          {/* Dónde */}
          <section>
            <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              Dónde
            </label>
            <Input
              type="text"
              placeholder="Busca por ciudad o destino"
              value={destinationSearch}
              onChange={(e) => {
                setDestinationSearch(e.target.value);
                setSearchParams({ ...searchParams, destination: e.target.value });
              }}
              className="rounded-xl h-11"
            />
            <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
              {loadingDestinations ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDestinations.length > 0 ? (
                filteredDestinations.map((dest) => (
                  <button
                    key={dest.city}
                    type="button"
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors text-left min-h-11"
                    onClick={() => handleSelectDestination(dest.city)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-bepelican-turquoise/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">{dest.city}</span>
                      {dest.department && (
                        <span className="text-xs text-muted-foreground">{dest.department}, Colombia</span>
                      )}
                    </div>
                  </button>
                ))
              ) : destinationSearch ? (
                <p className="text-sm text-muted-foreground py-2 px-1">
                  No encontramos &ldquo;{destinationSearch}&rdquo;
                </p>
              ) : null}
            </div>
          </section>

          {/* Cuándo */}
          <section>
            <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              Cuándo
            </label>
            <div className="rounded-xl border border-border p-2 flex justify-center">
              <CalendarComponent
                mode="single"
                selected={searchParams.date || undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={es}
                className="pointer-events-auto"
              />
            </div>
            {formattedDate && (
              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </p>
            )}
          </section>

          {/* Participantes */}
          <section>
            <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              Participantes
            </label>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium text-foreground">¿Cuántos van?</p>
                <p className="text-sm text-muted-foreground">Número de personas</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="min-h-11 min-w-11 rounded-full border border-border flex items-center justify-center hover:border-foreground hover:bg-muted transition-all disabled:opacity-50"
                  disabled={!searchParams.guests || parseInt(searchParams.guests) <= 0}
                  onClick={() => adjustGuests(-1)}
                  aria-label="Reducir participantes"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium text-lg">{searchParams.guests || '0'}</span>
                <button
                  type="button"
                  className="min-h-11 min-w-11 rounded-full border border-border flex items-center justify-center hover:border-foreground hover:bg-muted transition-all"
                  onClick={() => adjustGuests(1)}
                  aria-label="Aumentar participantes"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-border pt-4 mt-4 pb-safe">
          <Button
            onClick={handleSearch}
            className="w-full bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full h-12 text-base font-medium"
          >
            <Search className="h-5 w-5 mr-2" />
            Buscar experiencias
          </Button>
        </div>
      </div>
    );
  }

  // Horizontal expanded version (desktop)
  return (
    <div
      ref={searchRef}
      className={cn(
        'bg-white rounded-full shadow-lg border border-border/50',
        'flex items-center divide-x divide-border',
        'transition-all duration-300 relative',
        isCompact ? 'animate-scale-in' : ''
      )}
    >
      {/* Where */}
      <div
        className={cn(
          'flex-1 px-6 py-4 cursor-pointer rounded-l-full transition-colors relative',
          activeField === 'destination' ? 'bg-muted/50' : 'hover:bg-muted/30'
        )}
        onClick={() => setActiveField('destination')}
      >
        <label className="block text-xs font-semibold text-foreground mb-1">Dónde</label>
        <Input
          type="text"
          placeholder="Busca por ciudad o destino"
          value={destinationSearch}
          onChange={(e) => {
            setDestinationSearch(e.target.value);
            setSearchParams({ ...searchParams, destination: e.target.value });
          }}
          onFocus={() => setActiveField('destination')}
          className="border-0 p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-muted-foreground bg-transparent"
        />

        {activeField === 'destination' && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-border p-4 w-80 z-50 max-h-80 overflow-y-auto">
            {loadingDestinations ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDestinations.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  {destinationSearch ? 'RESULTADOS' : 'DESTINOS DISPONIBLES'}
                </p>
                <div className="space-y-1">
                  {filteredDestinations.map((dest) => (
                    <button
                      key={dest.city}
                      className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                      onClick={() => handleSelectDestination(dest.city)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-bepelican-turquoise/10 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground block">{dest.city}</span>
                        {dest.department && (
                          <span className="text-xs text-muted-foreground">{dest.department}, Colombia</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : destinations && destinations.length === 0 ? (
              <div className="text-center py-4">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aún no hay destinos disponibles</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No encontramos &ldquo;{destinationSearch}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-1">Prueba con otro destino</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* When */}
      <Popover open={activeField === 'date'} onOpenChange={(open) => setActiveField(open ? 'date' : null)}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'flex-1 px-6 py-4 cursor-pointer transition-colors relative',
              activeField === 'date' ? 'bg-muted/50' : 'hover:bg-muted/30'
            )}
          >
            <label className="block text-xs font-semibold text-foreground mb-1">Cuándo</label>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate || 'Agrega fecha'}
            </p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="single"
            selected={searchParams.date || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            locale={es}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Who */}
      <div
        className={cn(
          'flex-1 px-6 py-4 cursor-pointer transition-colors relative',
          activeField === 'guests' ? 'bg-muted/50' : 'hover:bg-muted/30'
        )}
        onClick={() => setActiveField('guests')}
      >
        <label className="block text-xs font-semibold text-foreground mb-1">Quién</label>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {searchParams.guests ? `${searchParams.guests} participantes` : 'Agrega participantes'}
        </p>
        {activeField === 'guests' && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-border p-5 w-72 z-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Participantes</p>
                <p className="text-sm text-muted-foreground">¿Cuántos van?</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="min-h-11 min-w-11 rounded-full border border-border flex items-center justify-center hover:border-foreground hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!searchParams.guests || parseInt(searchParams.guests) <= 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGuests(-1);
                  }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium text-lg">{searchParams.guests || '0'}</span>
                <button
                  type="button"
                  className="min-h-11 min-w-11 rounded-full border border-border flex items-center justify-center hover:border-foreground hover:bg-muted transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGuests(1);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Button */}
      <div className="px-2 py-2">
        <Button
          onClick={handleSearch}
          className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full h-12 px-6 flex items-center gap-2"
        >
          <Search className="h-5 w-5" />
          {!isCompact && <span className="hidden md:inline">Buscar</span>}
        </Button>
      </div>

      {isCompact && expanded && (
        <button
          onClick={() => {
            setExpanded(false);
            onExpandChange?.(false);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
