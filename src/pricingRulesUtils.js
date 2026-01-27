// Utilitaires pour la gestion des règles de prix

const DEFAULT_RULES = {
  version: 1,
  categoryTypeRules: [],
  priceBandRules: [],
  sizeRules: [],
  tierRules: [],
  stockRules: [],
};

// Charger les règles depuis localStorage
export const loadRulesFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem("priceToolRules");
    if (!stored) {
      return DEFAULT_RULES;
    }

    const parsed = JSON.parse(stored);

    // Valider la structure
    if (!parsed.version || parsed.version !== 1) {
      console.warn("❌ Version invalide des règles, utilisation des valeurs par défaut");
      return DEFAULT_RULES;
    }

    return {
      ...DEFAULT_RULES,
      ...parsed,
    };
  } catch (err) {
    console.error("❌ Erreur chargement des règles de prix:", err);
    return DEFAULT_RULES;
  }
};

// Sauvegarder les règles dans localStorage
export const saveRulesToLocalStorage = (rules) => {
  try {
    localStorage.setItem("priceToolRules", JSON.stringify(rules));
    console.log("✅ Règles de prix sauvegardées");
  } catch (err) {
    console.error("❌ Erreur sauvegarde des règles de prix:", err);
    throw err;
  }
};

// Générer un UUID v4
export const generateRuleId = () => {
  return crypto.randomUUID();
};

// Valider une règle
export const validateRule = (rule, type) => {
  // Pour les règles de prix band, valider operator et threshold
  if (type === "priceBand") {
    if (!rule.operator) {
      return { valid: false, error: "L'opérateur ne peut pas être vide" };
    }
    if (rule.threshold === null || rule.threshold === undefined || rule.threshold === "") {
      return { valid: false, error: "Le seuil de prix ne peut pas être vide" };
    }
  } else if (type === "stock") {
    // Pour les règles de stock, valider stockStatus et unitDifference
    if (!rule.stockStatus || !["Surstock", "Sousstock"].includes(rule.stockStatus)) {
      return { valid: false, error: "L'état du stock doit être 'Surstock' ou 'Sousstock'" };
    }
    if (rule.unitDifference === null || rule.unitDifference === undefined || rule.unitDifference === "") {
      return { valid: false, error: "La différence d'unités ne peut pas être vide" };
    }
    const unitDiff = parseInt(rule.unitDifference);
    if (!Number.isFinite(unitDiff) || unitDiff < 0) {
      return { valid: false, error: "La différence d'unités doit être un nombre positif" };
    }
  } else {
    // Pour les autres règles, valider condition
    if (!rule.condition || rule.condition.trim() === "") {
      return { valid: false, error: "La condition ne peut pas être vide" };
    }
  }

  const rate = parseFloat(rule.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return { valid: false, error: "Le taux doit être un nombre positif" };
  }

  if (rate > 10) {
    console.warn(`⚠️ Taux extrême détecté: ${rate}`);
  }

  return { valid: true };
};

// Formater une règle pour l'affichage
export const getRuleDisplayText = (rule, type) => {
  const percentChange = ((rule.rate - 1) * 100).toFixed(1);
  const sign = rule.rate > 1 ? "+" : "";

  if (type === "priceBand") {
    return `Si ${rule.priceBand} (${rule.categoryType}) alors ${sign}${percentChange}%`;
  }

  return `Si ${rule.condition} alors ${sign}${percentChange}%`;
};

// Appliquer les règles de prix de manière séquentielle
export const applyPricingRules = (basePrice, rules, context) => {
  // context = { categoryType, estimatedPrice, size, tier }
  let currentPrice = basePrice;
  const details = {};

  // 1. Règle catégorie + type
  const catRule = rules.categoryTypeRules.find(
    (r) => r.enabled && r.condition === context.categoryType
  );
  if (catRule) {
    currentPrice *= catRule.rate;
    details.categoryTypeMultiplier = catRule.rate;
    details.afterCategoryType = currentPrice;
  }

  // 2. Règle tranche de prix (conditions numériques avec opérateurs)
  const priceRule = rules.priceBandRules.find((r) => {
    if (!r.enabled) return false;

    const estimatedPrice = context.estimatedPrice;
    const threshold = r.threshold;

    switch (r.operator) {
      case ">":
        return estimatedPrice > threshold;
      case "<":
        return estimatedPrice < threshold;
      case ">=":
        return estimatedPrice >= threshold;
      case "<=":
        return estimatedPrice <= threshold;
      case "=":
        return estimatedPrice === threshold;
      default:
        return false;
    }
  });

  if (priceRule) {
    currentPrice *= priceRule.rate;
    details.priceBandMultiplier = priceRule.rate;
    details.priceBandCondition = priceRule;
    details.afterPriceBand = currentPrice;
  }

  // 3. Règle taille
  const sizeRule = rules.sizeRules.find(
    (r) => r.enabled && r.condition === context.size
  );
  if (sizeRule) {
    currentPrice *= sizeRule.rate;
    details.sizeMultiplier = sizeRule.rate;
    details.afterSize = currentPrice;
  }

  // 4. Règle tier
  const tierRule = rules.tierRules.find(
    (r) => r.enabled && r.condition === context.tier
  );
  if (tierRule) {
    currentPrice *= tierRule.rate;
    details.tierMultiplier = tierRule.rate;
    details.afterTier = currentPrice;
  }

  // 5. Règle stock
  if (context.stockStatus) {
    const stockRule = rules.stockRules?.find((r) => {
      if (!r.enabled) return false;
      // Vérifie si le statut du stock correspond ET si la différence est >= au seuil
      return (
        r.stockStatus === context.stockStatus &&
        Math.abs(context.stockDifference || 0) >= parseInt(r.unitDifference)
      );
    });

    if (stockRule) {
      currentPrice *= stockRule.rate;
      details.stockMultiplier = stockRule.rate;
      details.stockCondition = stockRule;
      details.afterStock = currentPrice;
    }
  }

  return {
    ...details,
    result: currentPrice,
  };
};

// Calculer l'état du stock (Surstock, Sousstock, ou Normal)
// basé sur le parking virtuel et le contexte du vélo
export const calculateStockStatus = (velosInCategory, stockObjective) => {
  // velosInCategory = nombre d'unités actuellement en stock pour cette catégorie
  // stockObjective = nombre cible d'unités pour cette catégorie

  if (!stockObjective || stockObjective <= 0) {
    return { status: null, difference: 0 };
  }

  const difference = velosInCategory - stockObjective;

  if (difference > 0) {
    return { status: "Surstock", difference: Math.abs(difference) };
  } else if (difference < 0) {
    return { status: "Sousstock", difference: Math.abs(difference) };
  } else {
    return { status: null, difference: 0 };
  }
};

