# Sync Notion → Supabase → Web

## Cómo funciona

```
Notion (editás acá)  →  sync  →  Supabase  →  bepelican.com
Panel /admin         →  Supabase  (directo, sin pasar por Notion)
```

La web **nunca** lee Notion. El sync es el cable entre Notion y Supabase.

---

## Setup (una vez)

### 1. Credenciales locales

Ya deberías tener:
- `.env.notion` — `NOTION_TOKEN`
- `.env.selfhosted` — `SERVICE_ROLE_KEY` + `VITE_SUPABASE_URL`
- `notion-templates/.notion-import.json` — IDs de las 3 bases

### 2. Bootstrap de textos largos en Notion

Llena cada página de experiencia con secciones editables:

```bash
npm run notion:bootstrap
```

Crea en el cuerpo de cada fila:
- ## Descripción completa
- ## Incluye / No incluye / Qué llevar
- ## Itinerario (si aplica)

### 3. Primer sync

```bash
npm run notion:sync -- --dry-run   # ver qué haría
npm run notion:sync                # escribe en Supabase
```

Recargá la web → deberías ver los mismos 5 planes.

---

## Uso diario

1. Editás en **Notion** (precio, estado, textos en la página)
2. Corrés sync (manual o automático con n8n)
3. La web refleja los cambios

Editar en **`/admin`** también funciona — va directo a Supabase.  
(Sync inverso Supabase → Notion: pendiente opcional.)

---

## Automatizar con n8n (Contabo)

### A. Clonar repo en el servidor

```bash
ssh root@66.94.96.230
git clone <tu-repo> /root/bepelican-ecommerce
cd /root/bepelican-ecommerce
cp .env.notion .env.selfhosted   # copiá desde tu Mac (sin commitear)
```

### B. Importar workflow

1. n8n → **Workflows** → **Import from file**
2. Subí `n8n/notion-supabase-sync.workflow.json`
3. En n8n → **Settings** → **Variables** → agregá:
   - `BEPELICAN_REPO_PATH` = `/root/bepelican-ecommerce`
4. Activá el workflow

Corre cada **30 minutos** + trigger manual para probar.

### C. Sin n8n (cron en Mac)

```bash
crontab -e
# cada 30 min:
*/30 * * * * cd ~/Projects/bepelican-ecommerce && npm run notion:sync >> /tmp/notion-sync.log 2>&1
```

---

## Mapeo Notion → Supabase

### Tabla Experiencias

| Notion (columna) | Supabase |
|------------------|----------|
| titulo | title |
| slug | slug |
| estado | status |
| tipo_precio | pricing_type |
| precio_base_cop | price |
| descripcion_corta | short_description |
| imagen_portada | cover_image |

### Cuerpo de página Notion

| Sección (## título) | Supabase |
|---------------------|----------|
| Descripción completa | description |
| Incluye | includes[] |
| No incluye | not_includes[] |
| Qué llevar | requirements[] |
| Itinerario / Día N | itinerary (JSON) |

---

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run notion:bootstrap` | Llena páginas Notion desde Supabase |
| `npm run notion:sync` | Notion → Supabase |
| `npm run notion:sync -- --dry-run` | Simula sin escribir |
