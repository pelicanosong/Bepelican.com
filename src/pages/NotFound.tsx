import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import BePelicanHeader from "@/components/bepelican/BePelicanHeader";
import BePelicanFooter from "@/components/bepelican/BePelicanFooter";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BePelicanHeader variant="light" showSearchBar={false} />
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="text-center max-w-md">
          <p className="text-6xl font-display text-bepelican-orange mb-4">404</p>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Página no encontrada</h1>
          <p className="text-muted-foreground mb-8">
            La ruta que buscas no existe o fue movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-bepelican-orange hover:bg-bepelican-orange/90 rounded-full">
              <Link to="/">Ir al inicio</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/experiencias">Ver experiencias</Link>
            </Button>
          </div>
        </div>
      </main>
      <BePelicanFooter />
    </div>
  );
};

export default NotFound;
