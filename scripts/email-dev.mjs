#!/usr/bin/env node
/** Dev server React Email con logo oficial embebido */
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.EMAIL_LOGO_URL = `data:image/png;base64,${readFileSync(
  resolve(root, 'emails/assets/logo-bepelican.png')
).toString('base64')}`;

spawn('npx', ['email', 'dev', '--dir', 'emails', '--port', '3456'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
