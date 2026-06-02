/**
 * Carga el system prompt del agente traductor.
 * Prioridad: Supabase i18n_agent_config → archivo scripts/i18n/translation-system-prompt.md
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PROMPT_FILE = resolve(root, 'scripts/i18n/translation-system-prompt.md');

export function loadPromptFromFile() {
  if (!existsSync(PROMPT_FILE)) {
    return 'You are the official BePelican translator. Warm, authentic, transformation tourism.';
  }
  const raw = readFileSync(PROMPT_FILE, 'utf8');
  // Quitar título markdown y bloques meta; el agente recibe solo instrucciones
  return raw
    .replace(/^#.*\n+/m, '')
    .replace(/^Editá este archivo.*\n---\n+/m, '')
    .replace(/^---\n/gm, '')
    .trim();
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabase
 */
export async function loadTranslationSystemPrompt(supabase) {
  if (supabase) {
    const { data: rows } = await supabase.from('i18n_agent_config').select('config_key, config_value');

    const map = Object.fromEntries((rows ?? []).map((r) => [r.config_key, r.config_value]));
    const useFile = map.use_file_prompt !== 'false';

    if (!useFile && map.system_prompt?.trim()) {
      return map.system_prompt.trim();
    }
  }

  return loadPromptFromFile();
}

export function buildGlossaryPrompt(glossaryRows, targetLocale) {
  if (!glossaryRows?.length) return '';
  const lines = glossaryRows.map((g) => {
    if (g.do_not_translate) return `- "${g.term_es}": keep unchanged (brand)`;
    const fixed = g.translations?.[targetLocale];
    if (fixed) return `- "${g.term_es}" → "${fixed}" (use exactly)`;
    if (g.notes) return `- "${g.term_es}": ${g.notes}`;
    return `- "${g.term_es}": translate consistently across all fields`;
  });
  return `\n## Glossary (mandatory)\n${lines.join('\n')}`;
}

const LOCALE_NAMES = {
  en: 'English',
  pt: 'Portuguese (Brazil)',
  fr: 'French',
  de: 'German',
  it: 'Italian',
};

/**
 * Arma el system prompt completo para una llamada al agente.
 */
export async function buildAgentSystemPrompt({
  targetLocale,
  glossary = [],
  tier = 'batch',
  supabase = null,
}) {
  const base = await loadTranslationSystemPrompt(supabase);
  const targetName = LOCALE_NAMES[targetLocale] || targetLocale;
  const glossaryBlock = buildGlossaryPrompt(glossary, targetLocale);
  const tierNote =
    tier === 'quality'
      ? 'This batch includes long-form content (descriptions, lists). Prioritize narrative quality and natural flow.'
      : 'This batch includes short fields (titles, labels). Be concise and punchy.';

  return `${base}

## Session
- Source locale: es (Spanish, Colombia)
- Target locale: ${targetLocale} (${targetName})
- ${tierNote}

## Output rules
- Return ONLY a valid JSON object with the EXACT same keys as the user message.
- No markdown fences, no commentary, no extra keys.
${glossaryBlock}`;
}

export { PROMPT_FILE, LOCALE_NAMES };
