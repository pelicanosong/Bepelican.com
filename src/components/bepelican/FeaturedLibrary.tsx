import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useFlipbooks } from '@/hooks/useFlipbooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const FeaturedLibrary = () => {
  const { data: flipbooks, isLoading } = useFlipbooks({ featured: true });

  const featured = flipbooks?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 mb-4">
              <BookOpen className="h-4 w-4 text-bepelican-orange" />
              <span className="text-sm font-medium text-bepelican-orange">Biblioteca</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Inspírate con nuestras{' '}
              <span className="text-bepelican-orange">guías de viaje</span>
            </h2>
          </div>
          <Link to="/biblioteca" className="hidden md:flex">
            <Button variant="outline" className="rounded-full border-border hover:border-foreground">
              Ver biblioteca completa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((flipbook) => (
            <Link
              key={flipbook.id}
              to={`/biblioteca/${flipbook.slug}`}
              className="group bg-background rounded-2xl overflow-hidden border border-border hover:border-bepelican-orange/50 hover:shadow-lg transition-all"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={flipbook.cover_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'}
                  alt={flipbook.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                {flipbook.categories?.[0] && (
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full mb-2 inline-block"
                    style={{
                      backgroundColor: `${flipbook.categories[0].color}20`,
                      color: flipbook.categories[0].color,
                    }}
                  >
                    {flipbook.categories[0].name}
                  </span>
                )}
                <h3 className="font-display text-lg text-foreground group-hover:text-bepelican-orange transition-colors line-clamp-2">
                  {flipbook.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link to="/biblioteca">
            <Button className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full px-8">
              Ver biblioteca completa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedLibrary;
