-- Bucket de imágenes de experiencias (faltaba en self-hosted)
-- Políticas corregidas en 20260602120000_fix_experiences_storage_rls.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('experiences', 'experiences', true)
ON CONFLICT (id) DO NOTHING;
