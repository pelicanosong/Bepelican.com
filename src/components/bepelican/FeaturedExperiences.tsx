import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Star, Clock, Users, Heart } from 'lucide-react';
import { useLocalizedExperiences } from '@/hooks/useLocalizedExperiences';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const FeaturedExperiences = () => {
  const { data: experiences, isLoading } = useLocalizedExperiences();
  const { t, language } = useLanguage();

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} ${t('featured.days')}`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} ${t('featured.hours')}`;
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-10 w-96" />
            </div>
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const featuredExperiences = experiences?.slice(0, 4) || [];

  // Simulated host names for display
  const hostNames = ['Don Carlos', 'Luz Marina', 'Taita Pedro', 'Jorge'];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/50 rounded-full px-4 py-2 mb-4">
              <span>⭐</span>
              <span className="text-sm font-medium text-amber-700">{t('featured.badge')}</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              {t('featured.title')}{' '}
              <span className="text-bepelican-orange">{t('featured.titleHighlight')}</span>
            </h2>
          </div>
          <Link to="/experiencias" className="hidden md:flex">
            <Button variant="outline" className="rounded-full border-border hover:border-foreground">
              {t('featured.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Experience Cards */}
        {featuredExperiences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredExperiences.map((experience, index) => (
              <Link
                key={experience.id}
                to={`/experiencias/${experience.slug}`}
                className="group text-left w-full"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                  <img
                    src={experience.cover_image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80'}
                    alt={experience.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Category Badge */}
                  {experience.category && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                      {language === 'es' ? experience.category.name : t(`category.${experience.category.slug}`)}
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <div 
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      // TODO: Add to favorites
                    }}
                  >
                    <Heart className="h-4 w-4 text-foreground" />
                  </div>
                </div>

                {/* Info */}
                <div>
                  {/* Location & Rating */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{experience.location_city}, {experience.location_department || experience.location_country}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-bepelican-orange fill-bepelican-orange" />
                      <span className="text-sm font-medium">4.{9 - index % 2}</span>
                      <span className="text-sm text-muted-foreground">({127 - index * 20})</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-lg text-foreground group-hover:text-bepelican-orange transition-colors line-clamp-2 mb-2">
                    {experience.title}
                  </h3>

                  {/* Host */}
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('featured.with')} <span className="font-medium text-foreground">{hostNames[index % hostNames.length]}</span>
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDuration(experience.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{t('featured.upTo')} {experience.max_participants}</span>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg text-foreground">
                      ${experience.price.toLocaleString('es-CO')}{' '}
                      <span className="text-sm font-normal text-muted-foreground">{t('featured.perPerson')}</span>
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full"
                    >
                      {t('featured.viewMore')}
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-2xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl text-foreground mb-2">
              {t('featured.coming')}
            </h3>
            <p className="text-muted-foreground">
              {t('featured.comingDesc')}
            </p>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="text-center mt-10 md:hidden">
          <Link to="/experiencias">
            <Button className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full px-8">
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
