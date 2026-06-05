import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLocalizedExperiences } from '@/hooks/useLocalizedExperiences';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ExperienceListingCard from '@/components/bepelican/ExperienceListingCard';
import { DisplayCurrencyCompactSelector } from '@/components/experience/DisplayCurrencyCompactSelector';

const FeaturedExperiences = () => {
  const { data: experiences, isLoading } = useLocalizedExperiences();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <section className="relative overflow-hidden py-12 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-bepelican-beige/15 via-background to-background pointer-events-none" />
        <div className="container relative mx-auto px-6">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <Skeleton className="mb-4 h-8 w-48" />
              <Skeleton className="h-10 w-96 max-w-full" />
            </div>
            <Skeleton className="hidden h-12 w-48 md:block" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const featuredExperiences = experiences?.slice(0, 4) || [];

  return (
    <section className="relative overflow-hidden py-12 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bepelican-beige/20 via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-bepelican-turquoise/5 blur-3xl"
        aria-hidden
      />

      <div className="container relative mx-auto px-6">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-bepelican-beige bg-bepelican-beige/30 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-bepelican-turquoise" aria-hidden />
              <span className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-bepelican-deepblue">
                {t('featured.badge')}
              </span>
            </div>
            <h2 className="font-display text-3xl text-foreground md:text-4xl">
              {t('featured.title')}{' '}
              <span className="text-bepelican-turquoise">{t('featured.titleHighlight')}</span>
            </h2>
            <p className="mt-3 font-sans text-base leading-relaxed text-muted-foreground">
              {t('featured.subtitle')}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center shrink-0">
            <DisplayCurrencyCompactSelector />
            <Link to="/experiencias" className="hidden md:inline-flex">
              <Button
                variant="outline"
                className="rounded-full border-bepelican-beige bg-card/80 font-sans text-foreground shadow-sm backdrop-blur-sm hover:border-bepelican-turquoise/40 hover:bg-bepelican-beige/20"
              >
                {t('featured.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {featuredExperiences.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredExperiences.map((experience) => (
              <ExperienceListingCard key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-bepelican-beige/50 bg-bepelican-beige/10 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bepelican-beige/40">
              <MapPin className="h-8 w-8 text-bepelican-turquoise" />
            </div>
            <h3 className="font-display text-xl text-foreground">{t('featured.coming')}</h3>
            <p className="mt-2 font-sans text-muted-foreground">{t('featured.comingDesc')}</p>
          </div>
        )}

        <div className="mt-10 text-center md:hidden">
          <Link to="/experiencias">
            <Button className="rounded-full bg-bepelican-orange px-8 font-sans text-white hover:bg-bepelican-orange/90">
              {t('featured.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedExperiences;
