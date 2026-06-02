#!/usr/bin/env node
/** Muestra traducciones EN vs fuente ES para revisión */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/notion-client.mjs';

const env = loadEnv();
const supabase = createClient(
  env.VITE_SUPABASE_URL || env.SUPABASE_URL,
  env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, db: { schema: 'ecommerce' } }
);

const { data: exps } = await supabase
  .from('experiences')
  .select('id, slug, title, short_description')
  .order('title')
  .limit(3);

for (const exp of exps ?? []) {
  const { data: tr } = await supabase
    .from('content_translations')
    .select('field_key, value')
    .eq('entity_type', 'experience')
    .eq('entity_id', exp.id)
    .eq('locale', 'en')
    .in('field_key', ['title', 'short_description']);

  const en = Object.fromEntries((tr ?? []).map((r) => [r.field_key, r.value]));
  console.log(`\n━━ ${exp.slug} ━━`);
  console.log('ES title:', exp.title);
  console.log('EN title:', en.title ?? '—');
  console.log('ES short:', exp.short_description?.slice(0, 120) + '…');
  console.log('EN short:', (en.short_description ?? '—').slice(0, 120) + '…');
}

const { data: cats } = await supabase
  .from('categories_experience')
  .select('id, name, slug')
  .eq('is_active', true)
  .limit(5);

console.log('\n━━ Categorías ━━');
for (const cat of cats ?? []) {
  const { data: tr } = await supabase
    .from('content_translations')
    .select('value')
    .eq('entity_type', 'category')
    .eq('entity_id', cat.id)
    .eq('locale', 'en')
    .eq('field_key', 'name')
    .maybeSingle();
  console.log(`  ${cat.name} → ${tr?.value ?? '—'}`);
}

const { data: log } = await supabase
  .from('i18n_translation_log')
  .select('model, tokens_in, tokens_out, field_keys, created_at')
  .order('created_at', { ascending: false })
  .limit(3);

console.log('\n━━ Últimos batches IA ━━');
for (const row of log ?? []) {
  console.log(
    `  ${row.model} | ${row.tokens_in}+${row.tokens_out} tokens | ${row.field_keys?.join(', ')}`
  );
}
