#!/usr/bin/env node
/**
 * Prueba end-to-end sin n8n: Frankfurter → moni_exchange.daily_rates
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(path) {
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
}

const PAIRS = {
  EUR: 'EUR/USD',
  CAD: 'CAD/USD',
  GBP: 'GBP/USD',
  MXN: 'MXN/USD',
  ARS: 'ARS/USD',
  CLP: 'CLP/USD',
  BRL: 'BRL/USD',
  COP: 'COP/USD',
};

const env = loadEnv(resolve(root, '.env.selfhosted'));
const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').replace(/\/$/, '');
const key = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('✗ Falta .env.selfhosted con VITE_SUPABASE_URL y SERVICE_ROLE_KEY');
  process.exit(1);
}

const to = new Date().toISOString().slice(0, 10);
const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const blendedUrl = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,MXN,CAD,BRL,CLP,ARS,COP&from=${from}&to=${to}`;
const banrepUrl = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=COP&providers=BANREP&from=${from}&to=${to}`;

console.log('→ Frankfurter (blended + Banrep COP)…');
const [blendedRows, banrepRows] = await Promise.all([
  fetch(blendedUrl).then((r) => r.json()),
  fetch(banrepUrl).then((r) => r.json()),
]);

if (!Array.isArray(blendedRows) || !blendedRows.length) {
  console.error('✗ Sin datos Frankfurter blended');
  process.exit(1);
}
if (!Array.isArray(banrepRows) || !banrepRows.length) {
  console.error('✗ Sin datos Frankfurter BANREP para COP');
  process.exit(1);
}

const byQuote = {};
for (const row of blendedRows) {
  if (!row?.quote || row.quote === 'COP') continue;
  if (!byQuote[row.quote]) byQuote[row.quote] = [];
  byQuote[row.quote].push(row);
}

const copRows = banrepRows.filter((r) => r?.quote === 'COP' && r.rate != null);
if (copRows.length) byQuote.COP = copRows;

const fetchedAt = new Date().toISOString();
const payload = [];

for (const [quote, series] of Object.entries(byQuote)) {
  series.sort((a, b) => a.date.localeCompare(b.date));
  const latest = series[series.length - 1];
  const rates = series.map((s) => Number(s.rate));
  payload.push({
    rate_date: latest.date,
    base_currency: 'USD',
    quote_currency: quote,
    par: PAIRS[quote] || `${quote}/USD`,
    c: Number(latest.rate),
    h: Math.max(...rates),
    rate: Number(latest.rate),
    source: 'frankfurter',
    provider: quote === 'COP' ? 'banrep' : 'blended',
    fetched_at: fetchedAt,
  });
}

console.log(`→ Upsert ${payload.length} filas en moni_exchange.daily_rates…`);

const res = await fetch(`${url}/rest/v1/daily_rates?on_conflict=rate_date,quote_currency`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Content-Profile': 'moni_exchange',
    Prefer: 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify(payload),
});

const body = await res.text();
if (!res.ok) {
  console.error(`✗ Supabase ${res.status}:`, body.slice(0, 300));
  process.exit(1);
}

const saved = JSON.parse(body);
console.log(`✓ Guardadas ${saved.length} tasas (rate_date ${saved[0]?.rate_date})`);
console.log('  Pares:', saved.map((r) => `${r.par} (${r.provider})`).join(', '));
