-- Documento de contexto por cliente (complemento em texto para uso em campanhas/IA)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS context_document text;
