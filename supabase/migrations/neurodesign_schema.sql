-- NeuroDesign: tabelas e RLS
-- Executar no Supabase SQL Editor ou via CLI

-- 1. Projetos
CREATE TABLE IF NOT EXISTS neurodesign_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE neurodesign_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own neurodesign projects"
  ON neurodesign_projects FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_neurodesign_projects_owner ON neurodesign_projects(owner_user_id);

-- 2. Configurações do builder
CREATE TABLE IF NOT EXISTS neurodesign_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES neurodesign_projects(id) ON DELETE CASCADE,
  user_ai_connection_id BIGINT REFERENCES user_ai_connections(id) ON DELETE SET NULL,
  subject_gender TEXT,
  subject_description TEXT,
  quantity INT CHECK (quantity >= 1 AND quantity <= 5) DEFAULT 1,
  layout_position TEXT,
  dimensions TEXT,
  text_enabled BOOLEAN DEFAULT false,
  headline_h1 TEXT,
  subheadline_h2 TEXT,
  cta_button_text TEXT,
  text_position TEXT,
  text_gradient BOOLEAN DEFAULT false,
  niche_project TEXT,
  environment TEXT,
  use_scenario_photos BOOLEAN DEFAULT false,
  ambient_color TEXT,
  rim_light_color TEXT,
  fill_light_color TEXT,
  shot_type TEXT,
  floating_elements_enabled BOOLEAN DEFAULT false,
  floating_elements_text TEXT,
  visual_attributes JSONB DEFAULT '{}',
  additional_prompt TEXT,
  subject_image_urls JSONB DEFAULT '[]',
  scenario_photo_urls JSONB DEFAULT '[]',
  style_reference_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE neurodesign_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage configs of own projects"
  ON neurodesign_configs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM neurodesign_projects p WHERE p.id = project_id AND p.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM neurodesign_projects p WHERE p.id = project_id AND p.owner_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_neurodesign_configs_project ON neurodesign_configs(project_id);

-- 3. Execuções de geração/refino
CREATE TABLE IF NOT EXISTS neurodesign_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES neurodesign_projects(id) ON DELETE CASCADE,
  config_id UUID REFERENCES neurodesign_configs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('generate', 'refine')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'success', 'error')) DEFAULT 'queued',
  provider TEXT,
  provider_request_json JSONB,
  provider_response_json JSONB,
  error_message TEXT,
  refine_instruction TEXT,
  parent_run_id UUID REFERENCES neurodesign_generation_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE neurodesign_generation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs of own projects"
  ON neurodesign_generation_runs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM neurodesign_projects p WHERE p.id = project_id AND p.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM neurodesign_projects p WHERE p.id = project_id AND p.owner_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_neurodesign_runs_project ON neurodesign_generation_runs(project_id);

-- 4. Imagens geradas
CREATE TABLE IF NOT EXISTS neurodesign_generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES neurodesign_generation_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES neurodesign_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE neurodesign_generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images of own projects"
  ON neurodesign_generated_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM neurodesign_projects p WHERE p.id = project_id AND p.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM neurodesign_projects p WHERE p.id = project_id AND p.owner_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_neurodesign_images_project ON neurodesign_generated_images(project_id);
CREATE INDEX IF NOT EXISTS idx_neurodesign_images_run ON neurodesign_generated_images(run_id);

-- Trigger para updated_at em projects
CREATE OR REPLACE FUNCTION neurodesign_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS neurodesign_projects_updated_at ON neurodesign_projects;
CREATE TRIGGER neurodesign_projects_updated_at
  BEFORE UPDATE ON neurodesign_projects
  FOR EACH ROW EXECUTE PROCEDURE neurodesign_projects_updated_at();

DROP TRIGGER IF EXISTS neurodesign_configs_updated_at ON neurodesign_configs;
CREATE TRIGGER neurodesign_configs_updated_at
  BEFORE UPDATE ON neurodesign_configs
  FOR EACH ROW EXECUTE PROCEDURE neurodesign_projects_updated_at();
