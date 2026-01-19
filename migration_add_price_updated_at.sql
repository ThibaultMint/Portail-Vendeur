-- =====================================================
-- Migration: Ajouter price_updated_at à mode_pricing
-- =====================================================
-- Cette colonne trace uniquement les changements de pricing
-- (best_used_url, prix, etc.), contrairement à updated_at
-- qui trace toutes les modifications (promo, acheteur, etc.)
-- =====================================================

-- 1. Ajouter la nouvelle colonne
ALTER TABLE mode_pricing
ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ;

-- 2. Initialiser avec la valeur actuelle de updated_at
--    pour les lignes existantes
UPDATE mode_pricing
SET price_updated_at = updated_at
WHERE price_updated_at IS NULL;

-- 3. Créer un index pour améliorer les performances de tri
--    (utile quand vous triez par "Date du dernier pricing")
CREATE INDEX IF NOT EXISTS idx_mode_pricing_price_updated_at 
ON mode_pricing(price_updated_at DESC);

-- 4. Vérifier le résultat
SELECT 
  mint_url,
  updated_at,
  price_updated_at,
  CASE 
    WHEN price_updated_at IS NULL THEN '❌ NULL'
    WHEN price_updated_at = updated_at THEN '✅ Initialisé'
    ELSE '⚠️ Différent'
  END as status
FROM mode_pricing
LIMIT 10;
