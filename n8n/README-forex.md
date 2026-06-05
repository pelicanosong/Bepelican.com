# Moni Exchange — divisas diarias (Frankfurter + n8n)

Workflow: **`n8n/finnhub-forex-daily.workflow.json`** (nombre histórico del archivo)

Instancia: [n8n-bepelican.duckdns.org](https://n8n-bepelican.duckdns.org) — workflow `b3vpunN5zFE4sufq`

## Fuente: Frankfurter (fijo)

- Open source (MIT): [github.com/lineofflight/frankfurter](https://github.com/lineofflight/frankfurter)
- API pública: `https://api.frankfurter.dev/v2/`
- **Sin API key**, datos de bancos centrales (BCE, Fed, Banrep, etc.)
- Despliegue propio opcional: [frankfurter.dev/deploy](https://frankfurter.dev/deploy)

## Qué hace

1. **6:00 AM** (cron `0 6 * * *`, zona `America/Bogota`).
2. **Frankfurter USD rates** — `GET /v2/rates?base=USD&quotes=EUR,GBP,MXN,CAD,BRL,CLP,ARS,COP&from=…&to=…` (últimos 7 días, blend).
3. **Frankfurter COP (Banrep)** — `GET /v2/rates?base=USD&quotes=COP&providers=BANREP&from=…&to=…` (tasa oficial COP; el blend de COP en el paso 2 se ignora).
4. **Combinar tasas** → **Normalizar c + h** — un ítem por divisa:

| Campo | Significado |
|-------|-------------|
| `c` | Tasa referencia del **último día** en el rango |
| `h` | **Máximo** de tasa en esos 7 días (referencia oficial, no máximo intradía de broker) |
| `par` | Ej. `EUR/USD`, `CAD/USD` |
| `source` | `frankfurter` |

| Par | Moneda | Provider |
|-----|--------|----------|
| EUR/USD | EUR | blended |
| CAD/USD | CAD | blended |
| GBP/USD | GBP | blended |
| MXN/USD | MXN | blended |
| ARS/USD | ARS | blended |
| CLP/USD | CLP | blended |
| BRL/USD | BRL | blended |
| **COP/USD** | **COP** | **banrep** (Banco de la República) |

Trigger **manual** incluido para probar.

## Desplegar en n8n (Contabo)

```bash
npm run n8n:deploy
```

## COP / Banrep

Frankfurter no permite `providers` distinto por divisa en una sola petición (`providers=BANREP` limita **todo** el request a USD/COP). Por eso el workflow hace dos GET en paralelo y en normalizar usa solo Banrep para COP (`provider: banrep`).

## Finnhub

La key en `n8n/.env.finnhub` ya no usa este workflow. Reservala para acciones/crypto en otros flujos.

## Base de datos (Supabase)

Esquema independiente **`moni_exchange`** (no mezcla con `ecommerce`).

| Objeto | Uso |
|--------|-----|
| `moni_exchange.daily_rates` | Histórico: **una fila por `rate_date` + divisa** |
| `moni_exchange.latest_daily_rates` | Vista: último día guardado por divisa |
| `moni_exchange.daily_rates_cop` | Vista: cruces vs COP (`cop_per_unit` = pesos por 1 unidad de divisa) |

Columnas alineadas con n8n: `rate_date`, `quote_currency`, `par`, `c`, `h`, `rate`, `source`, `provider`, `fetched_at`.

Aplicar migración:

```bash
npm run db:moni-exchange
```

PostgREST: añadir `moni_exchange` a `PGRST_DB_SCHEMAS` y reiniciar API (igual que `ecommerce`).

Upsert desde n8n (service role):

```http
POST /rest/v1/daily_rates?on_conflict=rate_date,quote_currency
Prefer: resolution=merge-duplicates
```

## Conectar todo (Frankfurter → Supabase)

```bash
npm run moni:seed          # prueba REST (8 filas)
npm run n8n:fix-compose    # si n8n no levanta (compose roto)
bash scripts/set-n8n-supabase-env.sh
npm run n8n:deploy
npm run moni:verify
```

O todo junto:

```bash
npm run n8n:moni
```

Hace: PostgREST `moni_exchange`, env `SUPABASE_*` en n8n, deploy del workflow.

Flujo n8n: **Frankfurter** → **Normalizar c + h** → **Guardar en Supabase** (Code node: `$env.SUPABASE_*` + `this.helpers.httpRequest`).

### Variables de entorno en n8n (Contabo)

El nodo **Guardar en Supabase** usa **`$env.SUPABASE_URL`** y **`$env.SUPABASE_SERVICE_ROLE_KEY`** (no `process.env`; el task-runner sandbox de n8n 2.x no expone `process`).

Requiere **`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`** en el contenedor; si está en `true`, `$env` queda bloqueado en Code nodes.

`scripts/set-n8n-supabase-env.sh` (o `npm run n8n:moni`) sube `/root/n8n/.env.supabase` y `docker-compose.override.yml` con:

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | PostgREST base |
| `SUPABASE_SERVICE_ROLE_KEY` | upsert `moni_exchange.daily_rates` |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` | habilita `$env` en Code nodes |

Si el compose principal quedó mal indentado tras un deploy viejo, el script restaura desde `.bak` antes de aplicar el override.

En la app: `useMoniExchangeRates()` lee `moni_exchange.latest_daily_rates`.
