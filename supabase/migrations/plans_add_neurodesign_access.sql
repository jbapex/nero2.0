-- Adiciona acesso ao NeuroDesign nos planos (Suíte de Ferramentas)
-- Executar no Supabase SQL Editor se a coluna ainda não existir

ALTER TABLE plans
ADD COLUMN IF NOT EXISTS has_neurodesign_access BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN plans.has_neurodesign_access IS 'Acesso à ferramenta NeuroDesign (Design Builder) na Suíte de Ferramentas';
