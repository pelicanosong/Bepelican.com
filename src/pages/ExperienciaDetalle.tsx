import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, MapPin, Users, Calendar, Check, X, 
  ChevronLeft, Share2, Heart, AlertCircle, ChevronUp,
  Globe, Mountain, Thermometer, Baby, PawPrint, Accessibility,
  Navigation, ExternalLink, Shield
} from 'lucide-react';
import BePelicanHeader from '@/components/bepelican/BePelicanHeader';
import BePelicanFooter from '@/components/bepelican/BePelicanFooter';
import { useLocalizedExperience } from '@/hooks/useLocalizedExperiences';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDateAvailability } from '@/hooks/useExperienceAvailability';
import { usePricingRules } from '@/hooks/usePricingRules';
import AvailabilityCalendar from '@/components/experience/AvailabilityCalendar';
import PricingSelector from '@/components/experience/PricingSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import ExperienceGallery from '@/components/experience/ExperienceGallery';
import { formatPrice } from '@/lib/formatPrice';
import { useLanguage } from '@/contexts/LanguageContext';
import * as React from 'react';

const useBelowLg = () => {
  const [belowLg, setBelowLg] = React.useState<boolean>(false);
  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setBelowLg(mql.matches);
    mql.addEventListener('change', onChange);
    setBelowLg(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return belowLg;
};

const ExperienciaDetalle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const { data: experience, isLoading, error } = useLocalizedExperience(slug || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const showMobileBooking = useBelowLg();
  const bookingSectionRef = useRef<HTMLDivElement>(null);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [participants, setParticipants] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { data: pricingRules = [] } = usePricingRules(experience?.id);
  

  useEffect(() => {
    if (experience && unitPrice === 0) {
      setUnitPrice(Number(experience.price));
    }
  }, [experience]);

  // SEO: Open Graph, canonical & JSON-LD
  useEffect(() => {
    if (!experience) return;
    const BASE_URL = 'https://bepelican.com';
    const url = `${BASE_URL}/experiencias/${experience.slug}`;
    const title = `${experience.title} | Experiencia en Colombia | BePelican`;
    const description = `Descubre la experiencia ${experience.title} en Colombia con BePelican. Turismo auténtico con comunidades locales.`;
    const image = experience.cover_image || '';

    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'article');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', url);

    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'TouristTrip',
      name: experience.title, description, image, url,
      touristType: experience.category?.name || 'Experiencia',
      offers: { '@type': 'Offer', price: Number(experience.price), priceCurrency: 'COP', availability: 'https://schema.org/InStock' },
      location: {
        '@type': 'Place', name: experience.location_name,
        address: {
          '@type': 'PostalAddress', addressLocality: experience.location_city,
          ...(experience.location_department && { addressRegion: experience.location_department }),
          ...(experience.location_country && { addressCountry: experience.location_country }),
        },
      },
      ...(experience.duration_minutes && { duration: `PT${experience.duration_minutes}M` }),
      maximumAttendeeCapacity: experience.max_participants,
      provider: { '@type': 'Organization', name: 'BePelican', url: BASE_URL },
    };

    let scriptEl = document.getElementById('experience-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) { scriptEl = document.createElement('script'); scriptEl.id = 'experience-jsonld'; scriptEl.type = 'application/ld+json'; document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'BePelican | Colombia';
      document.getElementById('experience-jsonld')?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [experience]);

  const { data: dateAvailability } = useDateAvailability(
    experience?.id, selectedDate || undefined,
    experience?.available_days || null, experience?.max_participants || 10
  );

  useEffect(() => {
    if (dateAvailability && dateAvailability.remainingSpots > 0) {
      if (participants > dateAvailability.remainingSpots) setParticipants(dateAvailability.remainingSpots);
    }
  }, [dateAvailability, participants]);

  const formatDurationDisplay = (exp: any) => {
    const unit = exp.duration_unit || 'minutes';
    if (unit === 'days') {
      const days = Math.round(exp.duration_minutes / (60 * 24));
      return days === 1 ? `1 ${t('common.day')}` : `${days} ${t('common.days')}`;
    }
    const minutes = exp.duration_minutes;
    if (minutes < 60) return `${minutes} ${t('common.min')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} h ${mins} ${t('common.min')}` : `${hours} ${t('common.hours')}`;
  };

  const totalPrice = unitPrice * participants;

  const handleReserve = () => {
    if (!selectedDate) {
      toast({ variant: 'destructive', title: t('exp.toastDateTitle'), description: t('exp.toastDateDesc') });
      return;
    }
    const params = new URLSearchParams({ experiencia: slug || '', fecha: selectedDate, participantes: participants.toString(), precio: unitPrice.toString() });
    if (selectedOrigin) params.set('origen', selectedOrigin);
    if (selectedAccommodation) params.set('acomodacion', selectedAccommodation);
    const checkoutPath = `/checkout?${params.toString()}`;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(checkoutPath)}`);
      return;
    }
    navigate(checkoutPath);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BePelicanHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-32" />
            </div>
            <div><Skeleton className="h-96 rounded-lg" /></div>
          </div>
        </div>
        <BePelicanFooter />
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-background">
        <BePelicanHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">{t('exp.notFound.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('exp.notFound.desc')}</p>
          <Link to="/experiencias">
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">{t('exp.notFound.cta')}</Button>
          </Link>
        </div>
        <BePelicanFooter />
      </div>
    );
  }

  const expAny = experience as any;
  const difficultyLabel = expAny.difficulty ? t(`difficulty.${expAny.difficulty}`) : null;
  const environmentTypes: string[] = (() => {
    const raw = expAny.environment_type;
    if (!raw) return [];
    const flatten = (val: any): string[] => {
      if (Array.isArray(val)) return val.flatMap(flatten);
      if (typeof val !== 'string') return [];
      const trimmed = val.trim();
      if (trimmed.startsWith('[')) {
        try { return flatten(JSON.parse(trimmed)); } catch { /* not json */ }
      }
      return trimmed ? [trimmed] : [];
    };
    return [...new Set(flatten(raw))];
  })();

  // Accessibility badges
  const accessibilityBadges = [];
  if (expAny.accessible_children) accessibilityBadges.push({ icon: <Baby className="h-4 w-4" />, label: t('accessibility.children') });
  if (expAny.accessible_reduced_mobility) accessibilityBadges.push({ icon: <Accessibility className="h-4 w-4" />, label: t('accessibility.mobility') });
  if (expAny["Se aceptan mascotas"]) accessibilityBadges.push({ icon: <PawPrint className="h-4 w-4" />, label: t('accessibility.pets') });

  // Booking sidebar content (shared between desktop and mobile)
  const renderBookingContent = (onReserve: () => void) => (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          <Calendar className="inline-block h-4 w-4 mr-1" /> {t('exp.selectDate')}
        </label>
        <AvailabilityCalendar
          experienceId={experience.id} availableDays={experience.available_days}
          maxParticipants={experience.max_participants} selectedDate={selectedDate}
          onSelectDate={setSelectedDate} requestedParticipants={participants}
          
          onMonthChange={setCalendarMonth}
        />
      </div>

      {experience.available_days && experience.available_days.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">{t('exp.availableDays')}</label>
          <div className="flex flex-wrap gap-2">
            {experience.available_days.map((day) => (
              <span key={day} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {t(`weekday.${day}`) || day}
              </span>
            ))}
          </div>
        </div>
      )}

      {pricingRules.length > 0 && experience.pricing_type !== 'fixed' && (
        <div className="mb-6">
          <PricingSelector
            pricingType={experience.pricing_type} rules={pricingRules}
            participants={participants} basePrice={Number(experience.price)}
            onPriceChange={(price) => setUnitPrice(price)}
            onSelectionChange={(origin, accommodation) => { setSelectedOrigin(origin); setSelectedAccommodation(accommodation); }}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{formatPrice(unitPrice)}</span>
          <span className="text-muted-foreground">{t('common.perPerson')}</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          <Users className="inline-block h-4 w-4 mr-1" /> {t('exp.participants')}
        </label>
        <div className="flex items-center gap-3">
          <button onClick={() => setParticipants(Math.max(1, participants - 1))} className="w-10 h-10 border border-input rounded-md flex items-center justify-center text-foreground hover:bg-muted transition-colors" disabled={participants <= 1}>-</button>
          <span className="text-lg font-medium text-foreground w-8 text-center">{participants}</span>
          <button
            onClick={() => {
              const maxAllowed = dateAvailability?.remainingSpots ? Math.min(experience.max_participants, dateAvailability.remainingSpots) : experience.max_participants;
              setParticipants(Math.min(maxAllowed, participants + 1));
            }}
            className="w-10 h-10 border border-input rounded-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            disabled={participants >= experience.max_participants || (dateAvailability ? participants >= dateAvailability.remainingSpots : false)}
          >+</button>
        </div>
        {selectedDate && dateAvailability ? (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Users className="h-3 w-3" /> {t('exp.spotsAvailable', { n: dateAvailability.remainingSpots })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">{t('exp.maxPeople', { n: experience.max_participants })}</p>
        )}
      </div>

      {selectedDate && dateAvailability && !dateAvailability.isAvailable && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {dateAvailability.reason === 'day_not_available' ? t('exp.dayUnavailable') : t('exp.noSpots')}
          </p>
        </div>
      )}

      <div className="border-t border-border pt-4 mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('exp.experienceLine', { n: participants })}</span>
          <span className="text-foreground">{formatPrice(unitPrice * participants)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-muted-foreground font-medium">{t('common.total')}</span>
          <span className="text-2xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
        </div>
      </div>

      <Button
        onClick={onReserve}
        disabled={
          !selectedDate ||
          (dateAvailability && !dateAvailability.isAvailable)
        }
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!selectedDate
          ? t('exp.selectDate')
          : dateAvailability && !dateAvailability.isAvailable
            ? t('exp.dateUnavailable')
            : t('exp.bookNow')}
      </Button>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="h-4 w-4" /> {t('exp.share')}
        </button>
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Heart className="h-4 w-4" /> {t('exp.save')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/experiencias" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> {t('exp.breadcrumb')}
            </Link>
            {experience.category && (
              <>
                <span className="text-muted-foreground">/</span>
                <Link to={`/experiencias?categoria=${experience.category.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {experience.category.name}
                </Link>
              </>
            )}
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{experience.title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <ExperienceGallery
              coverImage={experience.cover_image}
              galleryImages={experience.gallery_images}
              title={experience.title}
            />

            {/* Title and meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {experience.category && (
                  <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                    {experience.category.name}
                  </span>
                )}
                {environmentTypes.map((env) => (
                  <span key={env} className="inline-block text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {t(`env.${env}`) || env}
                  </span>
                ))}
              </div>

              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">{experience.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>
                    {experience.location_name}, {experience.location_city}
                    {experience.location_department && `, ${experience.location_department}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{formatDurationDisplay(experience)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{t('exp.upToPeople', { n: experience.max_participants })}</span>
                </div>
                {expAny.languages && expAny.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span>{expAny.languages.map((l: string) => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Accessibility badges */}
            {accessibilityBadges.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {accessibilityBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="font-display text-xl font-bold text-primary mb-4">{t('exp.about')}</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="whitespace-pre-line">{experience.description}</p>
              </div>
            </div>

            {/* Difficulty section */}
            {(difficultyLabel || expAny.difficulty_notes) && (
              <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                <Mountain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t('exp.difficulty')}{difficultyLabel ? `: ${difficultyLabel}` : ''}
                  </p>
                  {expAny.difficulty_notes && (
                    <p className="text-sm text-muted-foreground">{expAny.difficulty_notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Itinerary day-by-day */}
            {(() => {
              const rawItinerary = expAny.itinerary;
              if (!rawItinerary) return null;
              const days: { dayNumber: number; title: string; activities: { description: string }[] }[] =
                Array.isArray(rawItinerary) ? rawItinerary : [];
              if (days.length === 0) return null;
              return (
                <div>
                  <h2 className="font-display text-xl font-bold text-primary mb-6">{t('exp.itinerary')}</h2>
                  <div className="space-y-4">
                    {days.map((day, i) => (
                      <div key={i} className="relative pl-8 pb-4">
                        {i < days.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                        )}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">{day.dayNumber}</span>
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-foreground mb-1">
                            {t('exp.day')} {day.dayNumber}{day.title ? `: ${day.title}` : ''}
                          </h3>
                          {day.activities && day.activities.length > 0 && (
                            <ul className="space-y-1.5 mt-2">
                              {day.activities.map((act, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="text-primary font-medium mt-px">•</span>
                                  <span>{act.description}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Includes / Not includes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {experience.includes && experience.includes.length > 0 && (
                <div className="bg-success/10 rounded-lg p-6">
                  <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-success" /> {t('exp.includes')}
                  </h3>
                  <ul className="space-y-2">
                    {experience.includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {experience.not_includes && experience.not_includes.length > 0 && (
                <div className="bg-destructive/10 rounded-lg p-6">
                  <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                    <X className="h-5 w-5 text-destructive" /> {t('exp.notIncludes')}
                  </h3>
                  <ul className="space-y-2">
                    {experience.not_includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <X className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Meeting point & logistics */}
            {(experience.location_address || expAny.meeting_point_url) && (
              <div className="bg-muted/30 rounded-lg p-6">
                <h2 className="font-display text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <Navigation className="h-5 w-5" /> {t('exp.meetingPoint')}
                </h2>
                {experience.location_address && (
                  <p className="text-muted-foreground mb-3">{experience.location_address}</p>
                )}
                {expAny.meeting_point_url && (
                  <a
                    href={expAny.meeting_point_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" /> {t('exp.viewMaps')}
                  </a>
                )}
                {expAny.end_point_same === false && expAny.end_point && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-1">{t('exp.endPoint')}</p>
                    <p className="text-sm text-muted-foreground">{expAny.end_point}</p>
                  </div>
                )}
              </div>
            )}

            {/* Schedule info */}
            {(expAny.start_time || expAny.start_time_flexible) && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>
                  {expAny.start_time_flexible
                    ? t('exp.flexibleSchedule')
                    : `${t('exp.startTime')} ${expAny.start_time}`}
                </span>
              </div>
            )}

            {/* Climate info */}
            {(expAny.temperature_range || expAny.recommended_season) && (
              <div className="bg-muted/30 rounded-lg p-6">
                <h2 className="font-display text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <Thermometer className="h-5 w-5" /> {t('exp.climate')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expAny.temperature_range && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">{t('exp.typicalTemp')}</p>
                      <p className="text-muted-foreground">{expAny.temperature_range}</p>
                    </div>
                  )}
                  {expAny.recommended_season && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">{t('exp.recommendedSeason')}</p>
                      <p className="text-muted-foreground">{expAny.recommended_season}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements */}
            {experience.requirements && experience.requirements.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-primary mb-4">{t('exp.recommendations')}</h2>
                <ul className="space-y-2">
                  {experience.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Arrival tips */}
            {experience.arrival_tips && (
              <div className="bg-muted/50 rounded-lg p-6">
                <h2 className="font-display text-xl font-bold text-primary mb-4">{t('exp.arrivalTips')}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{experience.arrival_tips}</p>
              </div>
            )}

            {/* Accessibility notes */}
            {expAny.accessibility_notes && (
              <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                <Accessibility className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{t('exp.accessibilityNotes')}</p>
                  <p className="text-sm text-muted-foreground">{expAny.accessibility_notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation policy */}
            {(experience.cancellation_policy || expAny.cancellation_policy_type) && (
              <div className="bg-muted/30 rounded-lg p-6">
                <h2 className="font-display text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" /> {t('exp.cancellation')}
                </h2>
                {expAny.cancellation_policy_type && (
                  <span className="inline-block text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-3 capitalize">
                    {expAny.cancellation_policy_type}
                  </span>
                )}
                {experience.cancellation_policy && (
                  <p className="text-muted-foreground whitespace-pre-line">{experience.cancellation_policy}</p>
                )}
              </div>
            )}
          </div>

          {/* Booking sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1 self-start">
            <div className="sticky top-24 bg-card border border-border rounded-lg p-6 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto">
              {renderBookingContent(handleReserve)}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky bottom bar + expandable booking panel */}
      {showMobileBooking && (
        <>
          {mobileBookingOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileBookingOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto animate-fade-in shadow-2xl" ref={bookingSectionRef}>
                <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-display text-lg text-foreground">{t('exp.bookExperience')}</h3>
                  <button onClick={() => setMobileBookingOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  {renderBookingContent(() => { setMobileBookingOpen(false); handleReserve(); })}
                </div>
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl text-foreground leading-tight">{formatPrice(unitPrice)}</p>
                <p className="text-xs text-muted-foreground">{t('exp.copPerPerson')}</p>
              </div>
              <Button onClick={() => setMobileBookingOpen(true)} className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full px-6 py-5 text-base font-medium">
                <Calendar className="h-4 w-4 mr-2" /> {t('exp.bookNow')}
              </Button>
            </div>
          </div>
          <div className="h-20 lg:hidden" />
        </>
      )}

      <BePelicanFooter />
    </div>
  );
};

export default ExperienciaDetalle;
