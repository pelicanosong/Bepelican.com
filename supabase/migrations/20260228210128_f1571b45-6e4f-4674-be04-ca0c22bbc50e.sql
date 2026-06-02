
-- =============================================
-- LIMPIEZA DE BASE DE DATOS: Eliminar lo no usado
-- =============================================

-- 1. Eliminar tablas de librería digital (no usadas en frontend)
DROP TABLE IF EXISTS public.code_redemptions CASCADE;
DROP TABLE IF EXISTS public.access_codes CASCADE;
DROP TABLE IF EXISTS public.library_purchases CASCADE;
DROP TABLE IF EXISTS public.library_items CASCADE;

-- 2. Eliminar funciones de librería (no invocadas desde frontend)
DROP FUNCTION IF EXISTS public.check_library_access(uuid);
DROP FUNCTION IF EXISTS public.redeem_access_code(uuid, text);

-- 3. Eliminar política RLS duplicada en experiences
-- "Published experiences are viewable by everyone" es idéntica a "Public can view active experiences"
DROP POLICY IF EXISTS "Published experiences are viewable by everyone" ON public.experiences;

-- 4. Hacer category_id nullable (ahora se usa junction table experience_categories)
ALTER TABLE public.experiences ALTER COLUMN category_id DROP NOT NULL;
