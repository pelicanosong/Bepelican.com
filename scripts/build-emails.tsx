#!/usr/bin/env tsx
/**
 * Compila templates React Email → HTML para la Edge Function.
 */
import React from 'react';
import { render } from '@react-email/render';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = resolve(root, 'emails/assets/logo-bepelican.png');
process.env.EMAIL_LOGO_URL = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;

// Import dinámico después de setear EMAIL_LOGO_URL (imports estáticos se hoistean)
const [
  { default: ConfirmSignupEmail },
  { default: ResetPasswordEmail },
  { default: WelcomeEmail },
  { default: PasswordChangedEmail },
] = await Promise.all([
  import('../emails/confirm-signup'),
  import('../emails/reset-password'),
  import('../emails/welcome'),
  import('../emails/password-changed'),
]);

const outDir = resolve(root, 'supabase/functions/send-auth-email/templates');
mkdirSync(outDir, { recursive: true });

const templates = [
  { name: 'confirm-signup', Component: ConfirmSignupEmail, props: ConfirmSignupEmail.PreviewProps },
  { name: 'reset-password', Component: ResetPasswordEmail, props: ResetPasswordEmail.PreviewProps },
  { name: 'welcome', Component: WelcomeEmail, props: WelcomeEmail.PreviewProps },
  { name: 'password-changed', Component: PasswordChangedEmail, props: PasswordChangedEmail.PreviewProps },
];

for (const t of templates) {
  const html = await render(<t.Component {...(t.props || {})} />);
  writeFileSync(resolve(outDir, `${t.name}.html`), html);
  console.log(`✓ ${t.name}.html`);
}

writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(templates.map((t) => t.name), null, 2));
console.log(`\nGenerado en ${outDir}`);
