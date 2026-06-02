import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Shield, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useAdminExperiences';
import { Button } from '@/components/ui/button';
import SearchBar from './SearchBar';
import LanguageToggle from './LanguageToggle';
import logoPrimary from '@/assets/logo-primary.png';
import logoWhite from '@/assets/logo-white.png';
import { cn } from '@/lib/utils';

interface BePelicanHeaderProps {
  variant?: 'light' | 'dark' | 'transparent';
  showSearchBar?: boolean;
}

const BePelicanHeader = ({ variant = 'transparent', showSearchBar = true }: BePelicanHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
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

  const navLinks = (
    <>
      <Link
        to="/experiencias"
        className={cn("font-medium transition-colors hover:text-bepelican-orange", textColor)}
      >
        {t('nav.experiences')}
      </Link>
      <Link
        to="/biblioteca"
        className={cn("font-medium transition-colors hover:text-bepelican-orange", textColor)}
      >
        Biblioteca
      </Link>
    </>
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        headerBg,
        scrolled && "border-b border-border/50"
      )}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex-shrink-0 z-10">
            <img
              src={logo}
              alt="BePelican"
              className={cn("transition-all duration-300", scrolled ? "h-10" : "h-12")}
            />
          </Link>

          <div className="hidden md:flex items-center justify-center flex-1">
            {showSearchBar && scrolled && isHome ? (
              <SearchBar isCompact={true} onExpandChange={setSearchExpanded} />
            ) : (
              <nav className="flex items-center gap-8">{navLinks}</nav>
            )}
          </div>

          <div className="flex items-center gap-2 z-10">
            <div className="hidden md:flex items-center gap-1">
              <button className={cn("p-2 rounded-full hover:bg-white/10 transition-colors", textColor)}>
                <Search className="h-5 w-5" />
              </button>
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
              className={cn("md:hidden p-2", textColor)}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {mobileMenuOpen && (
          <nav className="fixed top-0 left-0 bottom-0 w-72 bg-[#1a1a1a] z-50 md:hidden animate-fade-in shadow-2xl overflow-y-auto">
            <div className="flex flex-col p-6 gap-1">
              <div className="flex items-center justify-between mb-6">
                <img src={logoWhite} alt="BePelican" className="h-10" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/70 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <Link
                to="/experiencias"
                className="text-white font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.experiences')}
              </Link>
              <Link
                to="/biblioteca"
                className="text-white font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Biblioteca
              </Link>

              <div className="flex items-center gap-2 py-3 px-3">
                <span className="text-sm text-white/60">Idioma:</span>
                <LanguageToggle className="text-white" />
              </div>

              <hr className="border-white/10 my-2" />

              {user ? (
                <>
                  <Link
                    to="/mi-cuenta"
                    className="text-white font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.profile')}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-white font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      {t('nav.admin')}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-white/70 font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-bepelican-orange font-medium py-3 px-3 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default BePelicanHeader;
