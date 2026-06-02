import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = resolve(root, 'supabase/migrations');
const outPath = resolve(root, 'supabase/ecommerce-full-schema.sql');

const bootstrap = readFileSync(
  resolve(root, 'supabase/migrations/20260531140000_ecommerce_core_bootstrap.sql'),
  'utf8'
);

const skip = new Set([
  '20260531120000_init_ecommerce_schema.sql',
  '20260531140000_ecommerce_core_bootstrap.sql',
]);

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql') && !skip.has(f))
  .sort();

function transform(sql) {
  return sql
    .replace(/\bpublic\.has_role\b/g, 'ecommerce.has_role')
    .replace(/\bpublic\.get_experience_availability\b/g, 'ecommerce.get_experience_availability')
    .replace(/\bpublic\.get_lodging_calendar_prices\b/g, 'ecommerce.get_lodging_calendar_prices')
    .replace(/\bpublic\.handle_new_user\b/g, 'ecommerce.handle_new_user')
    .replace(/\bpublic\.update_updated_at_column\b/g, 'ecommerce.update_updated_at_column')
    .replace(/\bSET search_path = public\b/g, 'SET search_path = ecommerce')
    .replace(/\bSET search_path = 'public'\b/g, "SET search_path = 'ecommerce'")
    .replace(/\bSET search_path TO 'public'\b/g, "SET search_path TO 'ecommerce'")
    .replace(/\bSET search_path TO public\b/g, 'SET search_path TO ecommerce')
    .replace(/\bpublic\./g, 'ecommerce.')
    .replace(/\bON public\b/g, 'ON ecommerce')
    .replace(/\bTO public\b/g, 'TO public')
    .replace(/\bCREATE TYPE flipbook_status\b/g, 'CREATE TYPE ecommerce.flipbook_status')
    .replace(/\bflipbook_status\b/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 20), offset);
      if (before.includes('ecommerce.')) return m;
      if (before.includes('CREATE TYPE')) return m;
      return 'ecommerce.flipbook_status';
    })
    .replace(/\b::app_role\b/g, '::ecommerce.app_role')
    .replace(/\b::experience_status\b/g, '::ecommerce.experience_status')
    .replace(/\b::blog_status\b/g, '::ecommerce.blog_status')
    .replace(/\b::blog_category\b/g, '::ecommerce.blog_category')
    .replace(/\b::artesania_categoria\b/g, '::ecommerce.artesania_categoria')
    .replace(/\b::artesania_estado\b/g, '::ecommerce.artesania_estado')
    .replace(/\bartesania_categoria\b/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 30), offset);
      if (before.includes('ecommerce.') || before.includes('CREATE TYPE')) return m;
      return 'ecommerce.artesania_categoria';
    })
    .replace(/\bartesania_estado\b/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 30), offset);
      if (before.includes('ecommerce.') || before.includes('CREATE TYPE')) return m;
      return 'ecommerce.artesania_estado';
    })
    .replace(/\blogding_type\b/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 30), offset);
      if (before.includes('ecommerce.') || before.includes('CREATE TYPE')) return m;
      return 'ecommerce.lodging_type';
    })
    .replace(/\bblog_category\b/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 30), offset);
      if (before.includes('ecommerce.') || before.includes('CREATE TYPE')) return m;
      return 'ecommerce.blog_category';
    })
    .replace(/\bINSERT INTO ecommerce\.categories\b/g, 'INSERT INTO ecommerce.categories_experience')
    .replace(/\becommerce\.categories\b/g, 'ecommerce.categories_experience')
    .replace(/DROP TABLE IF EXISTS ecommerce\.code_redemptions[\s\S]*?DROP FUNCTION IF EXISTS ecommerce\.redeem_access_code[^;]+;/g, '-- skipped library cleanup')
    .replace(/INSERT INTO ecommerce\.experience_categories \(experience_id, category_id\)\s*SELECT id, category_id FROM ecommerce\.experiences WHERE category_id IS NOT NULL;?/g, '-- skipped category_id migration seed')
    .replace(/ALTER TABLE ecommerce\.experiences ALTER COLUMN category_id DROP NOT NULL;?/g, '-- skipped category_id nullable')
    .replace(/ALTER TABLE ecommerce\.experiences DROP COLUMN IF EXISTS category_id;?/g, '-- skipped drop category_id')
    .replace(/ALTER TABLE ecommerce\.experiences DROP COLUMN IF EXISTS destination_id;?/g, '-- skipped drop destination_id')
    .replace(/ALTER TABLE ecommerce\.experiences DROP CONSTRAINT IF EXISTS experiences_category_id_fkey;?/g, '-- skipped')
    .replace(/ALTER TABLE ecommerce\.experiences DROP CONSTRAINT IF EXISTS experiences_destination_id_fkey;?/g, '-- skipped');
}

let body = `-- BePelican ecommerce schema (generated)\nSET client_min_messages TO WARNING;\n\n${bootstrap}\n`;

for (const file of files) {
  const raw = readFileSync(resolve(migrationsDir, file), 'utf8');
  body += `\n-- === ${file} ===\n${transform(raw)}\n`;
}

body += `
-- PostgREST + auth wiring
GRANT USAGE ON SCHEMA ecommerce TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA ecommerce TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ecommerce TO authenticator;
GRANT ALL ON ALL ROUTINES IN SCHEMA ecommerce TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON SEQUENCES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ecommerce GRANT ALL ON ROUTINES TO authenticator;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ecommerce.handle_new_user();
`;

writeFileSync(outPath, body);
console.log(`Wrote ${outPath} (${body.length} bytes, ${files.length} migrations)`);
