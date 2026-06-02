CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings" ON public.site_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (key, value)
VALUES ('artesanias_youtube_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
ON CONFLICT (key) DO NOTHING;