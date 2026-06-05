#!/usr/bin/env node
/**
 * Sync Notion → Supabase (ecommerce schema).
 * Uso: npm run notion:sync
 *      npm run notion:sync -- --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import {
  loadEnv,
  loadNotionDatabaseIds,
  createNotionClient,
  propTitle,
  propRichText,
  propSelect,
  propNumber,
  propUrl,
  parsePageSections,
} from './lib/notion-client.mjs';

import {
  ENTITY_I18N_FIELDS,
  syncEntityTranslations,
} from './lib/translation-engine.mjs';
import { mirrorExperienceCover } from './lib/media-storage.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const skipTranslate = args.has('--skip-translate');
const retranslate = args.has('--retranslate');

const boolSiNo = (v) => v === 'Sí' || v === 'Si' || v === 'true';

const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));

function log(msg) {
  console.log(msg);
}

async function main() {
  const env = loadEnv();
  const token = env.NOTION_TOKEN || env.NOTION_API_KEY;
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token) throw new Error('Falta NOTION_TOKEN en .env.notion');
  if (!supabaseUrl || !serviceKey) throw new Error('Falta VITE_SUPABASE_URL y SERVICE_ROLE_KEY en .env.selfhosted');

  const dbIds = loadNotionDatabaseIds();
  const { queryDatabase, getAllPageBlocks } = createNotionClient(token);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'ecommerce' },
  });
  supabase.supabaseUrl = supabaseUrl;

  if (dryRun) log('Modo dry-run — no escribe en Supabase\n');
  if (skipTranslate) log('Traducción IA desactivada (--skip-translate)\n');
  if (retranslate && !skipTranslate) log('Retraducción forzada (--retranslate) — ignora hash existente\n');

  let i18nStats = { translated: 0, skipped: 0, tokens: 0 };

  // --- 1. Categorías ---
  log('1/4 Categorías…');
  const catPages = await queryDatabase(dbIds.categorias);
  const categoryIdBySlug = {};

  for (const page of catPages) {
    const p = page.properties;
    const slug = propRichText(p.slug);
    const id = propRichText(p.supabase_id);
    const row = {
      ...(isUuid(id) ? { id } : {}),
      name: propTitle(p.nombre),
      slug,
      icon: propRichText(p.icono) || null,
      color: propRichText(p.color) || null,
      display_order: propNumber(p.orden) ?? 0,
      is_active: boolSiNo(propSelect(p.activa)),
    };

    if (!row.slug || !row.name) continue;

    if (dryRun) {
      log(`  [dry-run] categoría ${row.slug}`);
      categoryIdBySlug[row.slug] = id || `dry-${row.slug}`;
      continue;
    }

    const { data, error } = await supabase
      .from('categories_experience')
      .upsert(row, { onConflict: isUuid(id) ? 'id' : 'slug' })
      .select('id, slug')
      .single();

    if (error) throw new Error(`Categoría ${slug}: ${error.message}`);
    categoryIdBySlug[data.slug] = data.id;

    if (!skipTranslate) {
      const tr = await syncEntityTranslations({
        supabase,
        entityType: 'category',
        entityId: data.id,
        sourceFields: { name: row.name },
        fieldDefs: ENTITY_I18N_FIELDS.category,
        env,
        dryRun,
        log,
        forceRetranslate: retranslate,
      });
      i18nStats.translated += tr.translated;
      i18nStats.skipped += tr.skipped;
      i18nStats.tokens += tr.tokens;
    }
  }
  log(`   ✓ ${Object.keys(categoryIdBySlug).length} categorías`);

  // --- 2. Experiencias ---
  log('2/4 Experiencias…');
  const expPages = await queryDatabase(dbIds.experiencias);
  const experienceIdBySlug = {};

  for (const page of expPages) {
    const p = page.properties;
    const slug = propRichText(p.slug);
    const id = propRichText(p.supabase_id);
    const blocks = await getAllPageBlocks(page.id);
    const sections = parsePageSections(blocks);

    const shortDesc = propRichText(p.descripcion_corta);
    const row = {
      ...(isUuid(id) ? { id } : {}),
      slug,
      title: propTitle(p.titulo),
      status: propSelect(p.estado) || 'borrador',
      pricing_type: propSelect(p.tipo_precio) || 'fixed',
      price: propNumber(p.precio_base_cop) ?? 0,
      duration_minutes: propNumber(p.duracion_minutos) ?? 60,
      duration_unit: propSelect(p.unidad_duracion) || 'minutes',
      location_city: propRichText(p.ciudad) || 'Colombia',
      location_department: propRichText(p.departamento) || null,
      location_name: propRichText(p.nombre_lugar) || propTitle(p.titulo),
      short_description: shortDesc || null,
      cover_image: propUrl(p.imagen_portada),
      min_participants: propNumber(p.min_participantes) ?? 1,
      max_participants: propNumber(p.max_participantes) ?? 10,
      difficulty: propSelect(p.dificultad),
      lodging_required: boolSiNo(propSelect(p.requiere_hospedaje)),
      display_order: propNumber(p.orden_grid) ?? 0,
      description: sections.description || shortDesc || 'Sin descripción',
      includes: sections.includes.length ? sections.includes : null,
      not_includes: sections.not_includes.length ? sections.not_includes : null,
      requirements: sections.requirements.length ? sections.requirements : null,
      itinerary: sections.itinerary,
      updated_at: new Date().toISOString(),
    };

    if (!row.slug || !row.title) continue;

    const catSlugs = propRichText(p.categorias_slugs)
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!dryRun && row.cover_image) {
      try {
        row.cover_image = await mirrorExperienceCover(supabase, row.slug, row.cover_image);
        log(`  imagen → storage: ${row.slug}`);
      } catch (e) {
        log(`  ⚠ imagen ${row.slug}: ${e.message}`);
      }
    }

    if (dryRun) {
      log(`  [dry-run] experiencia ${row.slug}`);
      experienceIdBySlug[row.slug] = id || `dry-${row.slug}`;
      continue;
    }

    const { data, error } = await supabase
      .from('experiences')
      .upsert(row, { onConflict: isUuid(id) ? 'id' : 'slug' })
      .select('id, slug')
      .single();

    if (error) throw new Error(`Experiencia ${slug}: ${error.message}`);
    experienceIdBySlug[data.slug] = data.id;

    // Junction categories
    await supabase.from('experience_categories').delete().eq('experience_id', data.id);
    const catIds = catSlugs.map((s) => categoryIdBySlug[s]).filter(Boolean);
    if (catIds.length) {
      const { error: catErr } = await supabase.from('experience_categories').insert(
        catIds.map((category_id) => ({ experience_id: data.id, category_id }))
      );
      if (catErr) throw new Error(`Categorías de ${slug}: ${catErr.message}`);
    }

    if (!skipTranslate) {
      const tr = await syncEntityTranslations({
        supabase,
        entityType: 'experience',
        entityId: data.id,
        sourceFields: {
          title: row.title,
          short_description: row.short_description,
          description: row.description,
          includes: row.includes,
          not_includes: row.not_includes,
          requirements: row.requirements,
        },
        fieldDefs: ENTITY_I18N_FIELDS.experience,
        env,
        dryRun,
        log,
        forceRetranslate: retranslate,
      });
      i18nStats.translated += tr.translated;
      i18nStats.skipped += tr.skipped;
      i18nStats.tokens += tr.tokens;
    }
  }
  log(`   ✓ ${Object.keys(experienceIdBySlug).length} experiencias`);

  // --- 3. Reglas de precio ---
  log('3/4 Reglas de precio…');
  const rulePages = await queryDatabase(dbIds.reglas);
  let rulesOk = 0;

  for (const page of rulePages) {
    const p = page.properties;
    const id = propRichText(p.supabase_id);
    const expSlug = propRichText(p.experiencia_slug);
    const experience_id = experienceIdBySlug[expSlug];
    if (!experience_id) continue;

    const label = propTitle(p.etiqueta) || `${expSlug} · ${propRichText(p.origen) || propRichText(p.tipo_regla)}`;
    const row = {
      ...(isUuid(id) ? { id } : {}),
      experience_id,
      rule_type: propRichText(p.tipo_regla) || 'fixed',
      label,
      min_pax: propNumber(p.min_pax),
      max_pax: propNumber(p.max_pax),
      price: propNumber(p.precio_cop) ?? 0,
      sort_order: propNumber(p.orden) ?? 0,
      is_active: boolSiNo(propSelect(p.activa)),
      origin_label: propRichText(p.origen) || null,
    };

    if (dryRun) {
      rulesOk++;
      continue;
    }

    const conflict = isUuid(id) ? 'id' : undefined;
    const q = conflict
      ? supabase.from('pricing_rules').upsert(row, { onConflict: conflict })
      : supabase.from('pricing_rules').insert(row);

    const { error } = await q;
    if (error) {
      // Si no hay id, intentar update por combo experience + origin + pax
      if (!isUuid(id)) {
        const { error: insErr } = await supabase.from('pricing_rules').insert(row);
        if (insErr && !insErr.message.includes('duplicate')) {
          console.warn(`   ⚠ regla ${label}: ${insErr.message}`);
        }
      } else {
        console.warn(`   ⚠ regla ${label}: ${error.message}`);
      }
    } else {
      rulesOk++;
    }
  }
  log(`   ✓ ${rulesOk} reglas`);

  // --- 4. i18n resumen ---
  if (!skipTranslate) {
    log(`4/4 Traducciones IA…`);
    log(
      `   ✓ ${i18nStats.translated} campos traducidos, ${i18nStats.skipped} sin cambios (hash), ~${i18nStats.tokens} tokens`
    );
  }

  // --- 5. Resumen ---
  if (!dryRun) {
    const { count } = await supabase
      .from('experiences')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'activa');
    log(`\n✓ Sync completo — ${count ?? '?'} experiencias activas en Supabase`);
    log('  La web se actualiza al recargar (lee Supabase directo).');
  } else {
    log('\n✓ Dry-run completo');
  }
}

main().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
