#!/usr/bin/env node
/**
 * Una sola vez: llena el cuerpo de cada experiencia en Notion con plantilla + datos de Supabase.
 * Uso: npm run notion:bootstrap
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnv,
  loadNotionDatabaseIds,
  createNotionClient,
  propTitle,
  propRichText,
  blockPlainText,
  heading2,
  heading3,
  paragraph,
  bullet,
  divider,
} from './lib/notion-client.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(root, 'supabase/migration-data/experiences.json');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');

function buildContentBlocks(exp) {
  const blocks = [
    divider(),
    heading2('Descripción completa'),
    paragraph(exp.description?.trim() || '(Sin descripción)'),
    divider(),
    heading2('Incluye'),
    ...(exp.includes?.length ? exp.includes.map(bullet) : [paragraph('(Vacío)')]),
    divider(),
    heading2('No incluye'),
    ...(exp.not_includes?.length ? exp.not_includes.map(bullet) : [paragraph('(Vacío)')]),
    divider(),
    heading2('Qué llevar'),
    ...(exp.requirements?.length ? exp.requirements.map(bullet) : [paragraph('(Vacío)')]),
  ];

  if (exp.itinerary?.length) {
    blocks.push(divider(), heading2('Itinerario'));
    for (const day of exp.itinerary) {
      blocks.push(heading3(`Día ${day.dayNumber} — ${day.title}`));
      for (const act of day.activities || []) {
        if (act.description) blocks.push(bullet(act.description));
      }
    }
  }

  return blocks;
}

function pageHasTemplate(blocks) {
  return blocks.some(
    (b) => b.type === 'heading_2' && blockPlainText(b).toLowerCase().includes('descripción completa')
  );
}

async function main() {
  const env = loadEnv();
  const token = env.NOTION_TOKEN || env.NOTION_API_KEY;
  if (!token) throw new Error('Falta NOTION_TOKEN en .env.notion');

  const dbIds = loadNotionDatabaseIds();
  const experiences = JSON.parse(readFileSync(dataPath, 'utf8'));
  const bySlug = Object.fromEntries(experiences.map((e) => [e.slug, e]));
  const byId = Object.fromEntries(experiences.map((e) => [e.id, e]));

  const { queryDatabase, getAllPageBlocks, appendBlocks } = createNotionClient(token);
  const pages = await queryDatabase(dbIds.experiencias);

  let updated = 0;
  let skipped = 0;

  for (const page of pages) {
    const p = page.properties;
    const slug = propRichText(p.slug);
    const supabaseId = propRichText(p.supabase_id);
    const title = propTitle(p.titulo);
    const exp = bySlug[slug] || byId[supabaseId];
    if (!exp) {
      console.log(`  ⊘ ${title} — sin datos locales, saltando`);
      skipped++;
      continue;
    }

    const blocks = await getAllPageBlocks(page.id);
    if (pageHasTemplate(blocks) && !force) {
      console.log(`  ⊘ ${title} — ya tiene plantilla`);
      skipped++;
      continue;
    }

    const contentBlocks = buildContentBlocks(exp);
    for (let i = 0; i < contentBlocks.length; i += 100) {
      await appendBlocks(page.id, contentBlocks.slice(i, i + 100));
    }
    console.log(`  ✓ ${title}`);
    updated++;
  }

  console.log(`\n✓ Bootstrap listo: ${updated} actualizadas, ${skipped} omitidas`);
  if (skipped && !force) console.log('  Tip: npm run notion:bootstrap -- --force para volver a escribir');
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
