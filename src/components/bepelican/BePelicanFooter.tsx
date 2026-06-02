import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Linkedin } from 'lucide-react';
import logoWhite from '@/assets/logo-white.png';

const BePelicanFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={logoWhite} alt="BePelican" className="h-10 mb-4" />
            <p className="text-sm opacity-80 leading-relaxed">
              Turismo de transformación. Conectamos viajeros con experiencias auténticas 
              que apoyan a las comunidades locales de Colombia.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="font-display text-lg mb-4">Explorar</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/experiencias" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Todas las Experiencias
                </Link>
              </li>
              <li>
                <Link to="/biblioteca" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Biblioteca
                </Link>
              </li>
              <li>
                <Link to="/experiencias?categoria=aventura" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Aventura
                </Link>
              </li>
              <li>
                <Link to="/experiencias?categoria=cultura" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Cultura
                </Link>
              </li>
              <li>
                <Link to="/experiencias?categoria=gastronomia" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Gastronomía
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terminos" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-display text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm opacity-80">
                <MapPin className="h-4 w-4" />
                <span>Bogotá, Colombia</span>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-80">
                <Phone className="h-4 w-4" />
                <a href="http://wa.me/573135525944" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">+57 313 552 5944</a>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-80">
                <Mail className="h-4 w-4" />
                <a href="mailto:management@bepelican.com" className="hover:opacity-100 transition-opacity">management@bepelican.com</a>
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a 
                href="https://www.instagram.com/bepelican/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="http://wa.me/573135525944" 
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/company/bepelicanorg/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-sm opacity-60">
            © {new Date().getFullYear()} BePelican. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BePelicanFooter;
