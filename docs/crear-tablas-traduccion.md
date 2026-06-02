# Crear tablas de traducción (sin SSH, solo navegador)

No necesitás saber de servidores. **3 pasos en el navegador.**

---

## Paso 1 — Abrí Supabase Studio

En Chrome o Safari, entrá a la consola de tu Supabase (la misma donde ves las tablas `experiences`, etc.):

**URL habitual:** [https://supabase-bepelican.duckdns.org](https://supabase-bepelican.duckdns.org)

(Si te pide usuario y contraseña, usá las que configuraste cuando instalaste Supabase en Contabo.)

---

## Paso 2 — Abrí el SQL Editor

1. Menú izquierdo → **SQL Editor** (o **SQL**)
2. Clic en **New query** / **Nueva consulta**

---

## Paso 3 — Pegá y ejecutá

1. En tu Mac, abrí este archivo del proyecto:

   `supabase/migrations/20260531150000_i18n_content_translations.sql`

2. Seleccioná **todo** el contenido (`Cmd+A`) y copiá (`Cmd+C`)

3. Pegá en el SQL Editor de Supabase (`Cmd+V`)

4. Clic en **Run** / **Ejecutar**

Si todo salió bien, abajo debería decir **Success** (sin errores rojos).

---

## Paso 4 — Verificá (opcional)

En el menú **Table Editor**, schema **`ecommerce`**, deberías ver tablas nuevas:

- `i18n_locales`
- `content_translations`
- `i18n_glossary`
- `i18n_translation_log`
- `i18n_agent_config`

---

## ¿No encontrás Studio o no tenés contraseña?

Escribime y lo vemos juntos. Alternativa: desde el panel de **Contabo** → tu VPS → consola web (VNC/Terminal del proveedor) — ahí también se puede, pero el navegador con Studio es más fácil.

---

## Después de crear las tablas

Cuando tengas la API key de Anthropic u OpenAI:

```bash
cp .env.i18n.example .env.i18n
# Editá .env.i18n y pegá tu API key ahí

npm run notion:sync
```

Eso sincroniza Notion y traduce automáticamente.
