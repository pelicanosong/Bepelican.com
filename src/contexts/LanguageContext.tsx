import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Header
    'nav.experiences': 'Experiencias',
    'nav.blog': 'Librería',
    'nav.about': 'Nosotros',
    'nav.login': 'Iniciar sesión',
    'nav.myAccount': 'Mi cuenta',
    'nav.profile': 'Mi Perfil',
    'nav.logout': 'Cerrar sesión',
    'nav.admin': 'Admin',
    
    // Categories Section
    'categories.badge': 'Explora por categoría',
    'categories.title': 'Explora con el',
    'categories.titleHighlight': 'corazón',
    'categories.subtitle': 'Cada camino te lleva a una historia diferente. ¿Cuál será la tuya?',
    'categories.viewExperiences': 'experiencias',
    
    // Category Names & Descriptions
    'category.naturaleza': 'Naturaleza',
    'category.naturaleza.desc': 'Selvas, páramos y biodiversidad',
    'category.comunidad': 'Comunidad',
    'category.comunidad.desc': 'Vive con familias locales',
    'category.aventura': 'Aventura',
    'category.aventura.desc': 'Trekking y expediciones',
    'category.transformacion': 'Transformación',
    'category.transformacion.desc': 'Retiros y sanación ancestral',
    'category.cultura': 'Cultura',
    'category.cultura.desc': 'Música, danza y tradiciones',
    'category.artesania': 'Artesanía',
    'category.artesania.desc': 'Crea con tus manos',
    'category.gastronomia': 'Gastronomía',
    'category.gastronomia.desc': 'Sabores ancestrales',
    
    // Featured Experiences
    'featured.badge': 'Experiencias destacadas',
    'featured.title': 'Historias que',
    'featured.titleHighlight': 'te esperan',
    'featured.viewAll': 'Ver todas las experiencias',
    'featured.viewMore': 'Ver más',
    'featured.with': 'Con',
    'featured.hours': 'horas',
    'featured.days': 'días',
    'featured.upTo': 'Hasta',
    'featured.perPerson': 'COP/persona',
    'featured.coming': 'Próximamente',
    'featured.comingDesc': 'Estamos preparando experiencias increíbles para ti',
    
    // Upcoming Section
    'upcoming.badge': 'Próximas salidas',
    'upcoming.title': 'No te quedes sin',
    'upcoming.titleHighlight': 'tu cupo',
    'upcoming.subtitle': 'Estas experiencias tienen fechas próximas y cupos limitados. ¡Reserva ahora y asegura tu lugar!',
    'upcoming.spots': 'cupos',
    'upcoming.soon': 'Próximamente',
    'upcoming.viewDates': 'Ver todas las fechas',
    
    // Newsletter
    'newsletter.title': 'Historias que llegan a tu correo',
    'newsletter.subtitle': 'Recibe inspiración de viaje, experiencias exclusivas y ofertas especiales antes que nadie. Sin spam, solo historias que valen la pena.',
    'newsletter.placeholder': 'tu@email.com',
    'newsletter.button': 'Quiero recibir historias',
    'newsletter.members': 'Únete a +2,500 viajeros conscientes 🌎',
    
    // Value Props
    'value.title': '"Tu historia empieza aquí"',
    'value.local.title': 'Experiencias locales',
    'value.local.desc': 'Conectamos viajeros con comunidades auténticas de Colombia',
    'value.responsible.title': 'Turismo responsable',
    'value.responsible.desc': 'Tu viaje apoya directamente el desarrollo de las comunidades locales',
    'value.unique.title': 'Aventuras únicas',
    'value.unique.desc': 'Experiencias cuidadosamente seleccionadas para momentos inolvidables',
    'value.explore': 'Comenzar a explorar',
    
    // Experience Popup
    'popup.duration': 'Duración',
    'popup.capacity': 'Capacidad',
    'popup.location': 'Ubicación',
    'popup.includes': 'Incluye',
    'popup.requirements': 'Requisitos',
    'popup.bookNow': 'Reservar ahora',
    'popup.moreInfo': 'Más información',
    'popup.people': 'personas',
    'popup.rating': 'calificación',

    // Common
    'common.all': 'Todas',
    'common.upTo': 'Hasta',
    'common.perPerson': '/ persona',
    'common.day': 'día',
    'common.days': 'días',
    'common.hours': 'horas',
    'common.min': 'min',
    'common.people': 'personas',
    'common.total': 'Total',

    // Experiences list
    'list.allTitle': 'Todas las Experiencias',
    'list.defaultDesc': 'Descubre aventuras únicas en Colombia',
    'list.experiencesIn': 'Experiencias en',
    'list.inCity': 'en',
    'list.resultsFor': 'Resultados para',
    'list.activeFilters': 'Filtros activos:',
    'list.clearAll': 'Limpiar todo',
    'list.categories': 'Categorías:',
    'list.clearFilters': 'Limpiar filtros',
    'list.viewAll': 'Ver todas las experiencias',
    'list.notFound': 'No encontramos experiencias',
    'list.notFoundFilters': 'No hay experiencias que coincidan con tus filtros. Intenta ajustar tu búsqueda.',
    'list.notFoundCategory': 'No encontramos experiencias en esta categoría. Prueba con otra categoría.',
    'list.notFoundEmpty': 'Estamos preparando experiencias increíbles para ti. ¡Vuelve pronto!',
    'list.foundOne': 'experiencia encontrada',
    'list.foundMany': 'experiencias encontradas',

    // Experience detail
    'exp.notFound.title': 'Experiencia no encontrada',
    'exp.notFound.desc': 'La experiencia que buscas no existe o ya no está disponible.',
    'exp.notFound.cta': 'Ver todas las experiencias',
    'exp.breadcrumb': 'Experiencias',
    'exp.about': 'Sobre esta experiencia',
    'exp.itinerary': 'Itinerario día a día',
    'exp.day': 'Día',
    'exp.difficulty': 'Dificultad',
    'exp.includes': '¿Qué incluye?',
    'exp.notIncludes': '¿Qué no incluye?',
    'exp.meetingPoint': 'Punto de encuentro',
    'exp.viewMaps': 'Ver en Google Maps',
    'exp.endPoint': 'Punto de finalización',
    'exp.flexibleSchedule': 'Horario flexible / a convenir',
    'exp.startTime': 'Hora de inicio:',
    'exp.climate': 'Información climática',
    'exp.typicalTemp': 'Temperatura típica',
    'exp.recommendedSeason': 'Temporada recomendada',
    'exp.recommendations': 'Recomendaciones',
    'exp.arrivalTips': 'Consejos de llegada',
    'exp.accessibilityNotes': 'Notas de accesibilidad',
    'exp.cancellation': 'Política de cancelación',
    'exp.upToPeople': 'Hasta {n} personas',
    'exp.selectDate': 'Selecciona una fecha',
    'exp.availableDays': 'Días disponibles',
    'exp.participants': 'Participantes',
    'exp.spotsAvailable': '{n} cupos disponibles',
    'exp.maxPeople': 'Máximo {n} personas',
    'exp.dayUnavailable': 'Este día no está disponible.',
    'exp.noSpots': 'No hay cupos disponibles.',
    'exp.experienceLine': 'Experiencia ({n} pers.)',
    'exp.dateUnavailable': 'Fecha no disponible',
    'exp.bookNow': 'Reservar ahora',
    'exp.share': 'Compartir',
    'exp.save': 'Guardar',
    'exp.bookExperience': 'Reservar experiencia',
    'exp.copPerPerson': 'COP/persona',
    'exp.toastDateTitle': 'Selecciona una fecha',
    'exp.toastDateDesc': 'Por favor selecciona una fecha para tu experiencia',

    // Difficulty
    'difficulty.baja': 'Baja',
    'difficulty.media': 'Media',
    'difficulty.alta': 'Alta',

    // Environment
    'env.rural': '🌾 Rural',
    'env.urbano': '🏙️ Urbano',
    'env.mixto': '🌆 Mixto',
    'env.costero': '🏖️ Costero',
    'env.montaña': '⛰️ Montaña',
    'env.selva': '🌿 Selva',
    'env.desierto': '🏜️ Desierto',

    // Weekdays
    'weekday.lunes': 'Lunes',
    'weekday.martes': 'Martes',
    'weekday.miercoles': 'Miércoles',
    'weekday.jueves': 'Jueves',
    'weekday.viernes': 'Viernes',
    'weekday.sabado': 'Sábado',
    'weekday.domingo': 'Domingo',

    // Accessibility
    'accessibility.children': 'Apto para niños',
    'accessibility.mobility': 'Movilidad reducida',
    'accessibility.pets': 'Mascotas permitidas',

    // Footer
    'footer.tagline': 'Turismo de transformación. Conectamos viajeros con experiencias auténticas que apoyan a las comunidades locales de Colombia.',
    'footer.explore': 'Explorar',
    'footer.allExperiences': 'Todas las Experiencias',
    'footer.library': 'Biblioteca',
    'footer.adventure': 'Aventura',
    'footer.culture': 'Cultura',
    'footer.gastronomy': 'Gastronomía',
    'footer.legal': 'Legal',
    'footer.terms': 'Términos y Condiciones',
    'footer.privacy': 'Política de Privacidad',
    'footer.contact': 'Contacto',
    'footer.rights': 'Todos los derechos reservados.',
  },
  en: {
    // Header
    'nav.experiences': 'Experiences',
    'nav.blog': 'Bookshop',
    'nav.about': 'About Us',
    'nav.login': 'Sign in',
    'nav.myAccount': 'My account',
    'nav.profile': 'My Profile',
    'nav.logout': 'Sign out',
    'nav.admin': 'Admin',
    
    // Categories Section
    'categories.badge': 'Explore by category',
    'categories.title': 'Explore with your',
    'categories.titleHighlight': 'heart',
    'categories.subtitle': 'Every path leads to a different story. What will yours be?',
    'categories.viewExperiences': 'experiences',
    
    // Category Names & Descriptions
    'category.naturaleza': 'Nature',
    'category.naturaleza.desc': 'Jungles, páramos and biodiversity',
    'category.comunidad': 'Community',
    'category.comunidad.desc': 'Live with local families',
    'category.aventura': 'Adventure',
    'category.aventura.desc': 'Trekking and expeditions',
    'category.transformacion': 'Transformation',
    'category.transformacion.desc': 'Retreats and ancestral healing',
    'category.cultura': 'Culture',
    'category.cultura.desc': 'Music, dance and traditions',
    'category.artesania': 'Crafts',
    'category.artesania.desc': 'Create with your hands',
    'category.gastronomia': 'Gastronomy',
    'category.gastronomia.desc': 'Ancestral flavors',
    
    // Featured Experiences
    'featured.badge': 'Featured experiences',
    'featured.title': 'Stories that',
    'featured.titleHighlight': 'await you',
    'featured.viewAll': 'View all experiences',
    'featured.viewMore': 'See more',
    'featured.with': 'With',
    'featured.hours': 'hours',
    'featured.days': 'days',
    'featured.upTo': 'Up to',
    'featured.perPerson': 'COP/person',
    'featured.coming': 'Coming soon',
    'featured.comingDesc': 'We are preparing incredible experiences for you',
    
    // Upcoming Section
    'upcoming.badge': 'Upcoming departures',
    'upcoming.title': "Don't miss your",
    'upcoming.titleHighlight': 'spot',
    'upcoming.subtitle': 'These experiences have upcoming dates and limited spots. Book now and secure your place!',
    'upcoming.spots': 'spots',
    'upcoming.soon': 'Coming soon',
    'upcoming.viewDates': 'View all dates',
    
    // Newsletter
    'newsletter.title': 'Stories delivered to your inbox',
    'newsletter.subtitle': 'Receive travel inspiration, exclusive experiences and special offers before anyone else. No spam, just stories worth telling.',
    'newsletter.placeholder': 'you@email.com',
    'newsletter.button': 'I want stories',
    'newsletter.members': 'Join +2,500 conscious travelers 🌎',
    
    // Value Props
    'value.title': '"Your story starts here"',
    'value.local.title': 'Local experiences',
    'value.local.desc': 'We connect travelers with authentic Colombian communities',
    'value.responsible.title': 'Responsible tourism',
    'value.responsible.desc': 'Your trip directly supports local community development',
    'value.unique.title': 'Unique adventures',
    'value.unique.desc': 'Carefully selected experiences for unforgettable moments',
    'value.explore': 'Start exploring',
    
    // Experience Popup
    'popup.duration': 'Duration',
    'popup.capacity': 'Capacity',
    'popup.location': 'Location',
    'popup.includes': 'Includes',
    'popup.requirements': 'Requirements',
    'popup.bookNow': 'Book now',
    'popup.moreInfo': 'More info',
    'popup.people': 'people',
    'popup.rating': 'rating',

    // Common
    'common.all': 'All',
    'common.upTo': 'Up to',
    'common.perPerson': '/ person',
    'common.day': 'day',
    'common.days': 'days',
    'common.hours': 'hours',
    'common.min': 'min',
    'common.people': 'people',
    'common.total': 'Total',

    // Experiences list
    'list.allTitle': 'All Experiences',
    'list.defaultDesc': 'Discover unique adventures in Colombia',
    'list.experiencesIn': 'Experiences in',
    'list.inCity': 'in',
    'list.resultsFor': 'Results for',
    'list.activeFilters': 'Active filters:',
    'list.clearAll': 'Clear all',
    'list.categories': 'Categories:',
    'list.clearFilters': 'Clear filters',
    'list.viewAll': 'View all experiences',
    'list.notFound': 'No experiences found',
    'list.notFoundFilters': 'No experiences match your filters. Try adjusting your search.',
    'list.notFoundCategory': 'No experiences in this category. Try another one.',
    'list.notFoundEmpty': "We're preparing incredible experiences for you. Check back soon!",
    'list.foundOne': 'experience found',
    'list.foundMany': 'experiences found',

    // Experience detail
    'exp.notFound.title': 'Experience not found',
    'exp.notFound.desc': "The experience you're looking for doesn't exist or is no longer available.",
    'exp.notFound.cta': 'View all experiences',
    'exp.breadcrumb': 'Experiences',
    'exp.about': 'About this experience',
    'exp.itinerary': 'Day-by-day itinerary',
    'exp.day': 'Day',
    'exp.difficulty': 'Difficulty',
    'exp.includes': "What's included",
    'exp.notIncludes': "What's not included",
    'exp.meetingPoint': 'Meeting point',
    'exp.viewMaps': 'View on Google Maps',
    'exp.endPoint': 'End point',
    'exp.flexibleSchedule': 'Flexible schedule / to be arranged',
    'exp.startTime': 'Start time:',
    'exp.climate': 'Climate info',
    'exp.typicalTemp': 'Typical temperature',
    'exp.recommendedSeason': 'Best time to visit',
    'exp.recommendations': 'Recommendations',
    'exp.arrivalTips': 'Arrival tips',
    'exp.accessibilityNotes': 'Accessibility notes',
    'exp.cancellation': 'Cancellation policy',
    'exp.upToPeople': 'Up to {n} people',
    'exp.selectDate': 'Select a date',
    'exp.availableDays': 'Available days',
    'exp.participants': 'Participants',
    'exp.spotsAvailable': '{n} spots available',
    'exp.maxPeople': 'Maximum {n} people',
    'exp.dayUnavailable': 'This day is not available.',
    'exp.noSpots': 'No spots available.',
    'exp.experienceLine': 'Experience ({n} pers.)',
    'exp.dateUnavailable': 'Date unavailable',
    'exp.bookNow': 'Book now',
    'exp.share': 'Share',
    'exp.save': 'Save',
    'exp.bookExperience': 'Book experience',
    'exp.copPerPerson': 'COP/person',
    'exp.toastDateTitle': 'Select a date',
    'exp.toastDateDesc': 'Please select a date for your experience',

    // Difficulty
    'difficulty.baja': 'Easy',
    'difficulty.media': 'Moderate',
    'difficulty.alta': 'Challenging',

    // Environment
    'env.rural': '🌾 Rural',
    'env.urbano': '🏙️ Urban',
    'env.mixto': '🌆 Mixed',
    'env.costero': '🏖️ Coastal',
    'env.montaña': '⛰️ Mountain',
    'env.selva': '🌿 Jungle',
    'env.desierto': '🏜️ Desert',

    // Weekdays
    'weekday.lunes': 'Monday',
    'weekday.martes': 'Tuesday',
    'weekday.miercoles': 'Wednesday',
    'weekday.jueves': 'Thursday',
    'weekday.viernes': 'Friday',
    'weekday.sabado': 'Saturday',
    'weekday.domingo': 'Sunday',

    // Accessibility
    'accessibility.children': 'Child-friendly',
    'accessibility.mobility': 'Reduced mobility',
    'accessibility.pets': 'Pets allowed',

    // Footer
    'footer.tagline': 'Travel That Means Something. We connect travelers with real experiences that support the people who actually live there in Colombia.',
    'footer.explore': 'Explore',
    'footer.allExperiences': 'All Experiences',
    'footer.library': 'Bookshop',
    'footer.adventure': 'Adventure',
    'footer.culture': 'Culture',
    'footer.gastronomy': 'Gastronomy',
    'footer.legal': 'Legal',
    'footer.terms': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('bepelican-language');
    return (stored as Language) || 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bepelican-language', lang);
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
