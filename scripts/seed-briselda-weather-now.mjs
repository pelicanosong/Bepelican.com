#!/usr/bin/env node
/**
 * Rellena briselda.destination_weather (última hora) vía OpenWeatherMap.
 * Uso: node scripts/seed-briselda-weather-now.mjs
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

const DESTINOS = [
  { ciudad: 'El Cocuy', query: 'El Cocuy,CO' },
  { ciudad: 'Santa Marta', query: 'Santa Marta,CO' },
  { ciudad: 'Leticia', query: 'Leticia,CO' },
  { ciudad: 'Riohacha', query: 'Riohacha,CO' },
  { ciudad: 'Bogota', query: 'Bogota,CO' },
];

const owm = loadEnv(resolve(root, 'n8n/.env.openweather'));
const self = loadEnv(resolve(root, '.env.selfhosted'));
const key = owm.OPENWEATHER_API_KEY;
const url = (self.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = self.SERVICE_ROLE_KEY || self.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('✗ Falta OPENWEATHER_API_KEY en n8n/.env.openweather');
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error('✗ Falta .env.selfhosted (VITE_SUPABASE_URL, SERVICE_ROLE_KEY)');
  process.exit(1);
}

const hour = new Date();
hour.setUTCMinutes(0, 0, 0);
const snapshotHour = hour.toISOString();
const fetchedAt = new Date().toISOString();

for (const dest of DESTINOS) {
  const owmRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(dest.query)}&appid=${key}&units=metric&lang=es`,
  );
  if (!owmRes.ok) {
    console.error(`✗ OWM ${dest.ciudad}:`, await owmRes.text());
    continue;
  }
  const j = await owmRes.json();
  const w0 = j.weather?.[0] ?? {};
  const row = {
    ciudad: dest.ciudad,
    temperatura: j.main.temp,
    sensacion_termica: j.main.feels_like,
    humedad: j.main.humidity,
    descripcion: w0.description || '',
    viento_kmh: Math.round((j.wind?.speed ?? 0) * 3.6 * 10) / 10,
    presion: j.main.pressure ?? null,
    visibilidad_m: j.visibility ?? null,
    icono: w0.icon ?? null,
    condicion_id: w0.id ?? null,
    lat: j.coord?.lat ?? null,
    lon: j.coord?.lon ?? null,
    nubes_pct: j.clouds?.all ?? null,
    fetched_at: fetchedAt,
    snapshot_hour: snapshotHour,
  };

  const res = await fetch(
    `${url}/rest/v1/destination_weather?on_conflict=ciudad,snapshot_hour`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'briselda',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    },
  );
  if (!res.ok) {
    console.error(`✗ Supabase ${dest.ciudad}:`, await res.text());
    continue;
  }
  console.log(`✓ ${dest.ciudad} — ${row.sensacion_termica}°C sensación, ${row.descripcion}`);
}

console.log('\nListo. Recargá la ficha de experiencia.');
