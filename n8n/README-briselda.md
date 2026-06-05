# Briselda — clima horario por destino (OpenWeatherMap + n8n)

Workflow: **`n8n/briselda-weather-hourly.workflow.json`**

Instancia: [n8n-bepelican.duckdns.org](https://n8n-bepelican.duckdns.org) — workflow `HfwlEEcF57ra2DO4`

## Fuente: OpenWeatherMap

- API: `https://api.openweathermap.org/data/2.5/weather`
- Requiere **`OPENWEATHER_API_KEY`** en el contenedor n8n (`$env`)
- Unidades métricas, descripciones en español (`lang=es`)

## Qué hace

1. **Cada 1 hora** (intervalo horario, zona `America/Bogota`).
2. **Destinos Bepelican** — 5 ciudades Colombia (El Cocuy, Santa Marta, Leticia, Riohacha, Bogotá).
3. **Por ciudad** — Split In Batches (`batchSize: 1`), una petición OWM por destino.
4. **OpenWeatherMap** — `GET /data/2.5/weather?q=…&appid=…&units=metric&lang=es`.
5. **Transformar clima** — mapeo a filas Supabase.
6. **Guardar en Supabase** — upsert PostgREST (Code node + `$env.SUPABASE_*`).

Trigger **manual** incluido para probar.

## Desplegar en n8n (Contabo)

```bash
npm run n8n:deploy:briselda
```

O todo el pipeline (migración + PostgREST + env + deploy):

```bash
npm run n8n:briselda
```

## Base de datos (Supabase)

Esquema independiente **`briselda`** (no mezcla con `ecommerce` ni `moni_exchange`).

| Objeto | Uso |
|--------|-----|
| `briselda.destination_weather` | Histórico: **una fila por `ciudad` + `snapshot_hour`** |
| `briselda.latest_destination_weather` | Vista: última lectura por destino |

### Columnas (n8n → Supabase)

| Columna | Origen OWM / notas |
|---------|-------------------|
| `ciudad` | Nombre destino BePelican (batch item) |
| `temperatura` | `main.temp` |
| `sensacion_termica` | `main.feels_like` |
| `humedad` | `main.humidity` |
| `descripcion` | `weather[0].description` |
| `viento_kmh` | `wind.speed * 3.6` |
| `presion` | `main.pressure` (hPa) |
| `visibilidad_m` | `visibility` (metros) |
| `icono` | `weather[0].icon` |
| `condicion_id` | `weather[0].id` |
| `lat`, `lon` | `coord.lat`, `coord.lon` |
| `nubes_pct` | `clouds.all` |
| `fetched_at` | ISO al consultar OWM |
| `snapshot_hour` | Inicio de hora UTC (upsert key) |

Aplicar migración:

```bash
npm run db:briselda
```

PostgREST: añadir `briselda` a `PGRST_DB_SCHEMAS` y reiniciar API:

```bash
npm run db:briselda-postgrest
```

Upsert desde n8n (service role):

```http
POST /rest/v1/destination_weather?on_conflict=ciudad,snapshot_hour
Content-Profile: briselda
Prefer: resolution=merge-duplicates
```

## Conectar todo (OpenWeatherMap → Supabase)

```bash
npm run db:briselda
npm run db:briselda-postgrest
bash scripts/set-n8n-openweather-env.sh
bash scripts/set-n8n-supabase-env.sh
npm run n8n:deploy:briselda
```

O todo junto:

```bash
npm run n8n:briselda
```

Flujo n8n: **Destinos** → **Por ciudad** → **OpenWeatherMap** → **Transformar** → **Guardar en Supabase** (loop a **Por ciudad**).

### Variables de entorno en n8n (Contabo)

| Variable | Uso |
|----------|-----|
| `OPENWEATHER_API_KEY` | Query `appid` en OpenWeatherMap |
| `SUPABASE_URL` | PostgREST base |
| `SUPABASE_SERVICE_ROLE_KEY` | upsert `briselda.destination_weather` |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` | habilita `$env` en Code nodes |

`scripts/set-n8n-openweather-env.sh` sube la key a `/root/n8n/.env.supabase` (junto con Supabase si ya corriste `set-n8n-supabase-env.sh`).

Guardá la key localmente en `n8n/.env.openweather`:

```env
OPENWEATHER_API_KEY=tu_key_de_openweathermap
```

Requiere **`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`** en el contenedor; si está en `true`, `$env` queda bloqueado en Code nodes.
