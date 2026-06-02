
-- 1. Drop FK constraint from experiences.category_id
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_category_id_fkey;

-- 2. Drop the category_id column from experiences
ALTER TABLE public.experiences DROP COLUMN IF EXISTS category_id;

-- 3. Drop FK constraint from experiences.destination_id
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_destination_id_fkey;

-- 4. Drop the destination_id column from experiences
ALTER TABLE public.experiences DROP COLUMN IF EXISTS destination_id;

-- 5. Drop the destinations table (RLS policies will be dropped automatically)
DROP TABLE IF EXISTS public.destinations CASCADE;
