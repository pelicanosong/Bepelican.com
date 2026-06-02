#!/usr/bin/env node
/**
 * Genera preview HTML estático — abrís index.html en el navegador, sin servidor.
 * Uso: npm run email:preview
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(root, 'supabase/functions/send-auth-email/templates');
const outDir = resolve(root, 'emails/preview');

execSync('npm run email:build', { cwd: root, stdio: 'inherit' });
mkdirSync(outDir, { recursive: true });

const templates = JSON.parse(readFileSync(resolve(srcDir, 'manifest.json'), 'utf8'));
const labels = {
  'confirm-signup': 'Confirmar cuenta',
  'reset-password': 'Recuperar contraseña',
  welcome: 'Bienvenida',
  'password-changed': 'Contraseña cambiada',
};

for (const name of templates) {
  copyFileSync(resolve(srcDir, `${name}.html`), resolve(outDir, `${name}.html`));
}

copyFileSync(
  resolve(root, 'emails/assets/logo-bepelican.png'),
  resolve(outDir, 'logo-bepelican.png')
);

const links = templates
  .map(
    (name) =>
      `<li><a href="${name}.html" target="_blank">${labels[name] || name}</a></li>`
  )
  .join('\n');

const indexPath = resolve(outDir, 'index.html');
writeFileSync(
  indexPath,
  `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Emails BePelican — Preview</title>
  <style>
    body { font-family: Georgia, serif; max-width: 480px; margin: 48px auto; padding: 0 24px; color: #1C2F48; }
    h1 { color: #08949B; font-size: 1.5rem; }
    a { color: #F98419; font-size: 1.1rem; }
    li { margin: 12px 0; }
    p { color: #6B7280; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Emails BePelican</h1>
  <p>Preview offline — no necesitás servidor. Clic en cada email:</p>
  <ul>${links}</ul>
</body>
</html>`
);

console.log(`\n✓ Preview listo: ${indexPath}`);
console.log('  Abrí ese archivo en Chrome/Safari (doble clic o arrastrá al navegador).\n');

try {
  execSync(`open "${indexPath}"`, { stdio: 'ignore' });
} catch {
  // ignore
}
