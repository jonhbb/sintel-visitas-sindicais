-- Localização e fotos das visitas
ALTER TABLE public.visits
  ADD COLUMN latitude DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION,
  ADD COLUMN photos TEXT[] NOT NULL DEFAULT '{}';

-- Bucket privado para fotos; cada usuário só acessa a pasta com o próprio id
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-photos', 'visit-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own visit photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'visit-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own visit photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visit-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own visit photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'visit-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own visit photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'visit-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
