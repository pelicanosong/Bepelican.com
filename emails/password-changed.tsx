import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BePelicanLayout,
  CtaButton,
  EMAIL_ASSETS,
  InfoBox,
  lead,
  leadLight,
  muted,
} from './_components/BePelicanLayout';

export type PasswordChangedEmailProps = {
  firstName?: string;
  supportEmail?: string;
};

export default function PasswordChangedEmail({
  firstName = 'viajero',
  supportEmail = 'management@bepelican.com',
}: PasswordChangedEmailProps) {
  return (
    <BePelicanLayout
      preview="Tu contraseña BePelican fue actualizada"
      heroTitle="CONTRASEÑA ACTUALIZADA"
      heroSubtitle={`Todo listo, ${firstName}.`}
      heroImage={EMAIL_ASSETS.heroPerse}
      footerContent={
        <>
          <InfoBox>
            <Text style={{ ...leadLight, margin: 0, fontSize: '13px' }}>
              ¿No fuiste vos? Escribinos a{' '}
              <a href={`mailto:${supportEmail}`} style={{ color: '#08949B' }}>
                {supportEmail}
              </a>
            </Text>
          </InfoBox>
          <Text style={muted}>BePelican · Turismo de transformación</Text>
        </>
      }
    >
      <Text style={lead}>Tu contraseña se cambió correctamente. Ya podés iniciar sesión.</Text>
      <CtaButton href="https://bepelican.com/login" label="Iniciar sesión" variant="accent" />
    </BePelicanLayout>
  );
}

PasswordChangedEmail.PreviewProps = {
  firstName: 'Nicolas',
} satisfies PasswordChangedEmailProps;
