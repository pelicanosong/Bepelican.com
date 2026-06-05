#!/usr/bin/env node
/**
 * Aplica una migración SQL en Supabase Contabo vía SSH.
 * Uso: node scripts/apply-i18n-remote.mjs [ruta/migracion.sql]
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { homedir } from 'os';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.contabo');
const envPathVisible = resolve(root, 'accesos-bepelican.env');
const defaultMigration = 'supabase/migrations/20260531150000_i18n_content_translations.sql';
const migrationArg = process.argv[2];
const migrationPath = resolve(root, migrationArg || defaultMigration);

function loadContaboEnv() {
  const load = (path) => {
    if (!existsSync(path)) return {};
    const out = {};
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (val.includes('PEGA_')) continue;
      out[t.slice(0, i).trim()] = val;
    }
    return out;
  };

  if (!existsSync(envPath) && !existsSync(envPathVisible)) {
    console.error('✗ Falta accesos-bepelican.env en la raíz del proyecto');
    process.exit(1);
  }
  return { ...load(envPath), ...load(envPathVisible) };
}

function expandPath(p) {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

/** SSH con contraseña usando expect (viene en macOS, no requiere brew) */
function sshExecWithPassword({ target, password, remoteCmd, stdin }) {
  const sqlFile = resolve(tmpdir(), `bepelican-migrate-${randomBytes(6).toString('hex')}.sql`);
  const expectFile = resolve(tmpdir(), `bepelican-ssh-${randomBytes(6).toString('hex')}.exp`);
  writeFileSync(sqlFile, stdin, 'utf8');

  const expectScript = `
set timeout 180
log_user 1
spawn ssh -o StrictHostKeyChecking=accept-new ${target} ${remoteCmd}
expect {
  "yes/no" { send "yes\\r"; exp_continue }
  -re "(?i)password:" { send "${password.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$')}\\r" }
}
expect {
  "Permission denied" { puts "\\n✗ Contraseña incorrecta o acceso denegado"; exit 1 }
  "Connection refused" { puts "\\n✗ No se pudo conectar al servidor"; exit 1 }
  timeout { puts "\\n✗ Timeout esperando conexión SSH"; exit 1 }
}
set fp [open {${sqlFile}} r]
set sql [read $fp]
close $fp
send -i $spawn_id $sql
send -i $spawn_id "\\x04"
expect {
  timeout { }
  eof { }
}
catch wait result
set code [lindex $result 3]
if {$code != 0 && $code != ""} { exit $code }
exit 0
`;

  writeFileSync(expectFile, expectScript, 'utf8');

  try {
    return spawnSync('expect', [expectFile], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } finally {
    try {
      unlinkSync(sqlFile);
      unlinkSync(expectFile);
    } catch {
      /* ignore */
    }
  }
}

function sshExecWithKey({ target, keyPath, remoteCmd, stdin }) {
  return spawnSync(
    'ssh',
    ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'BatchMode=yes', '-i', keyPath, target, remoteCmd],
    { input: stdin, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
}

function main() {
  const env = loadContaboEnv();
  const host = env.CONTABO_SSH_HOST;
  const user = env.CONTABO_SSH_USER || 'root';
  const password = env.CONTABO_SSH_PASSWORD;
  let keyPath = env.CONTABO_SSH_KEY_PATH ? expandPath(env.CONTABO_SSH_KEY_PATH) : null;

  if (!host) {
    console.error('✗ Falta CONTABO_SSH_HOST en .env.contabo');
    process.exit(1);
  }

  if (!password && !keyPath) {
    const defaults = ['id_ed25519', 'id_rsa'].map((f) => resolve(homedir(), '.ssh', f));
    keyPath = defaults.find((p) => existsSync(p)) ?? null;
  }

  if (!password && !keyPath) {
    console.error('✗ Falta CONTABO_SSH_PASSWORD o CONTABO_SSH_KEY_PATH en .env.contabo');
    process.exit(1);
  }

  if (!existsSync(migrationPath)) {
    console.error('✗ No se encontró la migración SQL');
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, 'utf8');
  const remoteCmd =
    'docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1';

  const target = `${user}@${host}`;
  console.log(`→ Conectando a ${target} y aplicando ${migrationArg || defaultMigration}…\n`);

  const result = password
    ? sshExecWithPassword({ target, password, remoteCmd, stdin: sql })
    : sshExecWithKey({ target, keyPath, remoteCmd, stdin: sql });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    console.error('\n✗ Migración falló. Revisá contraseña, IP o contenedor supabase-db.');
    process.exit(1);
  }

  const isStorageRlsFix = migrationPath.includes('fix_experiences_storage_rls');
  const isCategoriesRlsFix = migrationPath.includes('fix_experience_categories_rls');
  const verifyCmd = isStorageRlsFix
    ? "docker exec supabase-db psql -U supabase_admin -d postgres -t -c \"SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND (policyname ILIKE '%experience%' OR policyname ILIKE '%lodging%') ORDER BY 1;\""
    : isCategoriesRlsFix
      ? "docker exec supabase-db psql -U supabase_admin -d postgres -t -c \"SELECT policyname FROM pg_policies WHERE schemaname='ecommerce' AND tablename='experience_categories' ORDER BY 1;\""
      : "docker exec supabase-db psql -U supabase_admin -d postgres -t -c \"SELECT table_name FROM information_schema.tables WHERE table_schema='ecommerce' AND (table_name LIKE 'i18n%' OR table_name='content_translations') ORDER BY 1;\"";

  const verify = password
    ? spawnSync('expect', ['-c', `
set timeout 60
spawn ssh -o StrictHostKeyChecking=accept-new ${target} ${verifyCmd}
expect {
  "yes/no" { send "yes\\r"; exp_continue }
  -re "(?i)password:" { send "${password.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$')}\\r" }
}
expect eof
`], { encoding: 'utf8' })
    : spawnSync('ssh', ['-o', 'StrictHostKeyChecking=accept-new', ...(keyPath ? ['-i', keyPath] : []), target, verifyCmd], {
        encoding: 'utf8',
      });

  if (verify.stdout?.trim()) {
    const label = isStorageRlsFix
      ? 'Políticas Storage'
      : isCategoriesRlsFix
        ? 'Políticas experience_categories'
        : 'Tablas en ecommerce';
    console.log(`\n✓ ${label}:`);
    console.log(
      verify.stdout
        .trim()
        .split('\n')
        .map((l) => `  · ${l.trim()}`)
        .join('\n')
    );
  }

  const doneMsg = isStorageRlsFix
    ? 'Fix de Storage (subida de fotos) aplicado en Contabo.'
    : isCategoriesRlsFix
      ? 'Fix de categorías (auto-guardado) aplicado en Contabo.'
      : 'Migración aplicada en Contabo.';
  console.log(`\n✓ ${doneMsg}`);
}

main();
