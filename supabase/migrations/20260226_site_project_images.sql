-- Banco de imagens por projeto (Criador de Site)
-- site_projects.id é bigint, então project_id deve ser bigint
CREATE TABLE IF NOT EXISTS site_project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id BIGINT NOT NULL REFERENCES site_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_project_images_project ON site_project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_site_project_images_user ON site_project_images(user_id);

ALTER TABLE site_project_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_project_images_select_own"
  ON site_project_images FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "site_project_images_insert_own"
  ON site_project_images FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM site_projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

CREATE POLICY "site_project_images_update_own"
  ON site_project_images FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "site_project_images_delete_own"
  ON site_project_images FOR DELETE
  USING (user_id = auth.uid());

GRANT ALL ON site_project_images TO authenticated;
GRANT ALL ON site_project_images TO service_role;
