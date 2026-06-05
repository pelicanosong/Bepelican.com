import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHeroSlides } from '@/hooks/useHeroSlides';

interface DisplaySlide {
  id: string | number;
  image: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
}

const fallbackSlides: DisplaySlide[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80',
    badge: '✨ Turismo de transformación',
    title: 'Cada experiencia es una',
    highlight: 'historia viva',
    description: 'Descubre experiencias auténticas que transforman vidas — la tuya y la de comunidades locales en Colombia.',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    badge: '🌿 Naturaleza y aventura',
    title: 'Conecta con la',
    highlight: 'naturaleza',
    description: 'Explora paisajes únicos, selvas tropicales y páramos mágicos.',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80',
    badge: '🎭 Cultura ancestral',
    title: 'Vive la tradición con',
    highlight: 'comunidades locales',
    description: 'Sumérgete en la riqueza cultural de Colombia.',
  },
];

const HeroCarousel = () => {
  const { data: dbSlides } = useHeroSlides();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides: DisplaySlide[] = dbSlides && dbSlides.length > 0
    ? dbSlides.map(s => ({
        id: s.id,
        image: s.image_url,
        badge: s.badge || '',
        title: s.title,
        highlight: s.highlight,
        description: s.description || '',
      }))
    : fallbackSlides;

  // Reset slide index when slides change
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide, slides.length]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  const slide = slides[currentSlide];
  if (!slide) return null;

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] overflow-hidden">
      {/* Background Images */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          <img src={s.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-32 flex items-center min-h-[85vh] sm:min-h-[90vh]">
        <div className="max-w-3xl">
          {slide.badge && (
            <div className={cn(
              "inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6",
              "transform transition-all duration-500",
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}>
              <span className="text-sm font-medium text-white">{slide.badge}</span>
            </div>
          )}

          <h1 className={cn(
            "font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6",
            "transform transition-all duration-500 delay-100",
            isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            {slide.title}{' '}
            <span className="text-bepelican-orange underline decoration-wavy decoration-2 underline-offset-8">
              {slide.highlight}
            </span>
          </h1>

          <p className={cn(
            "text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed",
            "transform transition-all duration-500 delay-200",
            isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            {slide.description}
          </p>

          <div className={cn(
            "flex flex-col sm:flex-row gap-4 mb-12",
            "transform transition-all duration-500 delay-300",
            isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            <Link to="/experiencias">
              <Button size="lg" className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white font-medium px-8 py-6 text-base rounded-full">
                Explorar experiencias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/biblioteca">
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 font-medium px-8 py-6 text-base rounded-full">
                Explorar biblioteca
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 pb-safe">
          <button
            type="button"
            onClick={prevSlide}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex gap-1">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Ir al slide ${index + 1}`}
                className="min-h-11 min-w-11 flex items-center justify-center"
              >
                <span
                  className={cn(
                    'rounded-full transition-all duration-300',
                    index === currentSlide ? 'w-8 h-2 bg-bepelican-orange' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  )}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={nextSlide}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
            aria-label="Slide siguiente"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
