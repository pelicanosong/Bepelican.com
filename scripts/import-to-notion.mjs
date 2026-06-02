#!/usr/bin/env node
/**
 * Crea las 3 bases de Notion + filas desde notion-templates/*.csv
 *
 * Setup (una vez):
 *   1. https://www.notion.so/my-integrations → New integration → copiar token
 *   2. En Notion: página destino → ⋯ → Connections → agregar la integration
 *   3. Copiar ID de esa página (de la URL)
 *   4. Crear .env.notion en la raíz del proyecto (ver notion-templates/notion.env.example)
 *
 * Uso:
 *   node scripts/generate-notion-templates.mjs   # opcional, regenera CSVs
 *   node scripts/import-to-notion.mjs
 *   node scripts/import-to-notion.mjs --dry-run
 *   node scripts/import-to-notion.mjs --fresh      # ignora import previo
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = resolve(root, 'notion-templates');
const statePath = resolve(templatesDir, '.notion-import.json');

const NOTION_VERSION = '2022-06-28';
const REQUEST_DELAY_MS = 350;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const fresh = args.has('--fresh');

// --- env ---
function loadEnvFile(path) {
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

const env = {
  ...loadEnvFile(resolve(root, '.env')),
  ...loadEnvFile(resolve(root, '.env.notion')),
  ...process.env,
};

const token = env.NOTION_TOKEN || env.NOTION_API_KEY;
const parentRaw = env.NOTION_PARENT_PAGE_ID || env.NOTION_PAGE_ID;

function extractNotionId(input) {
  if (!input) return null;
  const hex = input.replace(/[^0-9a-f]/gi, '');
  const m = hex.match(/([0-9a-f]{32})$/i);
  if (!m) return null;
  const id = m[1].toLowerCase();
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

const parentInputId = extractNotionId(parentRaw);

// --- CSV ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || (c === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.some((cell) => cell !== '') || rows.length === 0) rows.push(row);
      row = [];
      if (c === '\r') i++;
    } else if (c !== '\r') {
      field += c;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((h, idx) => [h, cells[idx] ?? '']))
  );
}

function readCsv(name) {
  const path = resolve(templatesDir, name);
  if (!existsSync(path)) {
    throw new Error(`Falta ${name}. Ejecutá: node scripts/generate-notion-templates.mjs`);
  }
  return parseCsv(readFileSync(path, 'utf8'));
}

// --- Notion API ---
let lastRequest = 0;

async function notion(method, path, body) {
  const wait = REQUEST_DELAY_MS - (Date.now() - lastRequest);
  if (wait > 0) await sleep(wait);

  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  lastRequest = Date.now();
  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || res.statusText;
    throw new Error(`Notion API ${res.status}: ${msg}`);
  }
  return data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Notion solo permite crear bases bajo una página, no bajo otra base. */
async function resolveParentPageId(inputId) {
  if (!inputId) return null;
  if (dryRun) return inputId;

  let pageError = null;
  try {
    const page = await notion('GET', `/pages/${inputId}`);
    if (page.object === 'page') return inputId;
  } catch (e) {
    pageError = e.message;
  }

  try {
    const db = await notion('GET', `/databases/${inputId}`);
    const { parent } = db;

    if (parent.type === 'page_id') {
      console.log('   ℹ El ID es una base de datos; uso la página contenedora.');
      return parent.page_id;
    }

    if (parent.type === 'block_id') {
      console.log('   ℹ El ID es una base inline; busco la página padre.');
      try {
        return await findPageIdFromBlock(parent.block_id);
      } catch {
        console.log('   ℹ Sin acceso a la página padre → creo "BePelican Catálogo" en el workspace.');
        return createWorkspaceContainerPage();
      }
    }

    if (parent.type === 'workspace') {
      console.log('   ℹ Creo página contenedora "BePelican Catálogo" en el workspace.');
      return createWorkspaceContainerPage();
    }
  } catch {
    // no es base de datos
  }

  if (pageError?.includes('404')) {
    throw new Error(
      'No encuentro esa página. Abrila en Notion → ⋯ → Connections → agregá "Catalogo | Bepelican.com".'
    );
  }

  throw new Error(
    'NOTION_PARENT_PAGE_ID inválido o sin acceso. Usá el ID de una página compartida con la integration.'
  );
}

async function createWorkspaceContainerPage() {
  const container = await notion('POST', '/pages', {
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: { title: [{ type: 'text', text: { content: 'BePelican Catálogo' } }] },
    },
  });
  return container.id;
}

async function findPageIdFromBlock(blockId) {
  let current = blockId;
  for (let i = 0; i < 20; i++) {
    const block = await notion('GET', `/blocks/${current}`);
    if (block.parent.type === 'page_id') return block.parent.page_id;
    if (block.parent.type === 'block_id') {
      current = block.parent.block_id;
      continue;
    }
    break;
  }
  throw new Error('No pude encontrar la página contenedora de esa base de datos.');
}

let parentId = parentInputId;

const txt = (content) =>
  content
    ? { rich_text: [{ type: 'text', text: { content: String(content).slice(0, 2000) } }] }
    : { rich_text: [] };

const titleProp = (content) => ({
  title: [{ type: 'text', text: { content: String(content || 'Sin título').slice(0, 2000) } }],
});

const num = (value) => {
  if (value === '' || value == null) return { number: null };
  const n = Number(value);
  return { number: Number.isFinite(n) ? n : null };
};

const sel = (value) => (value ? { select: { name: String(value) } } : { select: null });

const urlProp = (value) => ({ url: value && String(value).startsWith('http') ? String(value) : null });

const selectOptions = (names, color = 'default') =>
  names.map((name) => ({ name, color }));

async function createDatabase(name, properties) {
  if (dryRun) {
    console.log(`  [dry-run] crear base: ${name}`);
    return { id: `dry-${name}` };
  }
  return notion('POST', '/databases', {
    parent: { type: 'page_id', page_id: parentId },
    title: [{ type: 'text', text: { content: name } }],
    properties,
  });
}

async function createRow(databaseId, properties) {
  if (dryRun) return { id: 'dry-row' };
  return notion('POST', '/pages', {
    parent: { type: 'database_id', database_id: databaseId },
    properties,
  });
}

function ruleTitle(row) {
  if (row.etiqueta?.trim()) return row.etiqueta.trim();
  const parts = [row.experiencia_slug, row.origen || row.tipo_regla, row.precio_cop].filter(Boolean);
  return parts.join(' · ') || 'Regla de precio';
}

async function main() {
  console.log('BePelican → Notion import\n');

  if (!token && !dryRun) {
    console.error('Falta NOTION_TOKEN en .env.notion (ver notion-templates/notion.env.example)');
    process.exit(1);
  }
  if (!parentInputId && !dryRun) {
    console.error('Falta NOTION_PARENT_PAGE_ID en .env.notion');
    process.exit(1);
  }

  parentId = await resolveParentPageId(parentInputId);
  if (!parentId && !dryRun) {
    console.error('No se pudo resolver la página contenedora en Notion.');
    process.exit(1);
  }

  if (!fresh && existsSync(statePath) && !dryRun) {
    const prev = JSON.parse(readFileSync(statePath, 'utf8'));
    console.log('Ya importaste antes:');
    console.log(`  Categorías:  ${prev.urls?.categorias || prev.databaseIds?.categorias}`);
    console.log(`  Experiencias: ${prev.urls?.experiencias || prev.databaseIds?.experiencias}`);
    console.log(`  Reglas:      ${prev.urls?.reglas || prev.databaseIds?.reglas}`);
    console.log('\nPara volver a importar: node scripts/import-to-notion.mjs --fresh');
    process.exit(0);
  }

  const categorias = readCsv('1-categorias.csv');
  const experiencias = readCsv('2-experiencias.csv');
  const reglas = readCsv('3-reglas-precio.csv');

  console.log(`Datos: ${categorias.length} categorías, ${experiencias.length} experiencias, ${reglas.length} reglas`);
  if (dryRun) console.log('Modo dry-run (sin llamadas a Notion)\n');

  // 1. Categorías
  console.log('1/3 Categorías BePelican…');
  const catDb = await createDatabase('Categorías BePelican', {
    nombre: { title: {} },
    slug: { rich_text: {} },
    icono: { rich_text: {} },
    color: { rich_text: {} },
    orden: { number: { format: 'number' } },
    activa: { select: { options: selectOptions(['Sí', 'No'], 'green') } },
    supabase_id: { rich_text: {} },
  });

  const catPageBySlug = {};
  for (const row of categorias) {
    const page = await createRow(catDb.id, {
      nombre: titleProp(row.nombre),
      slug: txt(row.slug),
      icono: txt(row.icono),
      color: txt(row.color),
      orden: num(row.orden),
      activa: sel(row.activa),
      supabase_id: txt(row.supabase_id),
    });
    catPageBySlug[row.slug] = page.id;
  }
  console.log(`   ✓ ${categorias.length} filas`);

  // 2. Experiencias
  console.log('2/3 Experiencias BePelican…');
  const expDb = await createDatabase('Experiencias BePelican', {
    titulo: { title: {} },
    slug: { rich_text: {} },
    estado: {
      select: {
        options: selectOptions(['activa', 'borrador', 'pausada', 'eliminada'], 'green'),
      },
    },
    tipo_precio: {
      select: {
        options: selectOptions(
          ['fixed', 'per_person', 'per_origin', 'per_accommodation', 'per_origin_accommodation'],
          'blue'
        ),
      },
    },
    precio_base_cop: { number: { format: 'number' } },
    duracion_minutos: { number: { format: 'number' } },
    unidad_duracion: { select: { options: selectOptions(['minutes', 'hours', 'days']) } },
    ciudad: { rich_text: {} },
    departamento: { rich_text: {} },
    nombre_lugar: { rich_text: {} },
    descripcion_corta: { rich_text: {} },
    imagen_portada: { url: {} },
    min_participantes: { number: { format: 'number' } },
    max_participantes: { number: { format: 'number' } },
    dificultad: { select: { options: selectOptions(['baja', 'media', 'alta']) } },
    requiere_hospedaje: { select: { options: selectOptions(['Sí', 'No']) } },
    categorias_slugs: { rich_text: {} },
    orden_grid: { number: { format: 'number' } },
    supabase_id: { rich_text: {} },
    Categorías: {
      relation: {
        database_id: catDb.id,
        type: 'dual_property',
        dual_property: { synced_property_name: 'Experiencias' },
      },
    },
  });

  const expPageBySlug = {};
  for (const row of experiencias) {
    const catIds = (row.categorias_slugs || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((slug) => catPageBySlug[slug])
      .filter(Boolean)
      .map((id) => ({ id }));

    const page = await createRow(expDb.id, {
      titulo: titleProp(row.titulo),
      slug: txt(row.slug),
      estado: sel(row.estado),
      tipo_precio: sel(row.tipo_precio),
      precio_base_cop: num(row.precio_base_cop),
      duracion_minutos: num(row.duracion_minutos),
      unidad_duracion: sel(row.unidad_duracion),
      ciudad: txt(row.ciudad),
      departamento: txt(row.departamento),
      nombre_lugar: txt(row.nombre_lugar),
      descripcion_corta: txt(row.descripcion_corta),
      imagen_portada: urlProp(row.imagen_portada),
      min_participantes: num(row.min_participantes),
      max_participantes: num(row.max_participantes),
      dificultad: sel(row.dificultad),
      requiere_hospedaje: sel(row.requiere_hospedaje),
      categorias_slugs: txt(row.categorias_slugs),
      orden_grid: num(row.orden_grid),
      supabase_id: txt(row.supabase_id),
      Categorías: { relation: catIds },
    });
    expPageBySlug[row.slug] = page.id;
  }
  console.log(`   ✓ ${experiencias.length} filas`);

  // 3. Reglas de precio
  console.log('3/3 Reglas de precio BePelican…');
  const regDb = await createDatabase('Reglas de precio BePelican', {
    etiqueta: { title: {} },
    experiencia_slug: { rich_text: {} },
    tipo_regla: { rich_text: {} },
    precio_cop: { number: { format: 'number' } },
    min_pax: { number: { format: 'number' } },
    max_pax: { number: { format: 'number' } },
    origen: { rich_text: {} },
    orden: { number: { format: 'number' } },
    activa: { select: { options: selectOptions(['Sí', 'No'], 'green') } },
    supabase_id: { rich_text: {} },
    Experiencia: {
      relation: {
        database_id: expDb.id,
        type: 'dual_property',
        dual_property: { synced_property_name: 'Reglas de precio' },
      },
    },
  });

  let ruleCount = 0;
  for (const row of reglas) {
    const expId = expPageBySlug[row.experiencia_slug];
    await createRow(regDb.id, {
      etiqueta: titleProp(ruleTitle(row)),
      experiencia_slug: txt(row.experiencia_slug),
      tipo_regla: txt(row.tipo_regla),
      precio_cop: num(row.precio_cop),
      min_pax: num(row.min_pax),
      max_pax: num(row.max_pax),
      origen: txt(row.origen),
      orden: num(row.orden),
      activa: sel(row.activa),
      supabase_id: txt(row.supabase_id),
      Experiencia: expId ? { relation: [{ id: expId }] } : { relation: [] },
    });
    ruleCount++;
    if (ruleCount % 50 === 0) process.stdout.write(`   … ${ruleCount}/${reglas.length}\r`);
  }
  console.log(`   ✓ ${reglas.length} filas`);

  const notionUrl = (dbId) =>
    dryRun ? '(dry-run)' : `https://www.notion.so/${dbId.replace(/-/g, '')}`;

  const state = {
    importedAt: new Date().toISOString(),
    parentPageId: parentId,
    databaseIds: {
      categorias: catDb.id,
      experiencias: expDb.id,
      reglas: regDb.id,
    },
    urls: {
      categorias: notionUrl(catDb.id),
      experiencias: notionUrl(expDb.id),
      reglas: notionUrl(regDb.id),
    },
    counts: {
      categorias: categorias.length,
      experiencias: experiencias.length,
      reglas: reglas.length,
    },
  };

  if (!dryRun) {
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  console.log('\n✓ Listo en Notion');
  console.log(`  Categorías:   ${state.urls.categorias}`);
  console.log(`  Experiencias: ${state.urls.experiencias}`);
  console.log(`  Reglas:       ${state.urls.reglas}`);
  if (!dryRun) {
    console.log(`\nEstado guardado en notion-templates/.notion-import.json`);
  }
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message);
  if (err.message.includes('401')) {
    console.error('  → Revisá NOTION_TOKEN en .env.notion');
  }
  if (err.message.includes('404') || err.message.includes('object_not_found')) {
    console.error('  → Compartí la página con la integration (⋯ → Connections)');
    console.error('  → Revisá NOTION_PARENT_PAGE_ID');
  }
  process.exit(1);
});
