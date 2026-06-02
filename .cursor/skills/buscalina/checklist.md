# Checklist Buscalina — bepelican-ecommerce (local)

Solo rutas y componentes **que existen** en `src/App.tsx`, probados en **`http://localhost:8080`**. No auditar bepelican.com en producción.

Objetivo: detectar huecos, vacíos, links rotos, errores y vulnerabilidades — **no** proponer páginas o features nuevas.

## Cómo usar este checklist

Por cada ítem: verificar que **funciona** o anotar el **defecto** (link roto, bloque vacío, error, etc.). Si algo no existe en el sitio, ignorarlo — no reportarlo como “falta”.

## Rutas públicas

### `/` — Home

- [ ] Hero muestra slides (no carrusel vacío sin fallback)
- [ ] CTAs existentes llevan a destino válido (no 404)
- [ ] Cada link del header/footer responde (interno o externo)
- [ ] Featured experiences / library: cards con imagen, título y link — no bloques vacíos
- [ ] Sin errores en consola ni requests fallidos críticos
- [ ] Mobile: contenido visible, nada roto u oculto

### `/experiencias` — Catálogo

- [ ] Listado carga (o mensaje claro si no hay datos)
- [ ] Cada card tiene imagen, título, precio — nada en blanco sin explicación
- [ ] Links de cards abren `/experiencias/:slug` correcto
- [ ] Filtros/categorías en UI filtran sin error ni listado vacío inesperado
- [ ] Búsqueda (`?q=`) no rompe la página

### `/experiencias/:slug` — Detalle

- [ ] Página carga para slug válido (no pantalla en blanco)
- [ ] Galería: imágenes visibles, no broken image
- [ ] Precio, fechas, disponibilidad: datos presentes o UI de “no disponible” clara
- [ ] Botón reservar/comprar funciona (checkout o login)
- [ ] Slug inválido → 404 o redirect, no crash
- [ ] `/experiencia/:slug` redirect funciona

### `/biblioteca` y `/biblioteca/:slug`

- [ ] Listado carga o estado vacío explícito
- [ ] Flipbook abre y páginas navegan (no visor vacío)
- [ ] `/libreria` redirect → `/biblioteca`

### `/login` y `/registro`

- [ ] Campos requeridos validan
- [ ] Errores de auth se muestran al usuario (no fallo silencioso)
- [ ] Redirect post-login correcto
- [ ] `/auth` redirect funciona

### `/privacidad` y `/terminos`

- [ ] Contenido renderizado (no página vacía)
- [ ] Links desde footer llegan aquí

### `*` — NotFound

- [ ] URL inventada muestra 404, no pantalla en blanco

## Rutas protegidas

### `/checkout`

- [ ] Sin sesión → redirect a login (no checkout expuesto)
- [ ] Formulario valida campos existentes
- [ ] Resumen muestra datos coherentes (fecha, personas, precio)
- [ ] Wompi inicia sin error JS (no completar pago real)

### `/checkout/resultado`

- [ ] Muestra estado según respuesta Wompi (no página vacía)
- [ ] `/pago-resultado` redirect funciona

### `/mi-cuenta`

- [ ] Sin sesión → bloqueado
- [ ] Reservas cargan o mensaje “sin reservas” (no error silencioso)

### `/admin`

- [ ] Sin rol admin → bloqueado
- [ ] CRUD existente: guardar/editar no falla silenciosamente
- [ ] Subida de archivos no queda colgada ni rota

## Links y navegación (transversal)

- [ ] Header: cada link clickeable llega a destino válido
- [ ] Footer: legales, categorías, contacto — todos funcionan
- [ ] Links legacy en código (`LegacyRedirect`) resuelven bien
- [ ] Enlaces externos: no 404/error (no exigir que existan páginas internas equivalentes)

## Errores y seguridad

- [ ] Consola sin errores no capturados en flujos recorridos
- [ ] Network: sin 4xx/5xx repetidos en APIs del flujo
- [ ] `/admin`, `/checkout`, `/mi-cuenta` inaccesibles sin auth
- [ ] No secrets en frontend (solo `VITE_*` públicos)
- [ ] Formularios existentes: inputs sensibles con validación mínima

## i18n (solo si hay selector en UI)

- [ ] Cambio de idioma no deja textos vacíos ni keys sin traducir visibles (`undefined`, `{{`)

## Flujos end-to-end (verificar que no se rompan)

1. Home → link experiencia → detalle → botón reservar
2. Home → biblioteca → abrir flipbook
3. Login → mi cuenta
4. (Con credenciales) Admin → cambio → visible en catálogo público

## Entorno

| Campo | Valor |
|-------|-------|
| Repo | `bepelican-ecommerce` |
| Comando | `npm run dev` |
| URL base | `http://localhost:8080` |
| Env | `.env` con `VITE_SUPABASE_*` (ver `.env.example`) |

**No usar** `https://bepelican.com` ni otros entornos en línea.
