-- Bucket de Storage para o NeuroDesign (upload de sujeito, cenário, referências)
-- Executar no Supabase SQL Editor se o bucket "neurodesign" ainda não existir

-- 1. Criar o bucket (público para leitura das URLs geradas)
-- Limite de 10MB e tipos de imagem podem ser configurados no Dashboard depois, se quiser.
INSERT INTO storage.buckets (id, name, public)
VALUES ('neurodesign', 'neurodesign', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas: usuário autenticado pode fazer upload apenas na própria pasta (userId/projects/...)
DROP POLICY IF EXISTS "NeuroDesign: upload na pasta do usuário" ON storage.objects;
CREATE POLICY "NeuroDesign: upload na pasta do usuário"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'neurodesign'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- 3. Leitura pública (bucket é público)
DROP POLICY IF EXISTS "NeuroDesign: leitura pública" ON storage.objects;
CREATE POLICY "NeuroDesign: leitura pública"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'neurodesign');

-- 4. Usuário pode atualizar/deletar apenas arquivos na própria pasta
DROP POLICY IF EXISTS "NeuroDesign: update na pasta do usuário" ON storage.objects;
CREATE POLICY "NeuroDesign: update na pasta do usuário"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'neurodesign'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'neurodesign'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "NeuroDesign: delete na pasta do usuário" ON storage.objects;
CREATE POLICY "NeuroDesign: delete na pasta do usuário"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'neurodesign'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
