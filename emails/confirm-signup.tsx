import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BePelicanLayout,
  CtaButton,
  FeatureRow,
  InfoBox,
  lead,
  leadLight,
  muted,
} from './_components/BePelicanLayout';

export type ConfirmSignupEmailProps = {
  firstName?: string;
  confirmUrl: string;
};

export default function ConfirmSignupEmail({ firstName = 'viajero', confirmUrl }: ConfirmSignupEmailProps) {
  return (
    <BePelicanLayout
      preview="Confirmá tu cuenta en BePelican"
      heroTitle={`TU VIAJE EMPIEZA, ${firstName.toUpperCase()}`}
      heroSubtitle="Confirmá tu correo y accedé a cupos limitados."
      footerContent={
        <>
          <InfoBox>
            <Text style={{ ...leadLight, margin: 0 }}>
              Este enlace expira en <strong>24 horas</strong>.
              <br />
              Si no creaste esta cuenta, ignorá este mensaje.
            </Text>
          </InfoBox>
          <Text style={muted}>Turismo de transformación — BePelican · Colombia</Text>
        </>
      }
    >
      <Text style={lead}>
        Gracias por unirte. Guardá tu perfil y reservá experiencias auténticas con comunidades locales.
      </Text>

      <FeatureRow
        items={[
          { emoji: '🏔️', label: 'Naturaleza' },
          { emoji: '🤝', label: 'Comunidades' },
          { emoji: '✨', label: 'Transformación' },
        ]}
      />

      <CtaButton href={confirmUrl} label="Confirmar mi cuenta" variant="accent" />
    </BePelicanLayout>
  );
}

ConfirmSignupEmail.PreviewProps = {
  firstName: 'Nicolas',
  confirmUrl: 'https://bepelican.com/auth/callback?token=example',
} satisfies ConfirmSignupEmailProps;
