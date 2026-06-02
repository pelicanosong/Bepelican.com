# Desplegar BePelican — Contabo + Cloudflare

Guía paso a paso: **web estática en Contabo**, **DNS y seguridad en Cloudflare**, **datos en Supabase** (ya en el mismo VPS).

---

## Arquitectura

```
Usuario → Cloudflare (HTTPS, WAF, cache) → Contabo nginx → /var/www/bepelican (dist/)
                                              └── Docker → Supabase (API, auth, storage)
```

- **Contabo:** aloja los archivos de la web (`npm run build` → carpeta `dist/`).
- **Cloudflare:** DNS + proxy (nube naranja). No aloja la web; protege y acelera.
- **Supabase:** sigue en `https://supabase-bepelican.duckdns.org` (mismo servidor).

---

## Antes de empezar — checklist

- [ ] Dominio **bepelican.com** (acceso al registrador donde lo compraste)
- [ ] VPS Contabo: IP **66.94.96.230**, SSH root (`.env.contabo` en el proyecto)
- [ ] Cuenta **Cloudflare** (gratis): [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
- [ ] Proyecto en Mac: `~/Projects/bepelican-ecommerce`

---

## Parte 1 — Build de producción (en tu Mac)

### 1.1 Variables de entorno para el build

Creá `.env.production` en la raíz del proyecto (no se sube a Git):

```env
VITE_SUPABASE_URL=https://supabase-bepelican.duckdns.org
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4NjMxNjA3LCJleHAiOjE5MzYzMTE2MDd9.Qq52hADVNAiuPDjkoF_OirOfAXRCSV4beXd3atMZsrA
VITE_SUPABASE_PROJECT_ID=default
```

(La anon key es la misma que en `.env.development`.)

### 1.2 Generar la web

```bash
cd ~/Projects/bepelican-ecommerce
npm install
npm run build
```

Si termina bien, existe la carpeta **`dist/`** con `index.html` y assets.

### 1.3 Probar el build local (opcional)

```bash
npm run preview
```

Abrí la URL que indique (ej. `http://localhost:4173`). La web usará Supabase directo (no el proxy de dev).

---

## Parte 2 — Contabo: subir archivos y nginx

### 2.1 Crear carpeta en el servidor

```bash
ssh root@66.94.96.230 "mkdir -p /var/www/bepelican"
```

(Usá la contraseña de `.env.contabo` si te la pide.)

### 2.2 Subir la web

```bash
scp -r dist/* root@66.94.96.230:/var/www/bepelican/
```

### 2.3 Instalar nginx (si no está)

En el servidor:

```bash
ssh root@66.94.96.230
apt update && apt install -y nginx
```

### 2.4 Configuración nginx (sitio BePelican)

Creá `/etc/nginx/sites-available/bepelican`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bepelican.com www.bepelican.com;

    root /var/www/bepelican;
    index index.html;

    # SPA: React Router — todas las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets con hash (Vite)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

Activar el sitio:

```bash
ln -sf /etc/nginx/sites-available/bepelican /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Comprobá en el navegador (antes de Cloudflare): `http://66.94.96.230` — debería verse la home (el certificado avisará que no es HTTPS todavía).

---

## Parte 3 — Cloudflare

### 3.1 Agregar el dominio

1. Entrá a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Add a site** → `bepelican.com` → plan **Free**
3. Cloudflare escanea registros DNS existentes

### 3.2 Registros DNS

Dejá o creá:

| Tipo | Nombre | Contenido        | Proxy        |
|------|--------|------------------|--------------|
| A    | `@`    | `66.94.96.230`   | Proxied (naranja) |
| A    | `www`  | `66.94.96.230`   | Proxied (naranja) |

**No toques** el registro de Supabase si usás `supabase-bepelican.duckdns.org` aparte (duckdns no pasa por Cloudflare salvo que migres ese subdominio).

### 3.3 Cambiar nameservers en el registrador

Cloudflare te da 2 nameservers (ej. `ada.ns.cloudflare.com`).

En GoDaddy / Namecheap / donde compraste el dominio:

1. DNS / Nameservers → **Custom**
2. Pegá los 2 nameservers de Cloudflare
3. Guardá (puede tardar **15 min – 48 h**; suele ser < 2 h)

### 3.4 SSL entre Cloudflare y visitante

En Cloudflare → **SSL/TLS** → Overview:

- Modo: **Full (strict)** (recomendado cuando el origen tenga certificado)

### 3.5 Certificado en Contabo (origen) — Origin Certificate

Con la nube naranja activa, Let's Encrypt por HTTP a veces falla. Lo más simple:

1. Cloudflare → **SSL/TLS** → **Origin Server** → **Create Certificate**
2. Hostnames: `bepelican.com`, `*.bepelican.com`
3. Validez: 15 years
4. Copiá **Origin Certificate** y **Private Key**

En Contabo:

```bash
mkdir -p /etc/ssl/cloudflare
nano /etc/ssl/cloudflare/bepelican.pem    # pegar certificado
nano /etc/ssl/cloudflare/bepelican.key    # pegar private key
chmod 600 /etc/ssl/cloudflare/bepelican.key
```

Actualizá `/etc/nginx/sites-available/bepelican`:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bepelican.com www.bepelican.com;

    ssl_certificate     /etc/ssl/cloudflare/bepelican.pem;
    ssl_certificate_key /etc/ssl/cloudflare/bepelican.key;

    root /var/www/bepelican;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}

server {
    listen 80;
    listen [::]:80;
    server_name bepelican.com www.bepelican.com;
    return 301 https://$host$request_uri;
}
```

```bash
nginx -t && systemctl reload nginx
```

### 3.6 Ajustes de seguridad (recomendados)

Cloudflare → **SSL/TLS** → Edge Certificates:

- **Always Use HTTPS**: ON
- **Minimum TLS Version**: 1.2

Cloudflare → **Security** → **Settings**:

- **Security Level**: Medium (o Low al principio si algo bloquea tráfico legítimo)

Opcional → **Speed** → **Optimization** → Auto Minify (JS/CSS/HTML)

---

## Parte 4 — Supabase (auth y CORS)

En [Supabase Studio](https://supabase-bepelican.duckdns.org) → **Authentication** → **URL Configuration**:

| Campo | Valor |
|-------|--------|
| Site URL | `https://bepelican.com` |
| Redirect URLs | `https://bepelican.com/**`, `https://www.bepelican.com/**` |

Si el login por email falla, revisá que el enlace del mail apunte a `https://bepelican.com/...`.

**CORS:** el cliente en producción llama a `https://supabase-bepelican.duckdns.org`. Si hay errores CORS en la consola del navegador, hay que permitir `https://bepelican.com` en la config de Kong/API de Supabase en el servidor (pedile al agente que lo revise si pasa).

---

## Parte 5 — Pagos Wompi

El código ya permite redirects desde:

- `https://bepelican.com`
- `https://www.bepelican.com`

URL de retorno tras pago: `https://bepelican.com/checkout/resultado`

En el panel de Wompi, configurá la URL de redirección con ese dominio.

---

## Parte 6 — Verificación

1. `https://bepelican.com` — home carga con candado verde
2. `https://bepelican.com/experiencias` — listado (recargar la página: no debe dar 404)
3. Toggle **EN** — traducciones visibles
4. `https://bepelican.com/biblioteca` — flipbooks
5. Login / registro — email de confirmación
6. Checkout de prueba (si tenés Wompi sandbox)

Consola del navegador (F12): sin errores rojos de Supabase o CORS.

---

## Parte 7 — Actualizar la web después de cambios

Solo cambios de **código o diseño** (no contenido Notion):

```bash
cd ~/Projects/bepelican-ecommerce
npm run build
scp -r dist/* root@66.94.96.230:/var/www/bepelican/
```

Contenido desde Notion:

```bash
npm run notion:sync
```

No hace falta redeploy: la web lee Supabase en vivo.

**Cache:** tras un deploy, en Cloudflare → **Caching** → **Purge Everything** (solo si no ves cambios; los `/assets/*` tienen hash y se actualizan solos).

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| 404 al recargar `/experiencias` | Falta `try_files ... /index.html` en nginx |
| "Too many redirects" | SSL mode en Cloudflare: usar **Full (strict)** + cert en origen |
| Login no vuelve a la web | Revisar Redirect URLs en Supabase Auth |
| Web en blanco | F12 → errores; revisar `VITE_SUPABASE_*` en el build |
| Cambios no se ven | Purge cache en Cloudflare o hard refresh (Cmd+Shift+R) |
| DNS no resuelve | Esperar propagación; verificar nameservers en registrador |

---

## Resumen de comandos (copiar/pegar)

```bash
# En Mac — build y subida
cd ~/Projects/bepelican-ecommerce
npm run build
scp -r dist/* root@66.94.96.230:/var/www/bepelican/

# En Contabo — recargar nginx
ssh root@66.94.96.230 "nginx -t && systemctl reload nginx"
```

---

## Quién hace qué

| Tarea | Vos | Agente (Cursor) |
|-------|-----|-----------------|
| Cuenta Cloudflare + nameservers | ✓ | — |
| Build + scp | ✓ o agente | ✓ |
| nginx + certificado origen | — | ✓ (con SSH) |
| Supabase Auth URLs | ✓ en Studio | ✓ vía SQL/config |
| Wompi panel | ✓ | — |

Cuando tengas Cloudflare con nameservers activos, decí **"desplegá en Contabo"** y el agente puede ejecutar la parte del servidor.
