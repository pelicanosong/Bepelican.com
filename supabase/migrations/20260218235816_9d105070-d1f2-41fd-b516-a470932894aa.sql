-- 1. Add new pricing_type enum value
ALTER TYPE public.pricing_type ADD VALUE IF NOT EXISTS 'per_origin_accommodation';

-- 2. Add origin_label column to pricing_rules
ALTER TABLE public.pricing_rules
ADD COLUMN IF NOT EXISTS origin_label text DEFAULT NULL;

-- 3. Add index for efficient grouping by origin
CREATE INDEX IF NOT EXISTS idx_pricing_rules_origin ON public.pricing_rules (experience_id, origin_label) WHERE origin_label IS NOT NULL;
