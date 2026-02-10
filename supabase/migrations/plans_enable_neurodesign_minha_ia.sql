-- Ativa NeuroDesign para o plano "MINHA IA"
-- Executar no Supabase SQL Editor após plans_add_neurodesign_access.sql

UPDATE plans
SET has_neurodesign_access = true
WHERE name ILIKE '%MINHA IA%' OR name ILIKE '%minha ia%';
