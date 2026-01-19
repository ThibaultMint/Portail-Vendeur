-- =====================================================
-- Mise à jour table INVENTORY : Suppression colonnes inutiles
-- =====================================================

-- Supprimer les colonnes inutiles
ALTER TABLE inventory DROP COLUMN IF EXISTS type_achat;
ALTER TABLE inventory DROP COLUMN IF EXISTS annee_reelle;
ALTER TABLE inventory DROP COLUMN IF EXISTS age_velo;
ALTER TABLE inventory DROP COLUMN IF EXISTS sous_type_velo;
ALTER TABLE inventory DROP COLUMN IF EXISTS pct_neuf_achat_demande;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_vente_estime;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_achat_optimise;
ALTER TABLE inventory DROP COLUMN IF EXISTS marge_commerciale_estime;
ALTER TABLE inventory DROP COLUMN IF EXISTS pct_marge_commerciale_estime;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_optimise_vs_demande_pct;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_optimise_vs_demande_eur;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_achat_max;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_max_vs_demande_pct;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_max_vs_demande_eur;
ALTER TABLE inventory DROP COLUMN IF EXISTS vae_marque_moteur_batterie;
ALTER TABLE inventory DROP COLUMN IF EXISTS prix_achat_demande;
ALTER TABLE inventory DROP COLUMN IF EXISTS pct_neuf_vente_estime;

-- Commentaires mis à jour
COMMENT ON COLUMN inventory.type_velo IS 'Catégorie: Vélo De Route, Vélo de ville, VTT, Gravel, Cargo, etc.';
COMMENT ON COLUMN inventory.is_vae IS 'Type de vélo: true = Électrique, false = Musculaire';
COMMENT ON COLUMN inventory.vae_kilometrage IS 'Kilométrage (pour vélos électriques)';
