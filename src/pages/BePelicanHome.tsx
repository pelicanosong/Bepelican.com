import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Calendar, Sparkles } from 'lucide-react';
import BePelicanHeader from '@/components/bepelican/BePelicanHeader';
import BePelicanFooter from '@/components/bepelican/BePelicanFooter';
import HeroCarousel from '@/components/bepelican/HeroCarousel';
import SearchBar from '@/components/bepelican/SearchBar';
import { MobileSearchTrigger } from '@/components/bepelican/MobileSearchSheet';
import FeaturedExperiences from '@/components/bepelican/FeaturedExperiences';
import FeaturedLibrary from '@/components/bepelican/FeaturedLibrary';
import HowItWorks from '@/components/bepelican/HowItWorks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalizedExperiences } from '@/hooks/useLocalizedExperiences';
import { ExperienceImage } from '@/components/experience/ExperienceImage';

const HOME_SEO = {
  title: 'BePelican | Experiencias de turismo auténtico en Colombia',
  description: 'Descubre experiencias únicas de turismo en Colombia con BePelican. Aventuras, cultura, gastronomía y naturaleza con comunidades locales.',
  url: 'https://bepelican.com',
};

const BePelicanHome = () => {
  // SEO meta tags
  useEffect(() => {
    document.title = HOME_SEO.title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', HOME_SEO.description);
    setMeta('property', 'og:title', HOME_SEO.title);
    setMeta('property', 'og:description', HOME_SEO.description);
    setMeta('property', 'og:url', HOME_SEO.url);
    setMeta('property', 'og:type', 'website');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', HOME_SEO.url);

    // JSON-LD Organization + WebSite structured data
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BePelican',
        url: 'https://bepelican.com',
        logo: 'https://storage.googleapis.com/gpt-engineer-file-uploads/mMfcgngu3jRFU47Dmru1iEKsZM03/uploads/1768184182258-1200x1200.png',
        description: 'Plataforma de turismo auténtico en Colombia. Experiencias con comunidades locales, aventuras, cultura y gastronomía.',
        foundingDate: '2024',
        areaServed: {
          '@type': 'Country',
          name: 'Colombia',
        },
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['Spanish', 'English'],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BePelican',
        url: 'https://bepelican.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://bepelican.com/experiencias?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    let scriptEl = document.getElementById('home-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'home-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'BePelican | Colombia';
      const c = document.querySelector('link[rel="canonical"]');
      if (c) c.remove();
      const s = document.getElementById('home-jsonld');
      if (s) s.remove();
    };
  }, []);
  const { data: experiences } = useLocalizedExperiences();

  // Get upcoming experiences (simulated - would need date filtering)
  const upcomingExperiences = experiences?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader variant="transparent" />
      
      {/* Hero Section with Carousel */}
      <div className="relative">
        <HeroCarousel />
        
        {/* Floating Search Bar */}
        {/* Floating Search Bar — desktop only */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-4xl px-4 sm:px-6 hidden md:block">
          <SearchBar />
        </div>
      </div>

      {/* Mobile search — below hero */}
      <section className="md:hidden px-4 sm:px-6 -mt-2 mb-2 relative z-20">
        <MobileSearchTrigger />
      </section>

      {/* Spacer for desktop floating search bar */}
      <div className="pt-6 md:pt-20" />

      {/* Featured Experiences */}
      <FeaturedExperiences />

      {/* Upcoming Experiences Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 mb-6">
              <Calendar className="h-4 w-4 text-bepelican-orange" />
              <span className="text-sm font-medium text-bepelican-orange">Próximas salidas</span>
            </div>
            
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
              No te quedes sin{' '}
              <span className="text-bepelican-orange">tu cupo</span>
            </h2>
            
            <p className="text-muted-foreground">
              Experiencias con fechas próximas y cupos limitados.
            </p>
          </div>

          <div className="space-y-4">
            {upcomingExperiences.map((exp, index) => (
              <Link
                key={exp.id}
                to={`/experiencias/${exp.slug}`}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-background rounded-xl p-4 border border-border hover:border-bepelican-orange/50 hover:shadow-md transition-all group"
              >
                {exp.cover_image ? (
                  <ExperienceImage
                    src={exp.cover_image}
                    alt={exp.title}
                    size="thumb"
                    priority="list"
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop"
                    alt={exp.title}
                    className="w-14 h-14 rounded-lg object-cover"
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-bepelican-orange transition-colors line-clamp-2">
                    {exp.title}
                  </h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{exp.location_city} • Próximamente</span>
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:text-right shrink-0">
                  <p className="text-sm font-medium text-bepelican-orange">{3 - index} cupos</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-bepelican-orange transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/experiencias">
              <Button className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full">
                Ver todas las fechas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Biblioteca destacada */}
      <FeaturedLibrary />

      {/* Newsletter - subtle inline banner */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <div className="flex items-center gap-2 justify-center mb-3">
            <Sparkles className="h-5 w-5 text-bepelican-orange" />
            <h3 className="font-display text-lg text-foreground">Recibe inspiración de viaje</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Experiencias exclusivas y ofertas antes que nadie. Sin spam.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="tu@email.com"
              className="rounded-full h-11 px-5 flex-1"
            />
            <Button className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full h-11 px-6">
              Suscribirme
            </Button>
          </div>
        </div>
      </section>

      <BePelicanFooter />
    </div>
  );
};

export default BePelicanHome;
