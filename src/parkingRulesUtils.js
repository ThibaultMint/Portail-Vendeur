// Utilitaires pour la gestion des règles du Parking Virtuel
import { supabase } from "./supabaseClient";

const DEFAULT_PARKING_RULES = {
  objectiveTotal: 600,
  categoryPct: {},  // { "VTT - Électrique": 0.25, ... }
  sizePct: {},      // { "S": 0.2, "M": 0.3, ... }
  tierPct: {},      // { "A": 0.4, "B": 0.3, ... }
};

// Charger les règles du parking depuis Supabase
export const loadParkingRulesFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from("pv_parking_rules")
      .select("*")
      .eq("id", "global")
      .single();

    if (error) {
      // Si la table n'existe pas ou pas de données, retourner les défauts
      if (error.code === "PGRST116" || error.code === "42P01") {
        console.warn("⚠️ Table pv_parking_rules non trouvée ou vide, utilisation des valeurs par défaut");
        return DEFAULT_PARKING_RULES;
      }
      console.warn("⚠️ Erreur chargement règles parking Supabase:", error.message);
      return DEFAULT_PARKING_RULES;
    }

    if (!data) {
      return DEFAULT_PARKING_RULES;
    }

    return {
      objectiveTotal: data.objective_total ?? DEFAULT_PARKING_RULES.objectiveTotal,
      categoryPct: data.category_pct ?? {},
      sizePct: data.size_pct ?? {},
      tierPct: data.tier_pct ?? {},
    };
  } catch (err) {
    console.error("❌ Erreur chargement des règles parking:", err);
    return DEFAULT_PARKING_RULES;
  }
};

// Sauvegarder les règles du parking dans Supabase
export const saveParkingRulesToSupabase = async (rules) => {
  try {
    const { error } = await supabase
      .from("pv_parking_rules")
      .upsert({
        id: "global",
        objective_total: rules.objectiveTotal ?? DEFAULT_PARKING_RULES.objectiveTotal,
        category_pct: rules.categoryPct ?? {},
        size_pct: rules.sizePct ?? {},
        tier_pct: rules.tierPct ?? {},
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("❌ Erreur sauvegarde parking Supabase:", error.message);
      throw error;
    }

    console.log("✅ Règles parking sauvegardées dans Supabase");
    return true;
  } catch (err) {
    console.error("❌ Erreur sauvegarde des règles parking:", err);
    throw err;
  }
};

// Sauvegarder une partie des règles (mise à jour partielle)
export const updateParkingRulesPartial = async (updates) => {
  try {
    // D'abord charger les règles actuelles
    const currentRules = await loadParkingRulesFromSupabase();

    // Fusionner avec les mises à jour
    const mergedRules = {
      ...currentRules,
      ...updates,
    };

    // Si on met à jour des objets imbriqués (categoryPct, sizePct, tierPct),
    // on fusionne au lieu de remplacer
    if (updates.categoryPct) {
      mergedRules.categoryPct = { ...currentRules.categoryPct, ...updates.categoryPct };
    }
    if (updates.sizePct) {
      mergedRules.sizePct = { ...currentRules.sizePct, ...updates.sizePct };
    }
    if (updates.tierPct) {
      mergedRules.tierPct = { ...currentRules.tierPct, ...updates.tierPct };
    }

    // Sauvegarder
    await saveParkingRulesToSupabase(mergedRules);

    return mergedRules;
  } catch (err) {
    console.error("❌ Erreur mise à jour partielle des règles parking:", err);
    throw err;
  }
};

// Initialiser les catégories avec des pourcentages par défaut si vides
export const initializeCategoryPct = (categories, existingPct = {}) => {
  const result = { ...existingPct };
  const defaultPct = categories.length > 0 ? 1 / categories.length : 0;

  categories.forEach(cat => {
    if (!(cat in result)) {
      result[cat] = defaultPct;
    }
  });

  return result;
};

// Initialiser les tailles avec des pourcentages par défaut si vides
export const initializeSizePct = (sizes, existingPct = {}) => {
  const result = { ...existingPct };
  const defaultPct = sizes.length > 0 ? 1 / sizes.length : 0;

  sizes.forEach(size => {
    if (!(size in result)) {
      result[size] = defaultPct;
    }
  });

  return result;
};

// Initialiser les tiers avec des pourcentages par défaut si vides
export const initializeTierPct = (existingPct = {}) => {
  const defaultTiers = { A: 0.40, B: 0.30, C: 0.20, D: 0.10 };
  return { ...defaultTiers, ...existingPct };
};

// Normaliser les pourcentages pour qu'ils totalisent 100%
export const normalizePct = (pctObj) => {
  const total = Object.values(pctObj).reduce((sum, v) => sum + (v || 0), 0);
  if (total === 0) return pctObj;

  const result = {};
  for (const [key, value] of Object.entries(pctObj)) {
    result[key] = (value || 0) / total;
  }
  return result;
};

// Calculer l'objectif pour une combinaison catégorie/taille/prix
export const calculateObjective = (objectiveTotal, categoryPct, sizePct, pricePct, selection) => {
  let objective = objectiveTotal;

  if (selection.category && categoryPct[selection.category]) {
    objective *= categoryPct[selection.category];
  }

  if (selection.size && sizePct[selection.size]) {
    objective *= sizePct[selection.size];
  }

  if (selection.priceBand && pricePct && pricePct[selection.priceBand]) {
    objective *= pricePct[selection.priceBand];
  }

  return Math.round(objective);
};
