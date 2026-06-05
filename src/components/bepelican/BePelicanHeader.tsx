import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Shield, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useAdminExperiences';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import SearchBar from './SearchBar';
import { MobileSearchSheet } from './MobileSearchSheet';
import LanguageToggle from './LanguageToggle';
import logoPrimary from '@/assets/logo-primary.png';
import logoWhite from '@/assets/logo-white.png';
import { cn } from '@/lib/utils';

interface BePelicanHeaderProps {
  variant?: 'light' | 'dark' | 'transparent';
  showSearchBar?: boolean;
}

const MOBILE_NAV_ID = 'bepelican-mobile-nav';

const BePelicanHeader = ({ variant = 'transparent', showSearchBar = true }: BePelicanHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin({ enabled: !!user });
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(header);
    return () => ro.disconnect();
  }, [scrolled, searchExpanded, mobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isTransparent = variant === 'transparent' && !scrolled && isHome;
  const textColor = isTransparent ? 'text-white' : 'text-foreground';
  const logo = isTransparent ? logoWhite : logoPrimary;
  const headerBg = scrolled || !isTransparent
    ? 'bg-white/95 backdrop-blur-md shadow-sm'
    : 'bg-transparent';

  const openSearch = () => {
    if (window.innerWidth >= 768) {
      if (isHome && showSearchBar) {
        setSearchExpanded(true);
      } else {
        setDesktopSearchOpen(true);
      }
    } else {
      setMobileSearchOpen(true);
    }
  };

  const navLinks = (
    <>
      <Link
        to="/experiencias"
        className={cn('font-medium transition-colors hover:text-bepelican-orange', textColor)}
      >
        {t('nav.experiences')}
      </Link>
      <Link
        to="/biblioteca"
        className={cn('font-medium transition-colors hover:text-bepelican-orange', textColor)}
      >
        Biblioteca
      </Link>
    </>
  );

  const mobileNavLinkClass =
    'text-white font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors min-h-11 flex items-center';

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          headerBg,
          scrolled && 'border-b border-border/50'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex-shrink-0 z-10">
              <img
                src={logo}
                alt="BePelican"
                className={cn('transition-all duration-300', scrolled ? 'h-10' : 'h-12')}
              />
            </Link>

            <div className="hidden md:flex items-center justify-center flex-1">
              {showSearchBar && scrolled && isHome ? (
                <SearchBar isCompact={true} onExpandChange={setSearchExpanded} />
              ) : (
                <nav className="flex items-center gap-8">{navLinks}</nav>
              )}
            </div>

            <div className="flex items-center gap-1 z-10">
              {showSearchBar && (
                <button
                  type="button"
                  onClick={openSearch}
                  className={cn(
                    'min-h-11 min-w-11 flex items-center justify-center rounded-full transition-colors',
                    isTransparent ? 'hover:bg-white/10' : 'hover:bg-muted',
                    textColor
                  )}
                  aria-label="Buscar experiencias"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              <div className="hidden md:flex items-center gap-1">
                <LanguageToggle className={textColor} />
              </div>

              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 text-foreground hover:text-bepelican-orange transition-colors text-sm font-medium"
                    >
                      <Shield className="h-4 w-4" />
                      {t('nav.admin')}
                    </Link>
                  )}
                  <Link
                    to="/mi-cuenta"
                    className="text-sm font-medium text-foreground hover:text-bepelican-orange transition-colors"
                  >
                    {t('nav.profile')}
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="rounded-full"
                  >
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <Link to="/login" className="hidden md:block">
                  <Button className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full px-6">
                    {t('nav.login')}
                  </Button>
                </Link>
              )}

              <button
                type="button"
                className={cn(
                  'md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-full transition-colors',
                  isTransparent ? 'hover:bg-white/10' : 'hover:bg-muted',
                  textColor
                )}
                onClick={() => setMobileMenuOpen(true)}
                aria-expanded={mobileMenuOpen}
                aria-controls={MOBILE_NAV_ID}
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {showSearchBar && scrolled && searchExpanded && (
            <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border/50 py-4 px-6 shadow-lg">
              <div className="max-w-3xl mx-auto">
                <SearchBar onExpandChange={setSearchExpanded} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          id={MOBILE_NAV_ID}
          side="left"
          className="w-72 max-w-[85vw] bg-bepelican-deepblue text-white border-none p-0 [&>button.absolute]:min-h-11 [&>button.absolute]:min-w-11 [&>button.absolute]:text-white/70 [&>button.absolute]:hover:text-white"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10 text-left">
            <img src={logoWhite} alt="BePelican" className="h-10" />
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col p-4 gap-1">
            <button
              type="button"
              className={cn(mobileNavLinkClass, 'text-bepelican-orange font-semibold gap-2 w-full text-left')}
              onClick={() => {
                setMobileMenuOpen(false);
                setMobileSearchOpen(true);
              }}
            >
              <Search className="h-5 w-5" />
              Buscar experiencias
            </button>

            <Link
              to="/experiencias"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.experiences')}
            </Link>
            <Link
              to="/biblioteca"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Biblioteca
            </Link>

            <div className="flex items-center gap-2 py-3 px-3 min-h-11">
              <span className="text-sm text-white/60">Idioma:</span>
              <LanguageToggle className="text-white" />
            </div>

            <hr className="border-white/10 my-2" />

            {user ? (
              <>
                <Link
                  to="/mi-cuenta"
                  className={mobileNavLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={cn(mobileNavLinkClass, 'gap-2')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className={cn(mobileNavLinkClass, 'text-white/70 w-full text-left')}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={cn(mobileNavLinkClass, 'text-bepelican-orange')}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.login')}
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Mobile search sheet */}
      <MobileSearchSheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />

      {/* Desktop search sheet (non-home pages) */}
      <Sheet open={desktopSearchOpen} onOpenChange={setDesktopSearchOpen}>
        <SheetContent side="top" className="pt-12">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="font-display">Buscar experiencias</SheetTitle>
          </SheetHeader>
          <SearchBar onSearchComplete={() => setDesktopSearchOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BePelicanHeader;
