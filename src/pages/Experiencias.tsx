import { useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, MapPin, Calendar, Users, X, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import BePelicanHeader from '@/components/bepelican/BePelicanHeader';
import BePelicanFooter from '@/components/bepelican/BePelicanFooter';
import ExperienceCard from '@/components/bepelican/ExperienceCard';
import { useLocalizedExperiences, useLocalizedCategories } from '@/hooks/useLocalizedExperiences';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ExperienceFilters } from '@/hooks/useExperiences';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Experiencias = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const dateLocale = language === 'en' ? enUS : es;
  
  // Get all filter params
  const categorySlug = searchParams.get('categoria') || undefined;
  const city = searchParams.get('ciudad') || undefined;
  const dateParam = searchParams.get('fecha') || undefined;
  const participantsParam = searchParams.get('participantes') || undefined;
  const searchQuery = searchParams.get('q') || undefined;

  // Build filters object
  const filters: ExperienceFilters = useMemo(() => ({
    categorySlug,
    search: searchQuery,
    city,
    minParticipants: participantsParam ? parseInt(participantsParam) : undefined,
  }), [categorySlug, searchQuery, city, participantsParam]);

  const { data: experiences, isLoading } = useLocalizedExperiences(filters);
  const { data: categories } = useLocalizedCategories();

  const currentCategory = categories?.find(c => c.slug === categorySlug);

  // SEO meta tags, canonical & OG
  useEffect(() => {
    const BASE_URL = 'https://bepelican.com';
    const categoryName = currentCategory?.name;

    const title = categoryName
      ? `${categoryName} en Colombia | BePelican`
      : 'Experiencias en Colombia | BePelican';

    const description = categoryName
      ? `Descubre experiencias de ${categoryName} en Colombia con BePelican. Turismo auténtico con comunidades locales.`
      : 'Descubre experiencias únicas en Colombia con BePelican. Turismo auténtico, aventuras y cultura con comunidades locales.';

    const url = categoryName
      ? `${BASE_URL}/experiencias?categoria=${categorySlug}`
      : `${BASE_URL}/experiencias`;

    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'website');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    return () => {
      document.title = 'BePelican | Colombia';
      const c = document.querySelector('link[rel="canonical"]');
      if (c) c.remove();
    };
  }, [currentCategory, categorySlug]);

  // Check if any filters are active
  const hasActiveFilters = city || dateParam || participantsParam || searchQuery;

  // Format date for display
  const formattedDate = dateParam 
    ? format(parseISO(dateParam), language === 'en' ? 'MMMM d, yyyy' : "d 'de' MMMM, yyyy", { locale: dateLocale })
    : null;

  const handleCategoryChange = (slug?: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug) {
      newParams.set('categoria', slug);
    } else {
      newParams.delete('categoria');
    }
    setSearchParams(newParams);
  };

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  // Build page title and description based on filters
  const pageTitle = useMemo(() => {
    if (city && currentCategory) {
      return `${currentCategory.name} ${t('list.inCity')} ${city}`;
    }
    if (city) {
      return `${t('list.experiencesIn')} ${city}`;
    }
    if (searchQuery) {
      return `${t('list.resultsFor')} "${searchQuery}"`;
    }
    if (currentCategory) {
      return currentCategory.name;
    }
    return t('list.allTitle');
  }, [city, currentCategory, searchQuery, t]);

  const pageDescription = useMemo(() => {
    const parts: string[] = [];
    if (city) parts.push(`${t('list.inCity')} ${city}`);
    if (formattedDate) parts.push(formattedDate);
    if (participantsParam) parts.push(`${participantsParam} ${t('common.people')}`);
    
    if (parts.length > 0) {
      return language === 'en'
        ? `Experiences available ${parts.join(' · ')}`
        : `Experiencias disponibles ${parts.join(' ')}`;
    }
    return currentCategory?.description || t('list.defaultDesc');
  }, [city, formattedDate, participantsParam, currentCategory, t, language]);

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader variant="light" />

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-bepelican-deepblue text-primary-foreground pt-24 md:pt-28 pb-6 md:pb-8">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-5xl mb-2">
            {pageTitle}
          </h1>
          <p className="text-lg opacity-90">
            {pageDescription}
          </p>
        </div>
      </section>

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">{t('list.activeFilters')}</span>
              
              {city && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <MapPin className="h-3.5 w-3.5" />
                  {city}
                  <button 
                    onClick={() => removeFilter('ciudad')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {formattedDate && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                  <button 
                    onClick={() => removeFilter('fecha')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {participantsParam && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Users className="h-3.5 w-3.5" />
                  {participantsParam} {t('common.people')}
                  <button 
                    onClick={() => removeFilter('participantes')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {searchQuery && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Search className="h-3.5 w-3.5" />
                  "{searchQuery}"
                  <button 
                    onClick={() => removeFilter('q')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                Limpiar todo
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Category Filters */}
      <section className="border-b border-border sticky top-[73px] bg-background z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Categorías:</span>
            </div>
            
            <Button
              variant={!categorySlug ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange()}
              className={!categorySlug ? 'bg-primary text-primary-foreground shrink-0' : 'shrink-0'}
            >
              Todas
            </Button>
            
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={categorySlug === category.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category.slug)}
                className={`shrink-0 ${categorySlug === category.slug ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : experiences && experiences.length > 0 ? (
            <>
              <p className="text-muted-foreground mb-6">
                {experiences.length} experiencia{experiences.length !== 1 ? 's' : ''} encontrada{experiences.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiences.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="font-display text-2xl text-foreground mb-4">
                  No encontramos experiencias
                </h2>
                <p className="text-muted-foreground mb-6">
                  {hasActiveFilters 
                    ? 'No hay experiencias que coincidan con tus filtros. Intenta ajustar tu búsqueda.'
                    : categorySlug 
                      ? 'No encontramos experiencias en esta categoría. Prueba con otra categoría.'
                      : 'Estamos preparando experiencias increíbles para ti. ¡Vuelve pronto!'
                  }
                </p>
                {(hasActiveFilters || categorySlug) && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {hasActiveFilters && (
                      <Button 
                        variant="outline"
                        onClick={clearAllFilters}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                    <Link to="/experiencias">
                      <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                        Ver todas las experiencias
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <BePelicanFooter />
    </div>
  );
};

export default Experiencias;
