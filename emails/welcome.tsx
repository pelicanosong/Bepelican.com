import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BePelicanLayout,
  CtaButton,
  EMAIL_ASSETS,
  FeatureRow,
  StepList,
  lead,
} from './_components/BePelicanLayout';

export type WelcomeEmailProps = {
  firstName?: string;
  experiencesUrl?: string;
};

export default function WelcomeEmail({
  firstName = 'viajero',
  experiencesUrl = 'https://bepelican.com/experiencias',
}: WelcomeEmailProps) {
  return (
    <BePelicanLayout
      preview="Bienvenido a BePelican"
      heroTitle={`BIENVENIDO, ${firstName.toUpperCase()}`}
      heroSubtitle="Colombia auténtica te espera."
      heroImage={EMAIL_ASSETS.heroWelcome}
    >
      <Text style={lead}>Tu cuenta está lista. Menos turismo de pasaporte, más conexión con el territorio.</Text>

      <FeatureRow
        items={[
          { emoji: '🌿', label: 'Experiencias' },
          { emoji: '📍', label: 'Destinos' },
          { emoji: '💚', label: 'Impacto' },
        ]}
      />

      <StepList
        onDark
        steps={[
          { number: '1', title: 'Tu perfil', desc: 'Completá Mi Cuenta.', emoji: '👤' },
          { number: '2', title: 'Explorá', desc: 'Elegí tu experiencia.', emoji: '🗺️' },
          { number: '3', title: 'Reservá', desc: 'Cupos limitados.', emoji: '🎒' },
        ]}
      />

      <CtaButton href={experiencesUrl} label="Ver experiencias" variant="accent" />
    </BePelicanLayout>
  );
}

WelcomeEmail.PreviewProps = {
  firstName: 'Nicolas',
} satisfies WelcomeEmailProps;
