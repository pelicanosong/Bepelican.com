# Emails BePelican (React Email + Resend)

## 1. Guardar la API Key (sin pegarla en Cursor)

```bash
cp .env.resend.example .env.resend
# Editá .env.resend y pegá tu RESEND_API_KEY ahí
```

## 2. Ver diseño en el navegador

```bash
npm install
npm run email:dev
```

Abre http://localhost:3000 — ves los 4 templates con marca BePelican.

## 3. Compilar HTML para Supabase

```bash
npm run email:build
```

Genera `supabase/functions/send-auth-email/templates/*.html`

## 4. Resend — dominio

En [resend.com/domains](https://resend.com/domains) agregá **bepelican.com** y los DNS que te den.

Mientras tanto podés probar con `onboarding@resend.dev` (solo a tu email verificado).

## 5. Servidor Contabo (Supabase)

En `/root/supabase/.env` del auth/functions:

```env
# Apagar autoconfirm cuando emails funcionen
ENABLE_EMAIL_AUTOCONFIRM=false

# Hook de email → Edge Function
GOTRUE_HOOK_SEND_EMAIL_ENABLED=true
GOTRUE_HOOK_SEND_EMAIL_URI=http://kong:8000/functions/v1/send-auth-email
GOTRUE_HOOK_SEND_EMAIL_SECRETS=v1,whsec_TU_SECRETO_AQUI

# Secrets de la function (supabase secrets o env del contenedor functions)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=BePelican <hola@bepelican.com>
SITE_URL=https://bepelican.com
SEND_EMAIL_HOOK_SECRET=whsec_TU_SECRETO_AQUI
```

Reiniciá auth + functions después de desplegar.

## Templates

| Archivo | Uso |
|---------|-----|
| `emails/confirm-signup.tsx` | Registro / confirmar correo |
| `emails/reset-password.tsx` | Olvidé mi contraseña |
| `emails/welcome.tsx` | Bienvenida (manual o post-confirm) |
| `emails/password-changed.tsx` | Aviso de seguridad |

Colores y tipografía según manual en `docs/brand-manual/manual-bepelican.pdf`.
