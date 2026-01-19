-- =========================================
-- Script de correction pour pv_settings
-- =========================================
-- Sépare les paramètres GLOBAUX (catégories %, tailles %, objectif) 
-- des paramètres SCOPÉS par catégorie (prix %, tiers marques)
-- INSTRUCTIONS: Sélectionnez tout et exécutez d'un coup

-- 1. Ajouter les colonnes manquantes (si elles n'existent pas déjà)
ALTER TABLE pv_settings 
  ADD COLUMN IF NOT EXISTS category_pct JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS price_pct JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Mettre à jour les colonnes existantes pour qu'elles aient des valeurs par défaut
ALTER TABLE pv_settings 
  ALTER COLUMN objective_total SET DEFAULT 600,
  ALTER COLUMN cat_mar_pct SET DEFAULT '{"A": 0.6, "B": 0.3, "C": 0.1, "D": 0.0}'::JSONB,
  ALTER COLUMN size_pct SET DEFAULT '{}'::JSONB,
  ALTER COLUMN category_pct SET DEFAULT '{}'::JSONB,
  ALTER COLUMN price_pct SET DEFAULT '{}'::JSONB;

-- 3. Créer une ligne GLOBALE pour les paramètres partagés (catégories %, tailles %, objectif)
INSERT INTO pv_settings (id, objective_total, category_pct, size_pct, cat_mar_pct, price_pct, created_at, updated_at)
VALUES (
  'global',
  600,
  '{}'::JSONB,  -- À remplir par l'application
  '{}'::JSONB,  -- À remplir par l'application
  '{}'::JSONB,  -- Pas utilisé dans global
  '{}'::JSONB,  -- Pas utilisé dans global
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;  -- Ne pas écraser si existe déjà

-- 4. Activer RLS (Row Level Security) si pas déjà fait
ALTER TABLE pv_settings ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques et en créer de nouvelles
DROP POLICY IF EXISTS "pv_settings_policy" ON pv_settings;
DROP POLICY IF EXISTS "Allow all for pv_settings" ON pv_settings;

CREATE POLICY "Allow all for pv_settings"
  ON pv_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Nettoyer les données existantes invalides
UPDATE pv_settings 
SET 
  category_pct = COALESCE(category_pct, '{}'::JSONB),
  price_pct = COALESCE(price_pct, '{}'::JSONB),
  cat_mar_pct = COALESCE(cat_mar_pct, '{"A": 0.6, "B": 0.3, "C": 0.1, "D": 0.0}'::JSONB),
  size_pct = COALESCE(size_pct, '{}'::JSONB),
  objective_total = COALESCE(objective_total, 600)
WHERE 
  category_pct IS NULL 
  OR price_pct IS NULL 
  OR cat_mar_pct IS NULL
  OR size_pct IS NULL
  OR objective_total IS NULL;
