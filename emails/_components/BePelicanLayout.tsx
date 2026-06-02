import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const BRAND = {
  turquoise: '#08949B',
  green: '#89A632',
  orange: '#F98419',
  deepblue: '#1C2F48',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  beige: '#F9F6F2',
  white: '#FFFFFF',
};

/** deepblue ~82% opaco — legible sobre foto en clientes de email */
const OVERLAY = '#1C2F48D9';

const SITE_URL = process.env.SITE_URL || 'https://bepelican.com';

/** Wordmark horizontal oficial (851×315) */
export const LOGO_WORDMARK = { width: 240, height: 89 };

/** Lee el logo en render — evita fallback al isotipo cuadrado por hoisting de imports */
export function getEmailLogoUrl(): string {
  return (
    process.env.EMAIL_LOGO_URL ||
    'https://bepelican.com/assets/logo-bepelican-primary.png'
  );
}

export const EMAIL_ASSETS = {
  heroDefault:
    'https://faobrifmlrgxaejnwmep.supabase.co/storage/v1/object/public/experiences/nevado-del-cocuy-salida-jueves/nevado-del-cocuy-salida-jueves-cover.jpg',
  heroWelcome:
    'https://faobrifmlrgxaejnwmep.supabase.co/storage/v1/object/public/experiences/guajira-3-dias-2-noches/guajira-3-dias-2-noches-cover.jpg',
  heroReset:
    'https://faobrifmlrgxaejnwmep.supabase.co/storage/v1/object/public/experiences/monserrate-camino-antiguo/monserrate-camino-antiguo-cover.jpg',
  heroPerse:
    'https://faobrifmlrgxaejnwmep.supabase.co/storage/v1/object/public/experiences/la-chimba-de-farra/la-chimba-de-farra-cover.jpg',
};

export type BePelicanLayoutProps = {
  preview: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroImage?: string;
  /** Contenido sobre la foto (texto, íconos, CTA) */
  children: React.ReactNode;
  /** Debajo del hero: avisos legales, cajas info (opcional) */
  footerContent?: React.ReactNode;
};

export function BePelicanLayout({
  preview,
  heroTitle,
  heroSubtitle,
  heroImage = EMAIL_ASSETS.heroDefault,
  children,
  footerContent,
}: BePelicanLayoutProps) {
  const logoUrl = getEmailLogoUrl();

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Hero: foto + overlay + todo el contenido principal */}
          <Section
            style={{
              ...heroWithImage,
              backgroundImage: `url('${heroImage}')`,
            }}
          >
            <Section style={heroOverlay}>
              <Img
                src={logoUrl}
                width={String(LOGO_WORDMARK.width)}
                height={String(LOGO_WORDMARK.height)}
                alt="BePelican"
                style={logoHero}
              />
              <Text style={heroEyebrow}>TURISMO DE TRANSFORMACIÓN</Text>
              <Heading style={heroTitleStyle}>{heroTitle}</Heading>
              {heroSubtitle ? <Text style={heroSubtitleStyle}>{heroSubtitle}</Text> : null}
              {children}
            </Section>
          </Section>

          <Section style={heroAccentBar} />

          {footerContent ? <Section style={belowHero}>{footerContent}</Section> : null}

          <Section style={footerBand}>
            <Row>
              <Column align="center">
                <Text style={footerBrand}>BePelican</Text>
                <Text style={footerTagline}>Colombia auténtica · Comunidades locales</Text>
                <Text style={footerLinks}>
                  <Link href={`${SITE_URL}/experiencias`} style={footerLink}>
                    Experiencias
                  </Link>
                  {'  ·  '}
                  <Link href={`${SITE_URL}/biblioteca`} style={footerLink}>
                    Biblioteca
                  </Link>
                  {'  ·  '}
                  <Link href="mailto:management@bepelican.com" style={footerLink}>
                    Ayuda
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function CtaButton({
  href,
  label,
  variant = 'accent',
}: {
  href: string;
  label: string;
  variant?: 'primary' | 'accent' | 'outline';
}) {
  const styles =
    variant === 'primary'
      ? buttonPrimary
      : variant === 'outline'
        ? buttonOutline
        : buttonAccent;
  return (
    <Section style={{ textAlign: 'center' as const, margin: '20px 0 4px' }}>
      <Button href={href} style={styles}>
        {label} →
      </Button>
    </Section>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return <Section style={infoBox}>{children}</Section>;
}

export function StepList({
  steps,
  onDark = false,
}: {
  steps: { number: string; title: string; desc: string; emoji: string }[];
  onDark?: boolean;
}) {
  return (
    <Section style={{ ...stepsSection, borderTopColor: onDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }}>
      <Text style={onDark ? stepsHeadingDark : stepsHeading}>EN 3 PASOS</Text>
      {steps.map((s) => (
        <Row key={s.number} style={stepRow}>
          <Column style={stepIconCol}>
            <Text style={{ ...stepCircle, backgroundColor: onDark ? BRAND.orange : BRAND.deepblue }}>
              <span style={stepEmoji}>{s.emoji}</span>
            </Text>
          </Column>
          <Column style={stepTextCol}>
            <Text style={onDark ? stepNumberDark : stepNumber}>PASO {s.number}</Text>
            <Text style={onDark ? stepTitleDark : stepTitle}>{s.title}</Text>
            <Text style={onDark ? stepDescDark : stepDesc}>{s.desc}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

export function FeatureRow({
  items,
  onDark = true,
}: {
  items: { label: string; emoji: string }[];
  onDark?: boolean;
}) {
  return (
    <Section style={onDark ? featureSectionDark : featureSection}>
      <Row>
        {items.map((item) => (
          <Column key={item.label} style={featureCol}>
            <Text style={featureEmoji}>{item.emoji}</Text>
            <Text style={onDark ? featureLabelDark : featureLabel}>{item.label}</Text>
          </Column>
        ))}
      </Row>
    </Section>
  );
}

export const paragraph = {
  color: BRAND.deepblue,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
  fontFamily: "Georgia, 'Times New Roman', serif",
};

export const muted = {
  color: BRAND.gray,
  fontSize: '12px',
  lineHeight: '18px',
  margin: '12px 0 0',
  fontFamily: 'Arial, Helvetica, sans-serif',
  textAlign: 'center' as const,
};

export const lead = {
  color: BRAND.white,
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0 12px',
  fontFamily: "Georgia, 'Times New Roman', serif",
  textAlign: 'center' as const,
};

export const leadLight = {
  ...paragraph,
  fontSize: '15px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};

const main = {
  backgroundColor: BRAND.beige,
  margin: 0,
  padding: 0,
};

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: BRAND.white,
};

const heroWithImage = {
  backgroundColor: BRAND.deepblue,
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  margin: 0,
  padding: 0,
};

const heroOverlay = {
  backgroundColor: OVERLAY,
  padding: '28px 24px 32px',
  textAlign: 'center' as const,
};

const logoHero = {
  margin: '0 auto 14px',
  display: 'block',
};

const heroEyebrow = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: '10px',
  fontWeight: '700' as const,
  letterSpacing: '0.14em',
  margin: '0 0 10px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const heroTitleStyle = {
  color: BRAND.white,
  fontSize: '26px',
  fontWeight: '900' as const,
  lineHeight: '1.15',
  margin: '0',
  letterSpacing: '-0.01em',
  textTransform: 'uppercase' as const,
  fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
};

const heroSubtitleStyle = {
  color: 'rgba(255,255,255,0.92)',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '10px 0 0',
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const heroAccentBar = {
  height: '4px',
  backgroundColor: BRAND.orange,
  margin: 0,
};

const belowHero = {
  padding: '20px 24px 16px',
  backgroundColor: BRAND.white,
};

const buttonPrimary = {
  backgroundColor: BRAND.deepblue,
  borderRadius: '9999px',
  color: BRAND.white,
  fontSize: '13px',
  fontWeight: '700' as const,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  border: `2px solid ${BRAND.white}`,
};

const buttonAccent = {
  ...buttonPrimary,
  backgroundColor: BRAND.orange,
  border: `2px solid ${BRAND.orange}`,
};

const buttonOutline = {
  ...buttonPrimary,
  backgroundColor: 'transparent',
  color: BRAND.white,
  border: `2px solid ${BRAND.white}`,
};

const infoBox = {
  backgroundColor: BRAND.lightGray,
  borderRadius: '10px',
  border: `2px dashed ${BRAND.turquoise}`,
  padding: '14px 18px',
  margin: '0',
  textAlign: 'center' as const,
};

const stepsSection = {
  marginTop: '20px',
  paddingTop: '18px',
  borderTop: '1px solid #E5E7EB',
};

const stepsHeading = {
  color: BRAND.deepblue,
  fontSize: '11px',
  fontWeight: '800' as const,
  letterSpacing: '0.12em',
  margin: '0 0 14px',
  fontFamily: 'Arial Black, Arial, sans-serif',
  textAlign: 'left' as const,
};

const stepsHeadingDark = { ...stepsHeading, color: BRAND.white, textAlign: 'center' as const };

const stepRow = { marginBottom: '14px' };
const stepIconCol = { width: '48px', verticalAlign: 'top' as const };
const stepTextCol = { verticalAlign: 'top' as const, paddingLeft: '6px' };

const stepCircle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  textAlign: 'center' as const,
  lineHeight: '40px',
  margin: 0,
};

const stepEmoji = { fontSize: '18px', lineHeight: '40px' };

const stepNumber = {
  color: BRAND.turquoise,
  fontSize: '10px',
  fontWeight: '700' as const,
  letterSpacing: '0.08em',
  margin: '0 0 2px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const stepNumberDark = { ...stepNumber, color: BRAND.orange };

const stepTitle = {
  color: BRAND.deepblue,
  fontSize: '13px',
  fontWeight: '700' as const,
  margin: '0 0 2px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  textTransform: 'uppercase' as const,
};

const stepTitleDark = { ...stepTitle, color: BRAND.white };

const stepDesc = {
  color: BRAND.gray,
  fontSize: '13px',
  lineHeight: '18px',
  margin: 0,
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const stepDescDark = { ...stepDesc, color: 'rgba(255,255,255,0.85)' };

const featureSection = {
  backgroundColor: BRAND.beige,
  borderRadius: '10px',
  padding: '14px 8px',
  margin: '16px 0 8px',
};

const featureSectionDark = {
  backgroundColor: 'rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '12px 8px',
  margin: '16px 0 4px',
  border: '1px solid rgba(255,255,255,0.15)',
};

const featureCol = { textAlign: 'center' as const, width: '33.33%' };
const featureEmoji = { fontSize: '22px', margin: '0 0 4px', textAlign: 'center' as const };

const featureLabel = {
  color: BRAND.deepblue,
  fontSize: '11px',
  fontWeight: '700' as const,
  margin: 0,
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const featureLabelDark = { ...featureLabel, color: BRAND.white };

const footerBand = {
  backgroundColor: BRAND.deepblue,
  padding: '22px 20px',
  textAlign: 'center' as const,
};

const footerBrand = {
  color: BRAND.white,
  fontSize: '16px',
  fontWeight: '700' as const,
  margin: '0 0 4px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const footerTagline = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '12px',
  margin: '0 0 10px',
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const footerLinks = { color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: 0 };
const footerLink = { color: BRAND.orange, textDecoration: 'none', fontWeight: '600' as const };
