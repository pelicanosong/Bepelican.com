import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import type { ExperienceWithCategory } from '@/hooks/useExperiences';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExperiencePriceWithCurrency } from '@/components/experience/ExperiencePriceWithCurrency';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { currencyPerPersonApprox, isNativeCopDisplay } from '@/lib/moniDisplayLabels';
import { getCategoryDisplayName, getPrimaryCategory } from '@/lib/categoryLabel';
import { ExperienceImage } from '@/components/experience/ExperienceImage';
import { cn } from '@/lib/utils';

interface ExperienceListingCardProps {
  experience: ExperienceWithCategory;
  className?: string;
}

const ExperienceListingCard = ({ experience, className }: ExperienceListingCardProps) => {
  const { t, language } = useLanguage();
  const { displayCurrency } = useDisplayCurrency();

  const category = getPrimaryCategory(experience);
  const categoryLabel = getCategoryDisplayName(category, t, language);

  const locationParts = [
    experience.location_city,
    experience.location_department || experience.location_country,
  ].filter(Boolean);

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} ${t('featured.days')}`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins > 0) return `${hours}h ${mins}min`;
      return `${hours} ${t('featured.hours')}`;
    }
    return `${minutes} min`;
  };

  return (
    <Link
      to={`/experiencias/${experience.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl',
        'bg-card border border-bepelican-beige/50',
        'shadow-[0_10px_40px_-20px_rgba(28,47,72,0.15)]',
        'transition-all duration-500 ease-out',
        'hover:border-bepelican-turquoise/30 hover:shadow-[0_24px_48px_-20px_rgba(28,47,72,0.2)]',
        'hover:-translate-y-0.5',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-bepelican-beige/20">
        {experience.cover_image ? (
          <ExperienceImage
            src={experience.cover_image}
            alt={experience.title}
            size="card"
            priority="list"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bepelican-turquoise/15 to-bepelican-beige/30">
            <span className="font-display text-2xl text-bepelican-turquoise/40">BePelican</span>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bepelican-deepblue/55 via-bepelican-deepblue/5 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-80"
          aria-hidden
        />

        {categoryLabel && (
          <span className="absolute left-3 top-3 max-w-[85%] truncate rounded-full border border-white/50 bg-bepelican-beige/95 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-bepelican-deepblue shadow-sm backdrop-blur-md">
            {categoryLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-bepelican-turquoise" aria-hidden />
          <span className="line-clamp-1">{locationParts.join(', ')}</span>
        </div>

        <h3 className="font-display text-xl leading-snug text-foreground line-clamp-2 transition-colors duration-300 group-hover:text-bepelican-turquoise">
          {experience.title}
        </h3>

        {experience.short_description && (
          <p className="font-sans text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {experience.short_description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-bepelican-brown/80" aria-hidden />
            {formatDuration(experience.duration_minutes)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-bepelican-brown/80" aria-hidden />
            {t('featured.upTo')} {experience.max_participants}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-bepelican-beige/60 pt-4 min-w-0">
          <div className="min-w-0">
            <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('featured.from')}
            </p>
            <p className="font-sans text-foreground">
              <ExperiencePriceWithCurrency
                amountCop={Number(experience.price)}
                variant="card"
              />
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              {isNativeCopDisplay(displayCurrency)
                ? t('featured.perPerson')
                : currencyPerPersonApprox(displayCurrency)}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 font-sans text-sm font-medium text-bepelican-orange transition-all duration-300 group-hover:gap-2">
            {t('featured.discover')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ExperienceListingCard;
