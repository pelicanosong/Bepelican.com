#!/usr/bin/env node
/**
 * Asigna rol admin en ecommerce.user_roles.
 * Si el usuario no existe en Auth, lo crea (email confirmado) vía Admin API.
 *
 * Uso: node scripts/grant-admin.mjs email1@x.com email2@y.com
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const load = (path) => {
    if (!existsSync(path)) return {};
    const out = {};
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return out;
  };
  return {
    ...load(resolve(root, '.env')),
    ...load(resolve(root, '.env.selfhosted')),
  };
}

const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);
if (!emails.length) {
  console.error('Uso: node scripts/grant-admin.mjs email@ejemplo.com ...');
  process.exit(1);
}

const env = loadEnv();
const supabaseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Falta VITE_SUPABASE_URL y SERVICE_ROLE_KEY en .env.selfhosted');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'ecommerce' },
});

async function ensureUser(email) {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const found = list.users.find((u) => u.email?.toLowerCase() === email);
  if (found) return { id: found.id, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  return { id: data.user.id, created: true };
}

async function grantAdmin(userId, email) {
  const { error } = await supabase.from('user_roles').upsert(
    { user_id: userId, role: 'admin' },
    { onConflict: 'user_id,role' }
  );
  if (error) throw error;
  console.log(`✓ admin → ${email} (${userId})`);
}

async function main() {
  console.log(`Supabase: ${supabaseUrl}\n`);
  for (const email of emails) {
    try {
      const { id, created } = await ensureUser(email);
      if (created) console.log(`  cuenta creada: ${email}`);
      await grantAdmin(id, email);
    } catch (e) {
      console.error(`✗ ${email}: ${e.message}`);
    }
  }
  console.log('\nListo. Inicien sesión en https://bepelican.com/auth y abran /admin');
}

main();
