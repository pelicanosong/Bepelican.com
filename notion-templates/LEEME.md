# Notion → Supabase

Plantillas con tus datos reales de BePelican.

## Opción A — Terminal (recomendado)

### Setup (una sola vez, ~2 min)

1. **Integration:** [notion.so/my-integrations](https://www.notion.so/my-integrations) → New integration → copiar el **Internal Integration Secret**
2. **Compartir página:** en Notion, abrí la página donde quieras las bases → `⋯` → **Connections** → agregar tu integration
3. **Config local:**

```bash
cd ~/Projects/bepelican-ecommerce
cp notion-templates/notion.env.example .env.notion
# Editá .env.notion: pegá NOTION_TOKEN y NOTION_PARENT_PAGE_ID (ID de esa página, de la URL)
```

### Importar

```bash
npm run notion:generate   # opcional: regenera CSVs desde Supabase
npm run notion:import     # crea las 3 bases + todas las filas (~3 min)
```

Si ya importaste antes y querés repetir:

```bash
npm run notion:import -- --fresh
```

Probar sin tocar Notion:

```bash
npm run notion:import -- --dry-run
```

Al terminar, las URLs quedan en `notion-templates/.notion-import.json`.

---

## Opción B — Import manual CSV (~5 min)

### Paso 1 — Categorías
1. Notion → página nueva → **Importar** → **CSV**
2. Subí `1-categorias.csv`
3. Nombre de la base: **Categorías BePelican**
4. Tipos sugeridos al importar:
   - `orden` → Number
   - `activa` → Select (Sí / No)

### Paso 2 — Experiencias
1. Importá `2-experiencias.csv`
2. Nombre: **Experiencias BePelican**
3. Tipos sugeridos:
   - `precio_base_cop`, `duracion_minutos`, `min_participantes`, `max_participantes`, `orden_grid` → Number
   - `estado` → Select (`borrador`, `activa`, `pausada`, `eliminada`)
   - `tipo_precio` → Select (`fixed`, `per_person`, `per_origin`, `per_accommodation`, `per_origin_accommodation`)
   - `unidad_duracion` → Select (`minutes`, `hours`, `days`)
   - `dificultad` → Select (`baja`, `media`, `alta`)
   - `requiere_hospedaje` → Select (Sí / No)
   - `imagen_portada` → URL

### Paso 3 — Reglas de precio
1. Importá `3-reglas-precio.csv`
2. Nombre: **Reglas de precio BePelican**
3. Tipos: `precio_cop`, `min_pax`, `max_pax`, `orden` → Number

### Paso 4 — Relaciones (2 min, opcional pero útil)
En **Reglas de precio**, agregá columna **Relation** → conectar a **Experiencias BePelican**.
En **Experiencias**, agregá **Relation** → **Categorías BePelican**.

Para vincular precios: filtrá por columna `experiencia_slug` igual al `slug` de la experiencia.

> El sync con Supabase usará `slug` y `supabase_id`; las relaciones en Notion son para vos, no obligatorias para el sync.

## Campos largos (eficiencia)

No van en el CSV a propósito — editálos en el **cuerpo de cada página** de Notion:
- Descripción completa
- Itinerario día a día
- Incluye / No incluye
- Galería de fotos

Así la tabla queda liviana para agentes IG/WA y el sync es más rápido.

## Valores de estado

Siempre usá exactamente (copiar/pegar):
- Estados: `activa` | `borrador` | `pausada` | `eliminada`
- Tipo precio: `fixed` | `per_person` | `per_origin` | `per_accommodation` | `per_origin_accommodation`

## Regenerar plantillas

Si cambiás datos en Supabase y querés actualizar los CSV:

```bash
node scripts/generate-notion-templates.mjs
```
