ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

INSERT INTO public.site_settings (key, value)
VALUES ('experience_sort_mode', 'created_desc')
ON CONFLICT (key) DO NOTHING;