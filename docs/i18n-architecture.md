# BePelican — Arquitectura i18n (escalable + automática)

## Principio

| Capa | Dónde vive el español | Otros idiomas | Quién traduce |
|------|----------------------|---------------|---------------|
| **Contenido** (experiencias, categorías) | Tablas principales (`experiences.title`, etc.) | `content_translations` | Agente IA en `notion:sync` |
| **UI fija** (botones, nav) | `LanguageContext` / futuro Notion "Copy del sitio" | Misma tabla `content_translations` (`entity_type: site_string`) | Agente IA (mismo motor) |
| **Emails** | Templates ES | Variantes EN en build o al enviar | Agente IA en `email:build` (fase 2) |

**Regla de oro:** vos escribís **solo en español** en Notion. Nunca columnas `_en`, `_pt` por tabla.

---

## Base de datos

### `i18n_locales`
Idiomas activos. Hoy: `es` (fuente) + `en`. Para agregar portugués:

```sql
INSERT INTO ecommerce.i18n_locales (code, name, is_source, is_active, display_order)
VALUES ('pt', 'Português', false, true, 2);
```

El sync traducirá automáticamente al próximo `notion:sync`.

### `content_translations`
Clave única: `(entity_type, entity_id, field_key, locale)`

Ejemplo:
```
entity_type: experience
entity_id:   uuid-de-nevado-cocuy
field_key:   title
locale:      en
value:       "Nevado del Cocuy — Thursday Departure"
source_hash: sha256 del texto ES (si cambia → retraduce)
```

### `i18n_glossary`
Términos de marca predefinidos → **menos tokens**, más consistencia (`BePelican`, `turismo de transformación`, etc.).

### `i18n_translation_log`
Auditoría de tokens por sync (control de costos).

---

## Pipeline automático

```
Notion (ES) → sync-notion-to-supabase.mjs
                    │
                    ├─ Upsert tablas principales (ES)
                    │
                    └─ translation-engine.mjs
                           │
                           ├─ Hash por campo → skip si no cambió
                           ├─ Batch campos cortos (1 call Haiku/mini)
                           ├─ Campos largos description (1 call Sonnet/4o)
                           └─ Upsert content_translations
```

### Comandos

```bash
# Sync + traducción (requiere API key)
npm run notion:sync

# Solo sync, sin gastar tokens
npm run notion:sync -- --skip-translate

# Retraducir todo (ignora hash — útil tras cambiar el prompt)
npm run notion:sync -- --retranslate

# Ver qué traduciría
npm run notion:sync -- --dry-run

# Muestras ES vs EN en consola
npm run i18n:review
```

### Variables (`.env.i18n`)

```bash
cp .env.i18n.example .env.i18n
# ANTHROPIC_API_KEY=...   (recomendado)
# o OPENAI_API_KEY=...
```

---

## Economía de tokens

| Técnica | Ahorro |
|---------|--------|
| **Hash SHA-256** por campo | No retraduce si el ES no cambió |
| **1 request por tier** (batch + quality) por entidad+idioma | vs 1 request por campo |
| **Glosario en system prompt** | Evita re-explicar marca cada vez |
| **Haiku / gpt-4o-mini** para títulos cortos | ~10× más barato que Sonnet |
| **Sonnet / gpt-4o** solo para `description`, listas largas | Calidad donde importa |

Estimado: editar 1 experiencia ≈ 2–4 calls (batch + quality) × N idiomas activos.

---

## Frontend

```tsx
import { useLanguage } from '@/contexts/LanguageContext';
import { useContentTranslations } from '@/hooks/useContentTranslations';
import { localizeRecord, EXPERIENCE_I18N_FIELDS } from '@/lib/i18n/content';

const { language } = useLanguage();
const { data: translations } = useContentTranslations(
  'experience',
  experiences.map((e) => e.id),
  language
);

const localized = experiences.map((exp) =>
  localizeRecord(exp, exp.id, language, translations ?? [], [...EXPERIENCE_I18N_FIELDS])
);
```

Si `locale === 'es'`, usa campos originales sin query extra.

---

## UI fija (siguiente fase)

1. Base Notion **"Copy del sitio"**: `clave | texto_es`
2. Sync → `content_translations` con `entity_type: site_string`
3. Reemplazar `LanguageContext` por lectura de Supabase + cache, o react-i18next con JSON generado por el agente en CI

Mismo motor, mismas reglas de hash.

---

## Prompt del agente (cómo traducir)

El agente recibe instrucciones en **3 capas** (de más estable a más editable):

| Capa | Dónde | Para qué |
|------|-------|----------|
| **1. Archivo markdown** | `scripts/i18n/translation-system-prompt.md` | Tono, reglas, vocabulario v2 — **editá acá** |
| **2. Glosario Supabase** | tabla `i18n_glossary` | Términos fijos (`BePelican`, eslogan…) — ahorra tokens |
| **3. Override DB** (opcional) | `i18n_agent_config.system_prompt` | Prompt completo custom; set `use_file_prompt=false` |

Por defecto usa el **archivo markdown**. Cambiás el tono sin tocar código.

### Editar el prompt

```bash
# Abrí y editá:
scripts/i18n/translation-system-prompt.md
```

Próximo `npm run notion:sync` usa el prompt nuevo.

### Glosario en Supabase Studio

```sql
INSERT INTO ecommerce.i18n_glossary (term_es, translations, do_not_translate, notes)
VALUES ('paramo', '{"en": "páramo"}', false, 'Mantener término en inglés técnico-ecológico');
```

### Override total desde Supabase (avanzado)

```sql
UPDATE ecommerce.i18n_agent_config SET config_value = 'false' WHERE config_key = 'use_file_prompt';

INSERT INTO ecommerce.i18n_agent_config (config_key, config_value, description)
VALUES ('system_prompt', 'Tu prompt completo aquí…', 'Reemplaza el archivo markdown')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
```

---

## Migración en Supabase self-hosted

En el **servidor Contabo** (donde corre `supabase-db`):

```bash
cd /root/bepelican-ecommerce   # o tu ruta del repo
bash scripts/apply-i18n-migration.sh
```

O vía SSH desde tu Mac:

```bash
scp supabase/migrations/20260531150000_i18n_content_translations.sql root@TU_SERVIDOR:/tmp/
ssh root@TU_SERVIDOR "docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < /tmp/20260531150000_i18n_content_translations.sql"
```

Tablas creadas:
- `i18n_locales` — idiomas activos (es, en…)
- `content_translations` — traducciones por entidad/campo/idioma
- `i18n_glossary` — términos de marca
- `i18n_translation_log` — auditoría de tokens
- `i18n_agent_config` — config del prompt

---

## Agregar un idioma (checklist)

1. `INSERT` en `i18n_locales`
2. Opcional: entradas en `i18n_glossary.translations`
3. `npm run notion:sync` — traduce todo lo que falte
4. Frontend: el toggle ya puede leer locales activos con `useActiveLocales()`

No hay que tocar código ni schema por idioma.
