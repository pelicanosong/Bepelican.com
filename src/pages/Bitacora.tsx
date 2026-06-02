import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const LIBRERIA_SEO = {
  title: 'Guías de viaje de Colombia, rutas y experiencias locales | BePelican',
  description: 'Descubre guías de viaje de Colombia, rutas locales, gastronomía y experiencias auténticas creadas por BePelican para inspirar tu próximo viaje.',
  url: 'https://bepelican.com/biblioteca',
};
import BePelicanHeader from '@/components/bepelican/BePelicanHeader';
import BePelicanFooter from '@/components/bepelican/BePelicanFooter';
import FlipbookModal from '@/components/bitacora/FlipbookModal';
import { useFlipbooks, useFlipbookCategories, useFlipbook, Flipbook, FlipbookCategory } from '@/hooks/useFlipbooks';
import { Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const Bitacora = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFlipbook, setSelectedFlipbook] = useState<Flipbook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setMeta = (attr: string, key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setCanonical = (href: string) => {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', href);
  };

  const applyLibreriaSeo = () => {
    document.title = LIBRERIA_SEO.title;
    setMeta('name', 'description', LIBRERIA_SEO.description);
    setMeta('property', 'og:title', LIBRERIA_SEO.title);
    setMeta('property', 'og:description', LIBRERIA_SEO.description);
    setMeta('property', 'og:url', LIBRERIA_SEO.url);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', '');
    setCanonical(LIBRERIA_SEO.url);
    const s = document.getElementById('flipbook-jsonld');
    if (s) s.remove();
  };

  // Base SEO for /libreria
  useEffect(() => {
    applyLibreriaSeo();
    return () => {
      document.title = 'BePelican | Colombia';
      const c = document.querySelector('link[rel="canonical"]');
      if (c) c.remove();
    };
  }, []);

  const { data: categories = [], isLoading: categoriesLoading } = useFlipbookCategories();
  const { data: flipbooks = [], isLoading: flipbooksLoading } = useFlipbooks({
    search: searchTerm || undefined,
  });

  const { data: fullFlipbook } = useFlipbook(selectedFlipbook?.slug || slug || '');

  // Auto-open from URL slug
  const { data: slugFlipbook } = useFlipbook(slug || '');
  useEffect(() => {
    if (slug && slugFlipbook && !isModalOpen && !selectedFlipbook) {
      setSelectedFlipbook(slugFlipbook);
      setIsModalOpen(true);
    }
  }, [slug, slugFlipbook]);

  // Dynamic SEO when a flipbook is open
  const activeFlipbook = fullFlipbook || selectedFlipbook;
  useEffect(() => {
    if (!isModalOpen || !activeFlipbook) {
      applyLibreriaSeo();
      return;
    }

    const BASE_URL = 'https://bepelican.com';
    const fbUrl = `${BASE_URL}/biblioteca/${activeFlipbook.slug}`;
    const title = `${activeFlipbook.title} | Guía de viaje Colombia | BePelican`;
    const description = activeFlipbook.description
      ? activeFlipbook.description.substring(0, 160)
      : `Lee ${activeFlipbook.title} en BePelican. Guías de viaje, rutas y experiencias auténticas en Colombia.`;
    const image = activeFlipbook.cover_image || '';

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fbUrl);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:image', image);
    setCanonical(fbUrl);

    // JSON-LD structured data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      name: activeFlipbook.title,
      headline: activeFlipbook.title,
      description,
      url: fbUrl,
      ...(image && { image }),
      publisher: {
        '@type': 'Organization',
        name: 'BePelican',
        url: BASE_URL,
      },
    };

    let scriptEl = document.getElementById('flipbook-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'flipbook-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);
  }, [isModalOpen, activeFlipbook]);

  // Group flipbooks by category
  const shelves = useMemo(() => {
    const grouped: { category: FlipbookCategory; items: Flipbook[] }[] = [];

    categories.forEach((cat) => {
      const items = flipbooks.filter(fb =>
        fb.categories?.some(c => c.id === cat.id)
      );
      if (items.length > 0) grouped.push({ category: cat, items });
    });

    // Uncategorized
    const uncategorized = flipbooks.filter(fb => !fb.categories || fb.categories.length === 0);
    if (uncategorized.length > 0) {
      grouped.push({
        category: { id: 'other', name: 'Otros', slug: 'otros', description: null, icon: 'book-open', color: '#8B7355', display_order: 999 },
        items: uncategorized,
      });
    }

    // Filter by selected category
    if (selectedCategory) {
      return grouped.filter(g => g.category.slug === selectedCategory);
    }

    return grouped;
  }, [flipbooks, categories, selectedCategory]);

  const handleFlipbookClick = (flipbook: Flipbook) => {
    setSelectedFlipbook(flipbook);
    setIsModalOpen(true);
    window.history.pushState({}, '', `/biblioteca/${flipbook.slug}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFlipbook(null);
    window.history.pushState({}, '', '/biblioteca');
  };

  const isLoading = flipbooksLoading || categoriesLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF6F0' }}>
      <BePelicanHeader variant="light" showSearchBar={false} />

      <main className="pt-16">
        {/* Header - Vintage library feel */}
        <section className="py-10 md:py-14 border-b-2" style={{ borderColor: '#D4C5A9' }}>
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              {/* Ornamental top */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-16" style={{ backgroundColor: '#8B7355' }} />
                <BookOpen className="h-6 w-6" style={{ color: '#8B7355' }} />
                <div className="h-px w-16" style={{ backgroundColor: '#8B7355' }} />
              </div>

              <h1
                className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-3"
                style={{ color: '#3C2415', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Librería
              </h1>
              <p className="text-base md:text-lg max-w-xl mx-auto mb-8" style={{ color: '#6B5B4E' }}>
                Guías, bitácoras e historias para inspirar tu próximo viaje.
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8B7355' }} />
                <Input
                  type="text"
                  placeholder="Buscar en la librería..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-11 rounded-sm border-2 text-sm"
                  style={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#D4C5A9',
                    color: '#3C2415',
                    fontFamily: 'Georgia, serif',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category chips */}
        <section className="py-4 border-b" style={{ borderColor: '#E8DFD0' }}>
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-1.5 rounded-sm text-sm font-medium whitespace-nowrap transition-colors border",
                  selectedCategory === null
                    ? "text-white"
                    : "hover:opacity-80"
                )}
                style={{
                  backgroundColor: selectedCategory === null ? '#3C2415' : '#FFFDF8',
                  borderColor: '#D4C5A9',
                  color: selectedCategory === null ? '#FAF6F0' : '#6B5B4E',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "px-4 py-1.5 rounded-sm text-sm font-medium whitespace-nowrap transition-colors border"
                  )}
                  style={{
                    backgroundColor: selectedCategory === cat.slug ? '#3C2415' : '#FFFDF8',
                    borderColor: '#D4C5A9',
                    color: selectedCategory === cat.slug ? '#FAF6F0' : '#6B5B4E',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shelves */}
        {isLoading ? (
          <div className="container mx-auto px-6 py-10 space-y-12">
            {[1, 2].map(i => (
              <div key={i}>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="aspect-[3/4] w-full rounded-sm" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : shelves.length === 0 ? (
          <div className="container mx-auto px-6 py-20 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: '#C4B5A0' }} />
            <p className="text-lg font-serif" style={{ color: '#8B7355', fontFamily: 'Georgia, serif' }}>
              La librería está vacía por ahora.
            </p>
          </div>
        ) : (
          <div className="container mx-auto px-6 py-8 space-y-10">
            {shelves.map(({ category, items }) => (
              <div key={category.id}>
                {/* Shelf label */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: category.color || '#8B7355' }}
                  />
                  <h2
                    className="text-lg font-serif font-semibold tracking-wide uppercase"
                    style={{ color: '#3C2415', fontFamily: 'Georgia, serif', letterSpacing: '0.08em' }}
                  >
                    {category.name}
                  </h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#D4C5A9' }} />
                </div>

                {/* Shelf — books on wood */}
                <div
                  className="rounded-sm p-4 pb-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(139,115,85,0.06) 0%, rgba(139,115,85,0.12) 100%)',
                  }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                    {items.map((flipbook) => (
                      <button
                        key={flipbook.id}
                        onClick={() => handleFlipbookClick(flipbook)}
                        className="group text-left focus:outline-none"
                      >
                        {/* Book cover */}
                        <div
                          className="relative aspect-[3/4] rounded-sm overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1"
                          style={{
                            boxShadow: '4px 4px 12px rgba(60,36,21,0.15), inset -2px 0 4px rgba(60,36,21,0.1)',
                          }}
                        >
                          {flipbook.cover_image ? (
                            <img
                              src={flipbook.cover_image}
                              alt={flipbook.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center p-3"
                              style={{
                                background: `linear-gradient(135deg, ${category.color || '#8B7355'}dd, ${category.color || '#8B7355'}99)`,
                              }}
                            >
                              <span
                                className="text-3xl font-serif font-bold"
                                style={{ color: '#FAF6F0', fontFamily: 'Georgia, serif' }}
                              >
                                {flipbook.title.charAt(0)}
                              </span>
                              <span
                                className="text-xs mt-2 text-center leading-tight line-clamp-3"
                                style={{ color: '#FAF6F0CC', fontFamily: 'Georgia, serif' }}
                              >
                                {flipbook.title}
                              </span>
                            </div>
                          )}
                          {/* Spine effect */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-[3px]"
                            style={{ backgroundColor: 'rgba(60,36,21,0.2)' }}
                          />
                        </div>

                        {/* Title below */}
                        <h3
                          className="mt-2 text-sm font-serif font-medium line-clamp-2 group-hover:underline"
                          style={{ color: '#3C2415', fontFamily: 'Georgia, serif' }}
                        >
                          {flipbook.title}
                        </h3>
                        {flipbook.tags && flipbook.tags.length > 0 && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#8B7355' }}>
                            {flipbook.tags.slice(0, 2).join(' · ')}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Shelf wood edge */}
                  <div
                    className="h-3 -mx-4 rounded-b-sm"
                    style={{
                      background: 'linear-gradient(180deg, #C4A97D 0%, #A8906E 50%, #8B7355 100%)',
                      boxShadow: '0 4px 8px rgba(60,36,21,0.2)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BePelicanFooter />

      <FlipbookModal
        flipbook={fullFlipbook || selectedFlipbook}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Bitacora;
