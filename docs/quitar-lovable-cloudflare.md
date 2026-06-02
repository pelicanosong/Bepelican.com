# Quitar Lovable y apuntar bepelican.com a Contabo

## El problema

Cloudflare muestra IPs suyas (104.21.x / 172.67.x) — eso es normal con proxy naranja.

Lo importante es el **destino** (origen) detrás del proxy:

| Origen | Señal |
|--------|--------|
| **Lovable** (viejo) | JS `index-Dlzv3ZLt.js`, header `x-deployment-id` |
| **Contabo** (nuevo) | JS `index-B5mMCxhp.js`, servidor `nginx` |

Si ves la web vieja de Lovable, el registro DNS **A** en Cloudflare sigue apuntando a la IP de Lovable (`185.158.133.1`), no a Contabo (`66.94.96.230`).

---

## Paso 1 — Cloudflare DNS (obligatorio)

Dashboard → **bepelican.com** → **DNS** → **Records**

### Borrá o editá todo lo que apunte a Lovable

- Cualquier **A** o **CNAME** hacia `lovable`, `lovable.app`, `185.158.133.1` o similar → **eliminar** o cambiar.

### Dejá solo esto (proxied = nube naranja)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `66.94.96.230` | Proxied |
| A | `www` | `66.94.96.230` | Proxied |

**No** uses CNAME a Lovable.

Guardá y esperá 2–5 minutos.

---

## Paso 2 — Limpiar caché

Cloudflare → **Caching** → **Configuration** → **Purge Everything**

En el navegador: ventana de incógnito o Cmd+Shift+R.

---

## Paso 3 — Desconectar dominio en Lovable

1. Entrá a [lovable.dev](https://lovable.dev) → tu proyecto viejo
2. **Settings** / **Domains** / **Custom domain**
3. **Quitá** `bepelican.com` y `www.bepelican.com`

Si no lo hacés, Lovable puede seguir reclamando el dominio en Cloudflare.

---

## Paso 4 — SSL en Cloudflare

**SSL/TLS** → Overview → **Full** (mínimo) o **Full (strict)** con Origin Certificate.

**Edge Certificates** → **Always Use HTTPS**: ON

---

## Paso 5 — Comprobar que ya es la app nueva

Abrí en incógnito: **https://bepelican.com**

En el código fuente (clic derecho → Ver código fuente), buscá:

- **Bien:** `index-B5mMCxhp.js` (o el hash actual tras el último deploy)
- **Mal:** `index-Dlzv3ZLt.js` o referencias a `lovable`

O probá directo el servidor (sin depender de DNS):

**http://66.94.96.230** — debe verse BePelican con Supabase.

---

## Paso 6 — GitHub (código de esta app)

El repo local es la app nueva. Subir a GitHub no reemplaza Lovable por sí solo: **DNS + Contabo** es lo que cambia la web pública.

```bash
git add .
git commit -m "BePelican ecommerce — app Contabo + Supabase + i18n"
git remote add origin https://github.com/TU_USUARIO/bepelican-ecommerce.git
git push -u origin main
```

Actualizar producción después de cambios:

```bash
npm run build && npm run deploy:contabo
```
