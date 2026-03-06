-- Corrige o tipo de campaign_id em meta_ads_metrics quando meta_ads_campaigns.id é BIGINT (produção).
-- Em bancos novos com id UUID, a coluna pode já existir como UUID; neste caso não alteramos.

DO $$
DECLARE
  id_type text;
  col_exists boolean;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'meta_ads_campaigns' AND column_name = 'id';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meta_ads_metrics' AND column_name = 'campaign_id'
  ) INTO col_exists;

  IF col_exists THEN
    RETURN; -- coluna já existe, não fazer nada
  END IF;

  IF id_type = 'bigint' THEN
    ALTER TABLE public.meta_ads_metrics
      ADD COLUMN campaign_id BIGINT REFERENCES public.meta_ads_campaigns(id) ON DELETE CASCADE;
  ELSIF id_type = 'uuid' THEN
    ALTER TABLE public.meta_ads_metrics
      ADD COLUMN campaign_id UUID REFERENCES public.meta_ads_campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;
