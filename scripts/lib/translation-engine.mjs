/**
 * Motor de traducción BePelican — escalable a N idiomas, económico en tokens.
 *
 * Estrategia:
 * 1. Español = fuente en tablas principales (Notion → Supabase)
 * 2. Otros idiomas → content_translations (entity_type + entity_id + field_key + locale)
 * 3. Hash SHA-256 por campo: solo traduce si el texto ES cambió
 * 4. Un solo call al agente por entidad+idioma (batch de campos cortos + largos en 1–2 requests)
 * 5. Glosario de marca inyectado en system prompt (consistencia, menos tokens)
 */
import { createHash } from 'crypto';
import { buildAgentSystemPrompt } from './translation-prompt.mjs';

/** @typedef {'plain' | 'json'} ValueFormat */
/** @typedef {'batch' | 'quality'} FieldTier */

/**
 * @typedef {Object} FieldDef
 * @property {ValueFormat} format
 * @property {FieldTier} tier
 */

/** Campos traducibles por tipo de entidad */
export const ENTITY_I18N_FIELDS = {
  experience: {
    title: { format: 'plain', tier: 'batch' },
    short_description: { format: 'plain', tier: 'batch' },
    description: { format: 'plain', tier: 'quality' },
    includes: { format: 'json', tier: 'quality' },
    not_includes: { format: 'json', tier: 'quality' },
    requirements: { format: 'json', tier: 'quality' },
  },
  category: {
    name: { format: 'plain', tier: 'batch' },
  },
  site_string: {
    value: { format: 'plain', tier: 'batch' },
  },
};

export function hashContent(value) {
  const normalized =
    value === null || value === undefined
      ? ''
      : typeof value === 'string'
        ? value.trim()
        : JSON.stringify(value);
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function serializeSourceValue(value, format) {
  if (value === null || value === undefined) return null;
  if (format === 'json') {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return JSON.stringify(value);
  }
  const s = String(value).trim();
  return s || null;
}

export function parseStoredValue(value, format) {
  if (format === 'json') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * @param {Record<string, string>} fieldsToTranslate — clave → texto fuente (es)
 * @param {string} targetLocale
 * @param {object} opts
 */
export async function translateFieldsWithAgent(fieldsToTranslate, targetLocale, opts = {}) {
  const { glossary = [], env = {}, tier = 'batch', supabase = null } = opts;

  if (!Object.keys(fieldsToTranslate).length) {
    return { translations: {}, usage: { input: 0, output: 0 }, model: null };
  }

  const provider =
    env.TRANSLATION_PROVIDER ||
    (env.ANTHROPIC_API_KEY ? 'anthropic' : env.OPENAI_API_KEY ? 'openai' : null);

  if (!provider) {
    throw new Error(
      'Falta ANTHROPIC_API_KEY u OPENAI_API_KEY para traducir. Usá --skip-translate para sync sin IA.'
    );
  }

  const systemPrompt = await buildAgentSystemPrompt({
    targetLocale,
    glossary,
    tier,
    supabase,
  });

  const userPayload = JSON.stringify(fieldsToTranslate, null, 0);

  if (provider === 'anthropic') {
    const quality = tier === 'quality';
    const model =
      env.TRANSLATION_MODEL ||
      (quality ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-20250514');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: quality ? 4096 : 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPayload }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';
    const translations = parseAgentJson(text);
    return {
      translations,
      usage: {
        input: data.usage?.input_tokens ?? 0,
        output: data.usage?.output_tokens ?? 0,
      },
      model,
    };
  }

  // OpenAI fallback
  const quality = tier === 'quality';
  const model =
    env.TRANSLATION_MODEL ||
    (quality ? 'gpt-4o' : 'gpt-4o-mini');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPayload },
      ],
      max_tokens: quality ? 4096 : 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  const translations = parseAgentJson(text);
  return {
    translations,
    usage: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
    model,
  };
}

function parseAgentJson(text) {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Agente no devolvió JSON válido');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Sincroniza traducciones para una entidad.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function syncEntityTranslations({
  supabase,
  entityType,
  entityId,
  sourceFields,
  fieldDefs,
  env,
  dryRun = false,
  log = console.log,
  forceRetranslate = false,
}) {
  const { data: locales, error: locErr } = await supabase
    .from('i18n_locales')
    .select('code')
    .eq('is_active', true)
    .eq('is_source', false);

  if (locErr) throw new Error(`i18n_locales: ${locErr.message}`);
  const targetLocales = (locales ?? []).map((l) => l.code);
  if (!targetLocales.length) return { translated: 0, skipped: 0, tokens: 0 };

  const { data: glossary } = await supabase.from('i18n_glossary').select('*');

  const { data: existing } = await supabase
    .from('content_translations')
    .select('field_key, locale, source_hash, value, value_format')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  const existingMap = new Map(
    (existing ?? []).map((r) => [`${r.field_key}:${r.locale}`, r])
  );

  let translated = 0;
  let skipped = 0;
  let totalTokens = 0;

  for (const locale of targetLocales) {
    const batchFields = {};
    const qualityFields = {};
    const batchMeta = {};
    const qualityMeta = {};

    for (const [fieldKey, def] of Object.entries(fieldDefs)) {
      const raw = sourceFields[fieldKey];
      const serialized = serializeSourceValue(raw, def.format);
      if (!serialized) continue;

      const sourceHash = hashContent(serialized);
      const prev = existingMap.get(`${fieldKey}:${locale}`);

      if (!forceRetranslate && prev?.source_hash === sourceHash && prev?.value) {
        skipped++;
        continue;
      }

      const payload =
        def.format === 'json'
          ? JSON.stringify(parseStoredValue(serialized, 'json'), null, 0)
          : serialized;

      if (def.tier === 'quality') {
        qualityFields[fieldKey] = payload;
        qualityMeta[fieldKey] = { sourceHash, format: def.format };
      } else {
        batchFields[fieldKey] = payload;
        batchMeta[fieldKey] = { sourceHash, format: def.format };
      }
    }

    const tiers = [
      { fields: batchFields, meta: batchMeta, tier: 'batch' },
      { fields: qualityFields, meta: qualityMeta, tier: 'quality' },
    ];

    for (const { fields, meta, tier } of tiers) {
      if (!Object.keys(fields).length) continue;

      if (dryRun) {
        log(`    [dry-run i18n] ${entityType}/${entityId} → ${locale} (${tier}): ${Object.keys(fields).join(', ')}`);
        translated += Object.keys(fields).length;
        continue;
      }

      const { translations, usage, model } = await translateFieldsWithAgent(fields, locale, {
        glossary: glossary ?? [],
        env,
        tier,
        supabase,
      });

      totalTokens += (usage.input ?? 0) + (usage.output ?? 0);

      const rows = [];
      for (const [fieldKey, metaEntry] of Object.entries(meta)) {
        const translatedVal = translations[fieldKey];
        if (translatedVal === undefined || translatedVal === null) {
          console.warn(`    ⚠ Sin traducción para ${fieldKey} (${locale})`);
          continue;
        }

        const value =
          metaEntry.format === 'json'
            ? typeof translatedVal === 'string'
              ? translatedVal
              : JSON.stringify(translatedVal)
            : String(translatedVal);

        rows.push({
          entity_type: entityType,
          entity_id: entityId,
          field_key: fieldKey,
          locale,
          value,
          value_format: metaEntry.format,
          source_hash: metaEntry.sourceHash,
          model,
          updated_at: new Date().toISOString(),
        });
      }

      if (rows.length) {
        const { error: upsErr } = await supabase
          .from('content_translations')
          .upsert(rows, { onConflict: 'entity_type,entity_id,field_key,locale' });
        if (upsErr) throw new Error(`content_translations: ${upsErr.message}`);
        translated += rows.length;

        await supabase.from('i18n_translation_log').insert({
          entity_type: entityType,
          entity_id: entityId,
          locale,
          field_keys: rows.map((r) => r.field_key),
          tokens_in: usage.input,
          tokens_out: usage.output,
          model,
          skipped: false,
        });
      }
    }
  }

  return { translated, skipped, tokens: totalTokens };
}

/** Aplica glosario como post-proceso rápido (sin API) cuando ya existe traducción parcial */
export function applyGlossaryFallback(text, glossary, locale) {
  if (!text || locale === 'es') return text;
  let out = text;
  for (const g of glossary ?? []) {
    if (g.do_not_translate) continue;
    const repl = g.translations?.[locale];
    if (repl) out = out.split(g.term_es).join(repl);
  }
  return out;
}
