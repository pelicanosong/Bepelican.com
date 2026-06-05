# Importar fotos al Supabase self-hosted

Cuando el Supabase Cloud (Lovable) no permite descargas (error **402**), copiá aquí las imágenes y ejecutá:

```bash
npm run storage:import -- --reprocess
```

## Estructura de carpetas

Debe coincidir con las rutas del bucket:

```
storage-import/
  experiences/
    guajira-3-dias-2-noches/
      guajira-3-dias-2-noches-cover.jpg
      gallery/
        guajira-3-dias-2-noches-1.jpg
        guajira-3-dias-2-noches-2.jpg
    monserrate-camino-antiguo/
      ...
  lodgings/
    hotel-boutique-maree/
      ...
```

## Origen de los archivos

1. **Reactivar Cloud un día** en Lovable/Supabase (quitar tope de gasto), luego `npm run storage:migrate`.
2. **Export del dashboard** Supabase → Storage → descargar carpeta `experiences`.
3. **Copia local** si el equipo tiene las fotos originales.

`--reprocess` genera las variantes 400 / 800 / 1920 (WebP + JPEG) y actualiza la BD.
