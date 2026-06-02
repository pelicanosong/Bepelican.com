#!/usr/bin/env node
/**
 * Despliega dist/ en Contabo (nginx + /var/www/bepelican).
 * Uso: npm run deploy:contabo
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { homedir } from 'os';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const nginxConfigPath = resolve(dirname(fileURLToPath(import.meta.url)), 'nginx-bepelican.conf');

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
  return {
    ...load(resolve(root, '.env.contabo')),
    ...load(resolve(root, 'accesos-bepelican.env')),
  };
}

function expandPath(p) {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

function escapeExpect(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
}

function runExpectSpawn(args, { password, timeout = 300 }) {
  const expectFile = resolve(tmpdir(), `bepelican-deploy-${randomBytes(6).toString('hex')}.exp`);
  const spawnLine = args.map((a) => `"${escapeExpect(a)}"`).join(' ');
  const expectScript = `
set timeout ${timeout}
log_user 1
spawn ${spawnLine}
expect {
  "yes/no" { send "yes\\r"; exp_continue }
  -re "(?i)password:" { send "${escapeExpect(password)}\\r" }
}
expect eof
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
      unlinkSync(expectFile);
    } catch {
      /* ignore */
    }
  }
}

function ssh({ target, password, keyPath, cmd, stdin, timeout = 180 }) {
  const sshArgs = ['-o', 'StrictHostKeyChecking=accept-new', ...(keyPath ? ['-i', keyPath] : []), target, cmd];
  if (keyPath) {
    return spawnSync('ssh', sshArgs, {
      input: stdin,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  if (!stdin) {
    return runExpectSpawn(['ssh', ...sshArgs], { password, timeout });
  }

  const stdinFile = resolve(tmpdir(), `bepelican-stdin-${randomBytes(6).toString('hex')}.txt`);
  const expectFile = resolve(tmpdir(), `bepelican-ssh-${randomBytes(6).toString('hex')}.exp`);
  writeFileSync(stdinFile, stdin, 'utf8');
  const spawnLine = ['ssh', ...sshArgs].map((a) => `"${escapeExpect(a)}"`).join(' ');

  const expectScript = `
set timeout ${timeout}
log_user 1
spawn ${spawnLine}
expect {
  "yes/no" { send "yes\\r"; exp_continue }
  -re "(?i)password:" { send "${escapeExpect(password)}\\r" }
}
expect {
  "Permission denied" { exit 1 }
  timeout { exit 1 }
}
set fp [open {${stdinFile}} r]
set data [read $fp]
close $fp
send -i $spawn_id $data
send -i $spawn_id "\\x04"
expect eof
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
      unlinkSync(stdinFile);
      unlinkSync(expectFile);
    } catch {
      /* ignore */
    }
  }
}

function scpRecursive({ target, password, keyPath, localDir, remotePath }) {
  const tarFile = resolve(tmpdir(), `bepelican-dist-${randomBytes(6).toString('hex')}.tar.gz`);
  spawnSync('tar', ['-czf', tarFile, '-C', localDir, '.'], { stdio: 'inherit' });
  const remoteTar = `/tmp/bepelican-dist-${randomBytes(4).toString('hex')}.tar.gz`;

  let result;
  if (keyPath) {
    result = spawnSync('scp', ['-o', 'StrictHostKeyChecking=accept-new', '-i', keyPath, tarFile, `${target}:${remoteTar}`], {
      encoding: 'utf8',
    });
  } else {
    result = runExpectSpawn(
      ['scp', '-o', 'StrictHostKeyChecking=accept-new', tarFile, `${target}:${remoteTar}`],
      { password, timeout: 600 }
    );
  }

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  const extract = ssh({
    target,
    password,
    keyPath,
    cmd: `mkdir -p ${remotePath} && tar -xzf ${remoteTar} -C ${remotePath} && rm -f ${remoteTar} && chmod -R a+rX ${remotePath}`,
    timeout: 120,
  });

  try {
    unlinkSync(tarFile);
  } catch {
    /* ignore */
  }

  return extract;
}

function main() {
  if (!existsSync(distDir)) {
    console.error('✗ Falta dist/. Corré: npm run build');
    process.exit(1);
  }

  const env = loadContaboEnv();
  const host = env.CONTABO_SSH_HOST;
  const user = env.CONTABO_SSH_USER || 'root';
  const password = env.CONTABO_SSH_PASSWORD;
  let keyPath = env.CONTABO_SSH_KEY_PATH ? expandPath(env.CONTABO_SSH_KEY_PATH) : null;

  if (!host) {
    console.error('✗ Falta CONTABO_SSH_HOST');
    process.exit(1);
  }

  if (!password && !keyPath) {
    const defaults = ['id_ed25519', 'id_rsa'].map((f) => resolve(homedir(), '.ssh', f));
    keyPath = defaults.find((p) => existsSync(p)) ?? null;
  }

  if (!password && !keyPath) {
    console.error('✗ Falta CONTABO_SSH_PASSWORD en .env.contabo');
    process.exit(1);
  }

  const target = `${user}@${host}`;
  const webRoot = env.CONTABO_WEB_ROOT || '/var/www/bepelican';
  const nginxConf = readFileSync(nginxConfigPath, 'utf8');

  console.log(`→ Desplegando a ${target}:${webRoot}\n`);

  // 1. Instalar nginx si falta
  console.log('1/4 Verificando nginx…');
  const nginxCheck = ssh({
    target,
    password,
    keyPath,
    cmd: 'command -v nginx >/dev/null 2>&1 && echo OK || (apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y nginx && echo INSTALLED)',
    timeout: 300,
  });
  if (nginxCheck.stdout) process.stdout.write(nginxCheck.stdout);
  if (nginxCheck.stderr) process.stderr.write(nginxCheck.stderr);
  if (nginxCheck.status !== 0) {
    console.error('✗ No se pudo instalar/verificar nginx');
    process.exit(1);
  }

  // 2. Subir dist
  console.log('\n2/4 Subiendo dist/…');
  const upload = scpRecursive({ target, password, keyPath, localDir: distDir, remotePath: webRoot });
  if (upload.status !== 0) {
    console.error(upload.stderr || upload.stdout);
    console.error('✗ Falló la subida');
    process.exit(1);
  }
  console.log('   ✓ Archivos subidos');

  // 3. nginx config
  console.log('\n3/4 Configurando nginx…');
  const setupNginx = ssh({
    target,
    password,
    keyPath,
    cmd: 'cat > /etc/nginx/sites-available/bepelican && ln -sf /etc/nginx/sites-available/bepelican /etc/nginx/sites-enabled/bepelican && rm -f /etc/nginx/sites-enabled/default 2>/dev/null; nginx -t && systemctl enable nginx && systemctl reload nginx && echo NGINX_OK',
    stdin: nginxConf,
    timeout: 60,
  });
  if (setupNginx.stdout) process.stdout.write(setupNginx.stdout);
  if (setupNginx.stderr) process.stderr.write(setupNginx.stderr);
  if (setupNginx.status !== 0 || !setupNginx.stdout?.includes('NGINX_OK')) {
    console.error('✗ Error en nginx');
    process.exit(1);
  }

  // 4. Verificar
  console.log('\n4/4 Verificando respuesta local…');
  const verify = ssh({
    target,
    password,
    keyPath,
    cmd: `curl -sI -m 5 -H 'Host: bepelican.com' http://127.0.0.1/ | head -5 && ls -la ${webRoot}/index.html`,
    timeout: 30,
  });
  if (verify.stdout) console.log(verify.stdout);

  console.log('\n✓ Deploy completado en Contabo.');
  console.log(`  Web root: ${webRoot}`);
  console.log(`  Probar: http://${host} (Host: bepelican.com)`);
  console.log('  Siguiente: Cloudflare DNS → A @ y www →', host, '(proxied)');
}

main();
