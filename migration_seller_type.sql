-- Migration : Séparer le champ seller en seller_type et seller
-- Date : 2026-01-18

-- 1) Ajouter la nouvelle colonne seller_type
ALTER TABLE mode_pricing ADD COLUMN IF NOT EXISTS seller_type TEXT;

-- 2) Migrer les données existantes
-- Si seller contient " - ", on extrait la partie avant comme type et après comme nom
-- Sinon, on laisse tout dans seller et seller_type reste null

UPDATE mode_pricing
SET 
  seller_type = CASE 
    WHEN seller LIKE '%-%' THEN TRIM(SPLIT_PART(seller, '-', 1))
    ELSE NULL
  END,
  seller = CASE 
    WHEN seller LIKE '%-%' THEN TRIM(SPLIT_PART(seller, '-', 2))
    ELSE seller
  END
WHERE seller IS NOT NULL AND seller != '';

-- 3) Vérification (optionnel - à exécuter séparément pour vérifier)
-- SELECT seller_type, seller, COUNT(*) 
-- FROM mode_pricing 
-- WHERE seller IS NOT NULL OR seller_type IS NOT NULL
-- GROUP BY seller_type, seller
-- ORDER BY COUNT(*) DESC;
