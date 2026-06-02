
-- Table for blocked dates per experience
CREATE TABLE public.experience_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(experience_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.experience_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Public can read blocked dates (needed for calendar)
CREATE POLICY "Public can view blocked dates"
  ON public.experience_blocked_dates
  FOR SELECT
  USING (true);

-- Admins can manage blocked dates
CREATE POLICY "Admins can manage blocked dates"
  ON public.experience_blocked_dates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
