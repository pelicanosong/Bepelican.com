
-- Add new columns to experiences table for enhanced form
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS environment_type text,
  ADD COLUMN IF NOT EXISTS meeting_point_url text,
  ADD COLUMN IF NOT EXISTS end_point text,
  ADD COLUMN IF NOT EXISTS end_point_same boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_time_flexible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS temperature_range text,
  ADD COLUMN IF NOT EXISTS recommended_season text,
  ADD COLUMN IF NOT EXISTS accessible_reduced_mobility boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessible_children boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_notes text,
  ADD COLUMN IF NOT EXISTS cancellation_policy_type text DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS difficulty_notes text,
  ADD COLUMN IF NOT EXISTS extra_language_cost boolean DEFAULT false;
