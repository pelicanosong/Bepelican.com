# Acceso a Contabo — para que el agente aplique cambios por vos

Sí, **es más fácil** que vos me des acceso una vez y yo ejecute los comandos. No hace falta que aprendas SSH.

---

## Opción recomendada: archivo `.env.contabo` (en tu Mac)

Las credenciales quedan **solo en tu computador**, no en el chat ni en Git.

### 1. Creá el archivo

En Terminal (Cursor → Terminal):

```bash
cd ~/Projects/bepelican-ecommerce
cp .env.contabo.example .env.contabo
```

### 2. Editá `.env.contabo`

Abrilo en Cursor y completá:

```env
CONTABO_SSH_HOST=66.94.96.230
CONTABO_SSH_USER=root
CONTABO_SSH_PASSWORD=la_contraseña_root_de_contabo
```

La contraseña root la envía **Contabo por email** cuando creaste el VPS (o la cambiaste en el panel Contabo → tu servidor → Password).

### 3. Decime "listo"

Yo corro:

```bash
npm run i18n:migrate:remote
```

Y creo las tablas de traducción en Supabase.

---

## Opción con llave SSH (más segura, sin guardar contraseña)

Si preferís no poner la contraseña en un archivo:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/bepelican_contabo -N ""
ssh-copy-id -i ~/.ssh/bepelican_contabo.pub root@66.94.96.230
```

En `.env.contabo`:

```env
CONTABO_SSH_HOST=66.94.96.230
CONTABO_SSH_USER=root
CONTABO_SSH_KEY_PATH=~/.ssh/bepelican_contabo
```

(Sin línea de contraseña.)

---

## ¿Es seguro?

- `.env.contabo` está en `.gitignore` — no se sube a GitHub
- **No pegues la contraseña en el chat** — solo en el archivo local
- Podés cambiar la contraseña root en Contabo después si querés

---

## Si algo falla

- **"Permission denied"** → contraseña incorrecta o falta llave SSH
- **"docker: not found"** → el SSH entró pero Docker no está en ese usuario
- **"supabase-db" no existe** → nombre del contenedor distinto; lo revisamos juntos

Alternativa sin SSH: guía en `docs/crear-tablas-traduccion.md` (pegar SQL en Supabase Studio).
