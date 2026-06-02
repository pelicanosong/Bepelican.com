import { Link } from 'react-router-dom';
import { ArrowRight, Search, CalendarCheck, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Elige tu experiencia',
    description: 'Explora nuestro catálogo de aventuras auténticas en Colombia. Filtra por destino, categoría o tipo de viaje.',
    color: 'bg-primary/10',
    iconColor: 'text-primary',
    accent: 'border-primary',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Reserva en línea',
    description: 'Selecciona tu fecha, elige la cantidad de personas y paga de forma segura. Tu cupo queda confirmado al instante.',
    color: 'bg-bepelican-orange/10',
    iconColor: 'text-bepelican-orange',
    accent: 'border-bepelican-orange',
  },
  {
    number: '03',
    icon: Compass,
    title: 'Viaja y transforma',
    description: 'Vive una experiencia inolvidable con comunidades locales. Tu viaje genera impacto real y recuerdos para toda la vida.',
    color: 'bg-bepelican-green/10',
    iconColor: 'text-bepelican-green',
    accent: 'border-bepelican-green',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium tracking-widest uppercase text-bepelican-orange mb-4">
            Así de fácil
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            En solo 3 pasos estarás viviendo la aventura de tu vida
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-28 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-primary via-bepelican-orange to-bepelican-green opacity-20" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              <div className={`relative rounded-3xl border-2 border-transparent hover:${step.accent} bg-card p-8 pt-10 text-center transition-all duration-500 hover:shadow-xl hover:-translate-y-2`}>
                {/* Step number floating badge */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className={`w-10 h-10 rounded-full ${step.color} border-2 ${step.accent} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${step.iconColor}`}>{step.number}</span>
                  </div>
                </div>

                {/* Icon */}
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <step.icon className={`h-10 w-10 ${step.iconColor}`} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  {step.description}
                </p>

                {/* Arrow connector (mobile) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center mt-6">
                    <ArrowRight className="h-6 w-6 text-border rotate-90" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/experiencias">
            <Button
              size="lg"
              className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-accent-foreground rounded-full px-10 h-14 text-base shadow-lg shadow-bepelican-orange/20 transition-all hover:shadow-xl hover:shadow-bepelican-orange/30"
            >
              Explorar experiencias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
