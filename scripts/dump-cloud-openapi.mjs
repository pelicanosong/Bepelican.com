import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').replace(/^"|"$/g, '')];
    })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/openapi+json',
  },
});

if (!res.ok) {
  console.error('OpenAPI fetch failed', res.status, await res.text());
  process.exit(1);
}

const spec = await res.json();
writeFileSync(resolve(__dirname, '../tmp-cloud-openapi.json'), JSON.stringify(spec, null, 2));
console.log('Tables:', Object.keys(spec.definitions || {}).filter((k) => !k.startsWith('')).length);
console.log('Saved tmp-cloud-openapi.json');
