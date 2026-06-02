
-- 1. Duration unit enum
CREATE TYPE public.duration_unit AS ENUM ('minutes', 'hours', 'days');

-- 2. Add duration_unit to experiences (keeps duration_minutes as canonical value in minutes)
ALTER TABLE public.experiences 
  ADD COLUMN duration_unit public.duration_unit NOT NULL DEFAULT 'minutes';

-- 3. Pricing type enum  
CREATE TYPE public.pricing_type AS ENUM ('fixed', 'per_person', 'per_origin', 'per_accommodation');

-- 4. Add pricing_type to experiences
ALTER TABLE public.experiences 
  ADD COLUMN pricing_type public.pricing_type NOT NULL DEFAULT 'fixed';

-- 5. Pricing rules table
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  rule_type public.pricing_type NOT NULL,
  label TEXT NOT NULL,
  min_pax INT,
  max_pax INT,
  price NUMERIC NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies
CREATE POLICY "Public can view active pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing rules"
  ON public.pricing_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Index for fast lookups
CREATE INDEX idx_pricing_rules_experience ON public.pricing_rules(experience_id);
