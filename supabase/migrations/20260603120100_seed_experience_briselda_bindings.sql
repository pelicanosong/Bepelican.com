-- Seed: experiencias activas → destino Briselda + preset de animación.
SET search_path TO public;

UPDATE ecommerce.experiences
SET
  briselda_destino = 'Santa Marta',
  climate_scene_preset = 'sierra_costa'
WHERE slug = 'tunja';

UPDATE ecommerce.experiences
SET
  briselda_destino = 'Bogota',
  climate_scene_preset = 'andes_urbana'
WHERE slug = 'monserrate-camino-antiguo';

UPDATE ecommerce.experiences
SET
  briselda_destino = 'Bogota',
  climate_scene_preset = 'barrio_urbana'
WHERE slug = 'el-tour-de-la-perse';

UPDATE ecommerce.experiences
SET
  briselda_destino = 'Riohacha',
  climate_scene_preset = 'desierto_guajira'
WHERE slug = 'guajira-3-dias-2-noches';

UPDATE ecommerce.experiences
SET
  briselda_destino = 'El Cocuy',
  climate_scene_preset = 'nevado_alto'
WHERE slug = 'nevado-del-cocuy-salida-jueves';
