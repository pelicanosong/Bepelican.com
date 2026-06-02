#!/usr/bin/env node
/**
 * Genera CSVs listos para importar en Notion (alineados a Supabase ecommerce).
 * Uso: node scripts/generate-notion-templates.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(root, 'supabase/migration-data');
const outDir = resolve(root, 'notion-templates');
mkdirSync(outDir, { recursive: true });

const csvEscape = (v) => {
  if (v == null || v === '') return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const row = (obj, keys) => keys.map((k) => csvEscape(obj[k])).join(',');

const categories = JSON.parse(readFileSync(resolve(dataDir, 'categories_experience.json'), 'utf8'));
const experiences = JSON.parse(readFileSync(resolve(dataDir, 'experiences.json'), 'utf8'));
const expCats = JSON.parse(readFileSync(resolve(dataDir, 'experience_categories.json'), 'utf8'));
const pricingRules = JSON.parse(readFileSync(resolve(dataDir, 'pricing_rules.json'), 'utf8'));

const catById = Object.fromEntries(categories.map((c) => [c.id, c.slug]));

const expSlugs = Object.fromEntries(experiences.map((e) => [e.id, e.slug]));

const expCatSlugs = {};
for (const link of expCats) {
  const slug = expSlugs[link.experience_id];
  const cat = catById[link.category_id];
  if (!slug || !cat) continue;
  if (!expCatSlugs[slug]) expCatSlugs[slug] = [];
  expCatSlugs[slug].push(cat);
}

// --- 1. Categorías ---
const catKeys = ['nombre', 'slug', 'icono', 'color', 'orden', 'activa', 'supabase_id'];
const catRows = categories.map((c) => ({
  nombre: c.name.trim(),
  slug: c.slug,
  icono: c.icon || '',
  color: c.color || '#08949B',
  orden: c.display_order ?? 0,
  activa: c.is_active ? 'Sí' : 'No',
  supabase_id: c.id,
}));

writeFileSync(
  resolve(outDir, '1-categorias.csv'),
  [catKeys.join(','), ...catRows.map((r) => row(r, catKeys))].join('\n')
);

// --- 2. Experiencias (campos esenciales + sync) ---
const expKeys = [
  'titulo',
  'slug',
  'estado',
  'tipo_precio',
  'precio_base_cop',
  'duracion_minutos',
  'unidad_duracion',
  'ciudad',
  'departamento',
  'nombre_lugar',
  'descripcion_corta',
  'imagen_portada',
  'min_participantes',
  'max_participantes',
  'dificultad',
  'requiere_hospedaje',
  'categorias_slugs',
  'orden_grid',
  'supabase_id',
];

const expRows = experiences.map((e) => ({
  titulo: e.title.trim(),
  slug: e.slug,
  estado: e.status,
  tipo_precio: e.pricing_type,
  precio_base_cop: e.price,
  duracion_minutos: e.duration_minutes,
  unidad_duracion: e.duration_unit,
  ciudad: e.location_city,
  departamento: e.location_department || '',
  nombre_lugar: e.location_name,
  descripcion_corta: (e.short_description || '').replace(/\n/g, ' ').slice(0, 500),
  imagen_portada: e.cover_image || '',
  min_participantes: e.min_participants ?? 1,
  max_participantes: e.max_participants,
  dificultad: e.difficulty || '',
  requiere_hospedaje: e.lodging_required ? 'Sí' : 'No',
  categorias_slugs: (expCatSlugs[e.slug] || []).join('|'),
  orden_grid: e.display_order ?? 0,
  supabase_id: e.id,
}));

writeFileSync(
  resolve(outDir, '2-experiencias.csv'),
  [expKeys.join(','), ...expRows.map((r) => row(r, expKeys))].join('\n')
);

// --- 3. Reglas de precio ---
const ruleKeys = [
  'etiqueta',
  'experiencia_slug',
  'tipo_regla',
  'precio_cop',
  'min_pax',
  'max_pax',
  'origen',
  'orden',
  'activa',
  'supabase_id',
];

const ruleRows = pricingRules.map((r) => ({
  etiqueta: r.label,
  experiencia_slug: expSlugs[r.experience_id] || '',
  tipo_regla: r.rule_type,
  precio_cop: r.price,
  min_pax: r.min_pax ?? '',
  max_pax: r.max_pax ?? '',
  origen: r.origin_label || '',
  orden: r.sort_order ?? 0,
  activa: r.is_active !== false ? 'Sí' : 'No',
  supabase_id: r.id,
}));

writeFileSync(
  resolve(outDir, '3-reglas-precio.csv'),
  [ruleKeys.join(','), ...ruleRows.map((r) => row(r, ruleKeys))].join('\n')
);

// --- Guía ---
const guia = `# Notion → Supabase (5 minutos)

Plantillas generadas con tus datos reales de BePelican.

## Archivos

| Archivo | Filas | Para qué |
|---------|-------|----------|
| \`1-categorias.csv\` | ${catRows.length} | Categorías del catálogo |
| \`2-experiencias.csv\` | ${expRows.length} | Experiencias (tabla principal) |
| \`3-reglas-precio.csv\` | ${ruleRows.length} | Precios por origen / pax / hospedaje |

## Importar en Notion (en este orden)

### Paso 1 — Categorías
1. Notion → página nueva → **Importar** → **CSV**
2. Subí \`1-categorias.csv\`
3. Nombre de la base: **Categorías BePelican**
4. Tipos sugeridos al importar:
   - \`orden\` → Number
   - \`activa\` → Select (Sí / No)

### Paso 2 — Experiencias
1. Importá \`2-experiencias.csv\`
2. Nombre: **Experiencias BePelican**
3. Tipos sugeridos:
   - \`precio_base_cop\`, \`duracion_minutos\`, \`min_participantes\`, \`max_participantes\`, \`orden_grid\` → Number
   - \`estado\` → Select (\`borrador\`, \`activa\`, \`pausada\`, \`eliminada\`)
   - \`tipo_precio\` → Select (\`fixed\`, \`per_person\`, \`per_origin\`, \`per_accommodation\`, \`per_origin_accommodation\`)
   - \`unidad_duracion\` → Select (\`minutes\`, \`hours\`, \`days\`)
   - \`dificultad\` → Select (\`baja\`, \`media\`, \`alta\`)
   - \`requiere_hospedaje\` → Select (Sí / No)
   - \`imagen_portada\` → URL

### Paso 3 — Reglas de precio
1. Importá \`3-reglas-precio.csv\`
2. Nombre: **Reglas de precio BePelican**
3. Tipos: \`precio_cop\`, \`min_pax\`, \`max_pax\`, \`orden\` → Number

### Paso 4 — Relaciones (2 min, opcional pero útil)
En **Reglas de precio**, agregá columna **Relation** → conectar a **Experiencias BePelican**.
En **Experiencias**, agregá **Relation** → **Categorías BePelican**.

Para vincular precios: filtrá por columna \`experiencia_slug\` igual al \`slug\` de la experiencia.

> El sync con Supabase usará \`slug\` y \`supabase_id\`; las relaciones en Notion son para vos, no obligatorias para el sync.

## Campos largos (eficiencia)

No van en el CSV a propósito — editálos en el **cuerpo de cada página** de Notion:
- Descripción completa
- Itinerario día a día
- Incluye / No incluye
- Galería de fotos

Así la tabla queda liviana para agentes IG/WA y el sync es más rápido.

## Valores de estado

Siempre usá exactamente (copiar/pegar):
- Estados: \`activa\` | \`borrador\` | \`pausada\` | \`eliminada\`
- Tipo precio: \`fixed\` | \`per_person\` | \`per_origin\` | \`per_accommodation\` | \`per_origin_accommodation\`

## Regenerar plantillas

Si cambiás datos en Supabase y querés actualizar los CSV:

\`\`\`bash
node scripts/generate-notion-templates.mjs
\`\`\`
`;

writeFileSync(resolve(outDir, 'LEEME.md'), guia);

console.log(`✓ Generado en ${outDir}`);
console.log(`  Categorías: ${catRows.length}`);
console.log(`  Experiencias: ${expRows.length}`);
console.log(`  Reglas precio: ${ruleRows.length}`);
