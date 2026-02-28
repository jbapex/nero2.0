-- Função RPC para Super Admin visualizar todas as imagens geradas
-- (NeuroDesign e Criador de Site) com filtros e paginação.
-- Execute este arquivo no SQL Editor do Supabase ou via CLI.

CREATE OR REPLACE FUNCTION public.get_superadmin_gallery_images(
  p_source text DEFAULT NULL,
  p_search_text text DEFAULT NULL,
  p_from_date text DEFAULT NULL,
  p_to_date text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  source text,
  image_url text,
  thumbnail_url text,
  width integer,
  height integer,
  created_at timestamptz,
  project_id text,
  project_name text,
  owner_user_id uuid,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  is_super_admin boolean;
  v_from_date timestamptz;
  v_to_date timestamptz;
BEGIN
  -- Garante que apenas super_admin consiga usar esta função.
  -- user_type pode estar na raiz do JWT, em user_metadata ou em app_metadata. 
  claims := auth.jwt();
  is_super_admin := (
    claims ->> 'user_type' = 'super_admin'
    OR (claims -> 'user_metadata' ->> 'user_type') = 'super_admin'
    OR (claims -> 'app_metadata' ->> 'user_type') = 'super_admin'
  );
  IF claims IS NULL OR NOT COALESCE(is_super_admin, false) THEN
    RAISE EXCEPTION 'Access denied: super_admin only'
      USING ERRCODE = '42501';
  END IF;

  -- Normaliza parâmetros (evita 42804 por tipo/timestamptz no binding)
  p_search_text := NULLIF(trim(COALESCE(p_search_text, '')), '');
  p_source := NULLIF(trim(COALESCE(p_source, '')), '');
  v_from_date := NULL;
  IF p_from_date IS NOT NULL AND trim(p_from_date) <> '' THEN
    BEGIN
      v_from_date := (trim(p_from_date)::timestamptz);
    EXCEPTION WHEN OTHERS THEN
      v_from_date := NULL;
    END;
  END IF;
  v_to_date := NULL;
  IF p_to_date IS NOT NULL AND trim(p_to_date) <> '' THEN
    BEGIN
      v_to_date := (trim(p_to_date)::timestamptz);
    EXCEPTION WHEN OTHERS THEN
      v_to_date := NULL;
    END;
  END IF;

  RETURN QUERY
  WITH neurodesign_images AS (
    SELECT
      i.id,
      'neurodesign'::text AS source,
      i.url AS image_url,
      COALESCE(i.thumbnail_url, i.url) AS thumbnail_url,
      i.width,
      i.height,
      i.created_at,
      i.project_id::text AS project_id,
      p.name AS project_name,
      p.owner_user_id,
      u.email AS owner_email
    FROM neurodesign_generated_images i
    JOIN neurodesign_projects p
      ON p.id = i.project_id
    LEFT JOIN auth.users u
      ON u.id = p.owner_user_id
  ),
  site_images AS (
    -- Imagens salvas pelo Criador de Site (site_project_images)
    -- Pode ser ajustado se a tabela não existir ou tiver outros campos.
    SELECT
      s.id,
      'site'::text AS source,
      s.image_url AS image_url,
      s.image_url AS thumbnail_url,
      NULL::integer AS width,
      NULL::integer AS height,
      s.created_at,
      s.project_id::text AS project_id,
      COALESCE(sp.name::text, CONCAT('Site Project ', s.project_id::text)) AS project_name,
      s.user_id AS owner_user_id,
      u.email AS owner_email
    FROM site_project_images s
    LEFT JOIN site_projects sp
      ON sp.id = s.project_id
    LEFT JOIN auth.users u
      ON u.id = s.user_id
  ),
  all_images AS (
    SELECT * FROM neurodesign_images
    UNION ALL
    SELECT * FROM site_images
  )
  SELECT
    ai.id,
    ai.source,
    ai.image_url,
    ai.thumbnail_url,
    ai.width,
    ai.height,
    ai.created_at,
    ai.project_id,
    ai.project_name,
    ai.owner_user_id,
    ai.owner_email
  FROM all_images ai
  WHERE
    (
      p_source IS NULL
      OR trim(lower(p_source)) = ''
      OR lower(ai.source) = lower(p_source)
    )
    AND (
      p_search_text IS NULL
      OR trim(p_search_text) = ''
      OR ai.owner_email ILIKE '%' || p_search_text || '%'
      OR ai.project_name ILIKE '%' || p_search_text || '%'
    )
    AND (v_from_date IS NULL OR ai.created_at >= v_from_date)
    AND (v_to_date IS NULL OR ai.created_at <= v_to_date)
  ORDER BY ai.created_at DESC
  LIMIT COALESCE(p_limit, 50)
  OFFSET COALESCE(p_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_superadmin_gallery_images(
  p_source text,
  p_search_text text,
  p_from_date text,
  p_to_date text,
  p_limit integer,
  p_offset integer
) TO authenticated, service_role;

