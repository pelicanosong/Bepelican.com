import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BePelicanLayout,
  CtaButton,
  EMAIL_ASSETS,
  InfoBox,
  lead,
  leadLight,
} from './_components/BePelicanLayout';

export type ResetPasswordEmailProps = {
  firstName?: string;
  resetUrl: string;
};

export default function ResetPasswordEmail({ firstName = 'viajero', resetUrl }: ResetPasswordEmailProps) {
  return (
    <BePelicanLayout
      preview="Restablecé tu contraseña BePelican"
      heroTitle="RECUPERÁ TU ACCESO"
      heroSubtitle={`Hola ${firstName}, volvé a tu cuenta en un clic.`}
      heroImage={EMAIL_ASSETS.heroReset}
      footerContent={
        <InfoBox>
          <Text style={{ ...leadLight, margin: 0, fontSize: '13px' }}>
            🔒 Enlace seguro · Expira en <strong>1 hora</strong>
            <br />
            ¿No pediste esto? Ignorá el correo.
          </Text>
        </InfoBox>
      }
    >
      <Text style={lead}>Creá una nueva contraseña y seguí explorando Colombia con BePelican.</Text>
      <CtaButton href={resetUrl} label="Crear nueva contraseña" variant="accent" />
    </BePelicanLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  firstName: 'Nicolas',
  resetUrl: 'https://bepelican.com/login?reset=example',
} satisfies ResetPasswordEmailProps;
