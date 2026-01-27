import React, { useState, useMemo, useEffect } from "react";
import PricingRulesManager from "./PricingRulesManager";
import {
  loadRulesFromLocalStorage,
  saveRulesToLocalStorage,
  applyPricingRules,
  calculateStockStatus,
} from "./pricingRulesUtils";

const PriceToolModal = ({
  isOpen,
  onClose,
  form,
  onFormChange,
  competitorLinks,
  onSearchCompetitors,
  showCompetitors,
  onShowCompetitors,
  allBrands,
  parkingCategories,
  velos,
  brandTiersIndex,
  parkingRules,
  getCatMarFromRow,
  allPriceBandsByCategory,
  parkingTierPct,
  getRowTotalStock,
  getSizeStocksFromRow,
  getVariantSizeBucketsFromRow,
}) => {
  // Convertir taille numérique ou lettre en taille lettre normalisée
  const mapFrameSizeToLetter = (sizeValue) => {
    if (!sizeValue) return null;

    const str = String(sizeValue).trim().toUpperCase();

    // Si c'est déjà une lettre valide
    if (["XS", "S", "M", "L", "XL"].includes(str)) {
      return str;
    }

    // Si c'est numérique
    const size = Number(sizeValue);
    if (isNaN(size)) return null;

    if (size <= 48) return "XS";
    if (size <= 52) return "S";
    if (size < 56) return "M";
    if (size <= 60) return "L";
    return "XL";
  };

  // Marge souhaitée par défaut
  const DESIRED_MARGIN = 550;

  // Parser une valeur numérique (gère les formats comme "1 234,50 €")
  const parseNumericValue = (val) => {
    if (val == null) return null;
    const str = String(val).replace(/[^0-9.,-]/g, "").replace(",", ".");
    const num = parseFloat(str);
    return Number.isNaN(num) ? null : num;
  };

  // Calculer le prix moyen des vélos en stock
  const calculateAveragePrice = (velosArray) => {
    if (!velosArray || velosArray.length === 0) return 0;

    let totalPrice = 0;
    for (const velo of velosArray) {
      const price = parseNumericValue(velo?.["Prix réduit"]);
      if (Number.isFinite(price) && price > 0) {
        totalPrice += price;
      }
    }

    return velosArray.length > 0 ? totalPrice / velosArray.length : 0;
  };

  // Constantes pour les calculs
  const PARTS_FEE_RATE = 0.07; // 7% du prix de vente
  const TRANSPORT_COST = 150; // 150€

  // Normaliser une string (comme dans App.js)
  const norm = (str) => {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Créer la clé du tier (comme dans App.js)
  const makeTierKey = (category, bikeType, brand) =>
    `${norm(category)}||${norm(bikeType)}||${norm(brand)}`.toLowerCase();

  // Obtenir le tier de la marque basé sur catégorie + type + marque
  const getBrandTier = () => {
    if (!form.brand || !form.category) return null;

    // Extraire category et type de vélo du form.category (format: "VTT - Musculaire")
    const [category, bikeType] = form.category.split(" - ").map(s => s.trim());

    if (!category || !bikeType) return null;

    // 1) Chercher avec catégorie + type + marque
    const k1 = makeTierKey(category, bikeType, form.brand);
    const tier1 = brandTiersIndex?.get(k1);
    if (tier1) return tier1;

    // 2) Fallback avec catégorie + "Tous" + marque
    const k2 = makeTierKey(category, "Tous", form.brand);
    const tier2 = brandTiersIndex?.get(k2);
    if (tier2) return tier2;

    return null;
  };

  // Calcul complet de l'algorithme de prix
  const calculateCompleteAlgo = () => {
    const estimatedPrice = parseFloat(form.estimatedPrice);
    const avgPrice = calculateAveragePrice(velos);

    if (!Number.isFinite(estimatedPrice) || avgPrice <= 0) {
      return null;
    }

    // Étape 1 : Marge
    const marginRate = DESIRED_MARGIN / avgPrice;
    const priceAfterMargin = estimatedPrice * (1 - marginRate);

    // Étape 2 : Frais de pièces (7% du prix de vente)
    const partsFee = estimatedPrice * PARTS_FEE_RATE;
    const priceAfterParts = priceAfterMargin - partsFee;

    // Étape 3 : Frais de transport (150€, optionnel)
    const transportFee = form.skipTransportCost ? 0 : TRANSPORT_COST;
    const priceAfterTransport = priceAfterParts - transportFee;

    // Calculer l'état du stock MULTI-CRITÈRES pour le contexte
    let stockStatus = null;
    let stockDifference = 0;

    if (form.category && velos && parkingRules) {
      // Trouver la tranche de prix avec son pourcentage depuis allPriceBandsByCategory
      // IMPORTANT: Utiliser price < max (exclusif) comme dans le parking virtuel
      const bands = allPriceBandsByCategory?.[form.category] || [];
      const matchingBand = bands.find(band => {
        const minPrice = band.min_price ?? band.min ?? 0;
        const maxPrice = band.max_price ?? band.max;
        const minOk = estimatedPrice >= minPrice;
        const maxOk = maxPrice === null || maxPrice === undefined || estimatedPrice < maxPrice;
        return minOk && maxOk;
      });
      const priceBandLabel = matchingBand?.label || null;
      const rawSharePct = matchingBand?.share_pct ?? 0;
      const pricePct = rawSharePct > 1 ? rawSharePct / 100 : rawSharePct;

      // Fonction helper pour déterminer la tranche de prix (pour filtrer les vélos)
      // Même logique que getPriceBand dans App.js
      const getPriceBandForPrice = (price, categoryType) => {
        if (!price || !categoryType || !allPriceBandsByCategory) return null;
        const categoryBands = allPriceBandsByCategory[categoryType];
        if (!categoryBands || categoryBands.length === 0) return null;
        for (const band of categoryBands) {
          const minP = band.min_price ?? band.min ?? 0;
          const maxP = band.max_price ?? band.max;
          const minOk = price >= minP;
          const maxOk = maxP === null || maxP === undefined || price < maxP;
          if (minOk && maxOk) return band.label;
        }
        return null;
      };

      // Helper pour compter les unités (pas les lignes)
      const sumUnits = (rows) => {
        if (!getRowTotalStock) return rows.length; // Fallback si pas de fonction
        return rows.reduce((sum, r) => sum + (getRowTotalStock(r) || 0), 0);
      };

      // Helper pour compter les unités par taille (même logique que parking virtuel)
      const sumUnitsForSize = (rows, targetSize) => {
        let total = 0;
        for (const r of rows) {
          // 1) Si on a le détail par taille, on prend la vérité
          const sizeStocks = getSizeStocksFromRow ? getSizeStocksFromRow(r) : null;
          if (sizeStocks && sizeStocks[targetSize]) {
            total += Number(sizeStocks[targetSize] || 0);
            continue;
          }

          // 2) Fallback: split égal entre les tailles disponibles (comme parking virtuel)
          const totalStock = getRowTotalStock ? (getRowTotalStock(r) || 0) : 1;
          const buckets = getVariantSizeBucketsFromRow ? getVariantSizeBucketsFromRow(r) : null;
          if (buckets && buckets.length > 0 && buckets.includes(targetSize)) {
            total += totalStock / buckets.length;
          }
        }
        // Arrondir car on parle d'unités réelles
        return Math.round(total);
      };

      const objectiveTotal = Number(parkingRules.objectiveTotal || 0);
      const categoryPct = parkingRules.categoryPct?.[form.category] || 0;
      const sizeLetter = mapFrameSizeToLetter(form.size);
      const sizePct = sizeLetter ? (parkingRules.sizePct?.[sizeLetter] || 0) : 0;
      const tier = getBrandTier();
      const tierPctVal = tier ? (parkingTierPct?.[tier] || 0) : 0;

      // Filtrer les vélos par catégorie
      const velosInCategory = velos.filter(v => {
        const veloCategory = v?.["Catégorie"] ?? v?.["Catégorie vente"] ?? "";
        const veloType = v?.["Type de vélo"] ?? v?.["Type velo"] ?? "";
        const combinedCategory = `${veloCategory}${veloType ? " - " + veloType : ""}`.trim();
        return norm(combinedCategory) === norm(form.category);
      });

      // Calcul cascadé des objectifs et du stock réel
      const categoryTarget = Math.round(objectiveTotal * categoryPct);

      // Par défaut: niveau catégorie - COMPTER LES UNITÉS
      let actualUnits = sumUnits(velosInCategory);
      let targetUnits = categoryTarget;
      let filteredVelos = velosInCategory;

      // Niveau taille (si disponible) - COMPTER LES UNITÉS PAR TAILLE
      if (sizeLetter && sizePct > 0 && categoryTarget > 0) {
        actualUnits = sumUnitsForSize(velosInCategory, sizeLetter);
        // Filtrer pour les niveaux suivants (même logique que parking virtuel)
        filteredVelos = velosInCategory.filter(v => {
          // 1) Vérifier getSizeStocksFromRow
          const sizeStocks = getSizeStocksFromRow ? getSizeStocksFromRow(v) : null;
          if (sizeStocks) return Object.keys(sizeStocks).includes(sizeLetter);
          // 2) Fallback: vérifier getVariantSizeBucketsFromRow (comme parking virtuel)
          const buckets = getVariantSizeBucketsFromRow ? getVariantSizeBucketsFromRow(v) : null;
          if (buckets && buckets.length > 0) return buckets.includes(sizeLetter);
          // 3) Dernier fallback: champ taille direct
          const vSize = mapFrameSizeToLetter(v?.["Taille cadre"] ?? v?.["Taille"] ?? "");
          return vSize === sizeLetter;
        });
        targetUnits = Math.round(categoryTarget * sizePct);
      }

      // Niveau prix (si disponible)
      if (priceBandLabel && pricePct > 0 && targetUnits > 0) {
        const sizeTarget = targetUnits;
        const velosForPrice = filteredVelos.filter(v => {
          const vPrice = parseNumericValue(v?.["Prix réduit"]);
          if (!vPrice) return false;
          const vBand = getPriceBandForPrice(vPrice, form.category);
          return vBand === priceBandLabel;
        });
        // Compter les unités de la taille sélectionnée dans ces vélos
        if (sizeLetter && sizePct > 0) {
          actualUnits = sumUnitsForSize(velosForPrice, sizeLetter);
        } else {
          actualUnits = sumUnits(velosForPrice);
        }
        filteredVelos = velosForPrice;
        targetUnits = Math.round(sizeTarget * pricePct);
      }

      // Niveau tier (si disponible)
      if (tier && tierPctVal > 0 && targetUnits > 0 && getCatMarFromRow) {
        const priceTarget = targetUnits;
        const velosForTier = filteredVelos.filter(v => {
          const vTier = getCatMarFromRow(v);
          return vTier === tier;
        });
        // Compter les unités
        if (sizeLetter && sizePct > 0) {
          actualUnits = sumUnitsForSize(velosForTier, sizeLetter);
        } else {
          actualUnits = sumUnits(velosForTier);
        }
        filteredVelos = velosForTier;
        targetUnits = Math.round(priceTarget * tierPctVal);
      }

      // Déterminer le statut final
      if (targetUnits > 0) {
        const diff = actualUnits - targetUnits;
        stockDifference = Math.abs(diff);
        if (diff > 0) {
          stockStatus = "Surstock";
        } else if (diff < 0) {
          stockStatus = "Sousstock";
        }
      }
    }

    // Étape 4 : Règles de prix
    let step4 = null;
    let finalPrice = Math.max(0, priceAfterTransport);

    if (pricingRules) {
      const context = {
        categoryType: form.category,
        estimatedPrice: estimatedPrice,
        size: mapFrameSizeToLetter(form.size),
        tier: getBrandTier(),
        stockStatus: stockStatus,
        stockDifference: stockDifference,
      };

      step4 = applyPricingRules(priceAfterTransport, pricingRules, context);
      finalPrice = Math.max(0, step4.result);
    }

    return {
      // Étape 1 - Marge
      step1: {
        avgPrice,
        desiredMargin: DESIRED_MARGIN,
        marginRate,
        marginRatePct: marginRate * 100,
        result: priceAfterMargin,
      },
      // Étape 2 - Frais de pièces
      step2: {
        partsFeeRate: PARTS_FEE_RATE * 100,
        partsFee,
        result: priceAfterParts,
      },
      // Étape 3 - Frais de transport
      step3: {
        transportFee,
        skipped: form.skipTransportCost,
        result: priceAfterTransport,
      },
      // Étape 4 - Règles de prix
      step4,
      // Résumé
      finalPrice,
    };
  };

  // Filtrer les marques pour l'autocomplete
  const [brandInput, setBrandInput] = useState(form.brand);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  // States pour les suggestions de taille
  const [showSizeSuggestions, setShowSizeSuggestions] = useState(false);
  const sizeOptions = ["XS", "S", "M", "L", "XL"];

  // State pour afficher/masquer les détails du calcul
  const [showAlgoDetails, setShowAlgoDetails] = useState(false);

  // State pour les onglets (Calcul ou Paramètres)
  const [activeTab, setActiveTab] = useState("calcul");

  // State pour les règles de prix
  const [pricingRules, setPricingRules] = useState(null);

  // Charger les règles au montage du composant
  useEffect(() => {
    const loadedRules = loadRulesFromLocalStorage();
    setPricingRules(loadedRules);
  }, []);

  // Mettre à jour les règles
  const updatePricingRules = (newRules) => {
    setPricingRules(newRules);
    saveRulesToLocalStorage(newRules);
  };

  const filteredBrands = useMemo(() => {
    if (!brandInput) return allBrands.slice(0, 10);
    const lower = brandInput.toLowerCase();
    return allBrands.filter(b => b.toLowerCase().includes(lower));
  }, [brandInput, allBrands]);

  const filteredSizes = useMemo(() => {
    if (!form.size) return sizeOptions;
    const upper = String(form.size).trim().toUpperCase();
    return sizeOptions.filter(s => s.includes(upper));
  }, [form.size]);

  if (!isOpen) return null;

  const handleBrandSelect = (brand) => {
    onFormChange({ ...form, brand });
    setBrandInput(brand);
    setShowBrandSuggestions(false);
  };

  const handleSizeSelect = (size) => {
    onFormChange({ ...form, size });
    setShowSizeSuggestions(false);
  };

  const handleInputChange = (field, value) => {
    onFormChange({ ...form, [field]: value });
    if (field === "brand") {
      setBrandInput(value);
    }
    if (field === "size") {
      setShowSizeSuggestions(true);
    }
  };

  const isFormComplete =
    form.brand && form.model && form.year && form.size && form.category && form.estimatedPrice;

  return (
    <>
      <div
        className="overlay"
        onClick={onClose}
        style={{ zIndex: 1000 }}
      />

      <div className="modal-preview" style={{ zIndex: 1001, maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2>💲 Outil Prix - Reprise Vélo</h2>
          <button
            className="close-btn"
            onClick={onClose}
            style={{ cursor: "pointer", background: "none", border: "none", fontSize: 24 }}
          >
            ✖
          </button>
        </div>

        {/* ===== TAB SWITCHER ===== */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "2px solid #e5e7eb", paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab("calcul")}
            style={{
              padding: "7px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(0,0,0,0.15)",
              background: activeTab === "calcul" ? "#10b981" : "#fff",
              color: activeTab === "calcul" ? "#fff" : "#000",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Calcul
          </button>
          <button
            onClick={() => setActiveTab("parametres")}
            style={{
              padding: "7px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(0,0,0,0.15)",
              background: activeTab === "parametres" ? "#10b981" : "#fff",
              color: activeTab === "parametres" ? "#fff" : "#000",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ⚙️ Paramètres
          </button>
        </div>

        {/* ===== ONGLET CALCUL ===== */}
        {activeTab === "calcul" && (
          <>
            {/* ===== PARTIE 1: Informations Vélo ===== */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #e5e7eb" }}>
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
            1️⃣ Informations du Vélo
          </h3>

          {/* Ligne 1: Marque, Modèle, Année */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px", gap: 12, marginBottom: 16 }}>
            {/* Marque avec autocomplete */}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
                Marque
              </label>
              <input
                type="text"
                value={brandInput}
                onChange={(e) => {
                  setBrandInput(e.target.value);
                  onFormChange({ ...form, brand: e.target.value });
                  setShowBrandSuggestions(true);
                }}
                onFocus={() => setShowBrandSuggestions(true)}
                placeholder="Marque (libre ou auto)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
              {showBrandSuggestions && filteredBrands.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderTop: "none",
                    borderRadius: "0 0 6px 6px",
                    maxHeight: 150,
                    overflowY: "auto",
                    zIndex: 1002,
                  }}
                >
                  {filteredBrands.map((brand, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleBrandSelect(brand)}
                      style={{
                        padding: "8px 10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: 13,
                        background: idx % 2 === 0 ? "#fafafa" : "#fff",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#e3f2fd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fafafa" : "#fff")}
                    >
                      {brand}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modèle */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
                Modèle
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="Ex: Gravel 3"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Année */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
                Année
              </label>
              <select
                value={form.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="">-- Sélectionner --</option>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = [];
                  for (let y = 2018; y <= currentYear; y++) {
                    years.push(y);
                  }
                  return years.reverse().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

        </div>

        {/* ===== BOUTON RECHERCHE ANNONCES ===== */}
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <button
            onClick={() => onSearchCompetitors()}
            disabled={!form.brand || !form.model || !form.year}
            style={{
              padding: "10px 20px",
              background: form.brand && form.model && form.year ? "#3b82f6" : "#cbd5e1",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: form.brand && form.model && form.year ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (form.brand && form.model && form.year) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = form.brand && form.model && form.year ? "#3b82f6" : "#cbd5e1";
            }}
          >
            🔎 Recherche Annonces Concurrence
          </button>
        </div>

        {/* Afficher les liens si recherche effectuée */}
        {showCompetitors && competitorLinks.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: "#f9fafb", borderRadius: 6 }}>
            <h4 style={{ marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
              Annonces Concurrence ({competitorLinks.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {competitorLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    background: link.color,
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ===== PARTIE 2: Algorithme Prix ===== */}
        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: "2px solid #e5e7eb" }}>
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
            2️⃣ Calcul du Prix de Reprise
          </h3>

          {/* Catégorie + Type de Vélo */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
              Catégorie + Type de Vélo
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <select
                value={form.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="">-- Sélectionner --</option>
                {parkingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Afficher la catégorie de marque (tier) */}
              {(() => {
                const tier = getBrandTier();
                if (!tier) return null;

                const tierColors = {
                  "A": { bg: "#dcfce7", border: "#86efac", text: "#059669", label: "Tier A" },
                  "B": { bg: "#dbeafe", border: "#93c5fd", text: "#0369a1", label: "Tier B" },
                  "C": { bg: "#fef3c7", border: "#fcd34d", text: "#b45309", label: "Tier C" },
                  "D": { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", label: "Tier D" },
                };
                const tierColor = tierColors[tier] || { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280" };

                return (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: tierColor.bg,
                      border: `1px solid ${tierColor.border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: tierColor.text,
                      whiteSpace: "nowrap",
                      minWidth: "80px",
                      textAlign: "center",
                    }}
                  >
                    {tier}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Taille - Input texte avec suggestions */}
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
              Taille Cadre
            </label>
            <input
              type="text"
              value={form.size}
              onChange={(e) => handleInputChange("size", e.target.value)}
              onFocus={() => setShowSizeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSizeSuggestions(false), 200)}
              placeholder="Ex: 58 ou M"
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            {showSizeSuggestions && filteredSizes.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  maxHeight: 150,
                  overflowY: "auto",
                  zIndex: 1002,
                }}
              >
                {filteredSizes.map((size, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSizeSelect(size)}
                    style={{
                      padding: "8px 10px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: 13,
                      background: idx % 2 === 0 ? "#fafafa" : "#fff",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e3f2fd")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fafafa" : "#fff")}
                  >
                    {size}
                  </div>
                ))}
              </div>
            )}
            {form.size && mapFrameSizeToLetter(form.size) && (
              <div style={{ marginTop: 4, fontSize: 11, color: "#059669", fontWeight: 500 }}>
                ✓ Conversion: {mapFrameSizeToLetter(form.size)}
              </div>
            )}
          </div>

          {/* Prix de vente estimé */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
              Prix de Vente Estimé (€)
            </label>
            <input
              type="number"
              value={form.estimatedPrice}
              onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
              placeholder="Ex: 450"
              min="0"
              step="10"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                boxSizing: "border-box",
                fontWeight: 600,
              }}
            />
            {form.estimatedPrice && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#666", fontStyle: "italic" }}>
                💡 C'est le prix que tu comptes vendre ce vélo. Tout l'algo de reprise se basera sur cette valeur.
              </div>
            )}
          </div>

          {/* Checkbox pour les frais de transport */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="skipTransport"
              checked={form.skipTransportCost || false}
              onChange={(e) => handleInputChange("skipTransportCost", e.target.checked)}
              style={{
                width: 16,
                height: 16,
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="skipTransport"
              style={{
                fontSize: 12,
                color: "#666",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Le client pose le vélo à l'entrepôt (pas de frais de transport)
            </label>
          </div>

          {/* Affichage des résultats */}
          {(() => {
            const result = calculateCompleteAlgo();
            if (!result) {
              return (
                <div
                  style={{
                    padding: 16,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#1e40af",
                  }}
                >
                  ℹ️ Remplis le prix de vente estimé pour voir le calcul.
                </div>
              );
            }

            // Déterminer la tranche de prix applicable pour un prix donné
            // IMPORTANT: Même logique que getPriceBand dans App.js (price < max, exclusif)
            const getPriceBandForPrice = (price, categoryType) => {
              if (!price || !categoryType || !allPriceBandsByCategory) return null;

              const bands = allPriceBandsByCategory[categoryType];
              if (!bands || bands.length === 0) return null;

              for (const band of bands) {
                const minPrice = band.min_price ?? band.min ?? 0;
                const maxPrice = band.max_price ?? band.max;
                const minOk = price >= minPrice;
                const maxOk = maxPrice === null || maxPrice === undefined || price < maxPrice;
                if (minOk && maxOk) return band.label;
              }
              return null;
            };

            // Helper pour compter les unités (pas les lignes)
            const sumUnits = (rows) => {
              if (!getRowTotalStock) return rows.length;
              return rows.reduce((sum, r) => sum + (getRowTotalStock(r) || 0), 0);
            };

            // Helper pour compter les unités par taille (même logique que parking virtuel)
            const sumUnitsForSize = (rows, targetSize) => {
              let total = 0;
              for (const r of rows) {
                // 1) Si on a le détail par taille, on prend la vérité
                const sizeStocks = getSizeStocksFromRow ? getSizeStocksFromRow(r) : null;
                if (sizeStocks && sizeStocks[targetSize]) {
                  total += Number(sizeStocks[targetSize] || 0);
                  continue;
                }

                // 2) Fallback: split égal entre les tailles disponibles (comme parking virtuel)
                const totalStock = getRowTotalStock ? (getRowTotalStock(r) || 0) : 1;
                const buckets = getVariantSizeBucketsFromRow ? getVariantSizeBucketsFromRow(r) : null;
                if (buckets && buckets.length > 0 && buckets.includes(targetSize)) {
                  total += totalStock / buckets.length;
                }
              }
              // Arrondir car on parle d'unités réelles
              return Math.round(total);
            };

            // Calculer l'état du stock pour la catégorie actuelle (MULTI-CRITÈRES avec UNITÉS)
            const getStockStatus = () => {
              if (!form.category || !velos || !parkingRules) return null;

              const objectiveTotal = Number(parkingRules.objectiveTotal || 0);
              const categoryPct = parkingRules.categoryPct?.[form.category] || 0;
              const sizeLetter = mapFrameSizeToLetter(form.size);
              const sizePct = sizeLetter ? (parkingRules.sizePct?.[sizeLetter] || 0) : 0;
              const estimatedPrice = parseFloat(form.estimatedPrice);

              // Trouver la tranche de prix avec son pourcentage depuis allPriceBandsByCategory
              const bands = allPriceBandsByCategory?.[form.category] || [];
              const matchingBand = bands.find(band => {
                const minPrice = band.min_price ?? band.min ?? 0;
                const maxPrice = band.max_price ?? band.max;
                const minOk = estimatedPrice >= minPrice;
                const maxOk = maxPrice === null || maxPrice === undefined || estimatedPrice < maxPrice;
                return minOk && maxOk;
              });
              const priceBandLabel = matchingBand?.label || null;
              const rawSharePct = matchingBand?.share_pct ?? 0;
              const pricePct = rawSharePct > 1 ? rawSharePct / 100 : rawSharePct;

              const tier = getBrandTier();
              const tierPct = tier ? (parkingTierPct?.[tier] || 0) : 0;

              // Debug log
              console.log("📊 Stock multi-critères debug:", {
                category: form.category,
                estimatedPrice,
                matchingBand,
                priceBandLabel,
                rawSharePct,
                pricePct,
                tier,
                tierPct,
              });

              // ========== 1. Stock par Catégorie + Type (UNITÉS) ==========
              const velosInCategory = velos.filter(v => {
                const veloCategory = v?.["Catégorie"] ?? v?.["Catégorie vente"] ?? "";
                const veloType = v?.["Type de vélo"] ?? v?.["Type velo"] ?? "";
                const combinedCategory = `${veloCategory}${veloType ? " - " + veloType : ""}`.trim();
                return norm(combinedCategory) === norm(form.category);
              });
              const categoryActual = sumUnits(velosInCategory);
              const categoryTarget = Math.round(objectiveTotal * categoryPct);
              const categoryDiff = categoryActual - categoryTarget;
              const categoryStatus = categoryTarget > 0 ? (categoryDiff > 0 ? "Surstock" : categoryDiff < 0 ? "Sousstock" : null) : null;

              // ========== 2. Stock par Taille (UNITÉS par taille) ==========
              let sizeActual = 0;
              let sizeTarget = 0;
              let sizeStatus = null;
              let sizeDiff = 0;
              if (sizeLetter && sizePct > 0) {
                sizeActual = sumUnitsForSize(velosInCategory, sizeLetter);
                sizeTarget = Math.round(categoryTarget * sizePct);
                sizeDiff = sizeActual - sizeTarget;
                sizeStatus = sizeTarget > 0 ? (sizeDiff > 0 ? "Surstock" : sizeDiff < 0 ? "Sousstock" : null) : null;
              }

              // ========== 3. Stock par Tranche de prix (UNITÉS) ==========
              let priceActual = 0;
              let priceTarget = 0;
              let priceStatus = null;
              let priceDiff = 0;
              if (priceBandLabel && pricePct > 0) {
                // Filtrer les vélos par catégorie et taille d'abord (même logique que parking virtuel)
                let velosFiltered = velosInCategory;
                if (sizeLetter) {
                  velosFiltered = velosInCategory.filter(v => {
                    // 1) Vérifier getSizeStocksFromRow
                    const sizeStocks = getSizeStocksFromRow ? getSizeStocksFromRow(v) : null;
                    if (sizeStocks) return Object.keys(sizeStocks).includes(sizeLetter);
                    // 2) Fallback: vérifier getVariantSizeBucketsFromRow (comme parking virtuel)
                    const buckets = getVariantSizeBucketsFromRow ? getVariantSizeBucketsFromRow(v) : null;
                    if (buckets && buckets.length > 0) return buckets.includes(sizeLetter);
                    // 3) Dernier fallback: champ taille direct
                    const vSize = mapFrameSizeToLetter(v?.["Taille cadre"] ?? v?.["Taille"] ?? "");
                    return vSize === sizeLetter;
                  });
                }

                const velosForPrice = velosFiltered.filter(v => {
                  const vPrice = parseNumericValue(v?.["Prix réduit"]);
                  if (!vPrice) return false;
                  const vBand = getPriceBandForPrice(vPrice, form.category);
                  return vBand === priceBandLabel;
                });

                // Compter les unités
                if (sizeLetter && sizePct > 0) {
                  priceActual = sumUnitsForSize(velosForPrice, sizeLetter);
                } else {
                  priceActual = sumUnits(velosForPrice);
                }

                const baseTarget = sizeLetter && sizePct > 0 ? sizeTarget : categoryTarget;
                priceTarget = Math.round(baseTarget * pricePct);
                priceDiff = priceActual - priceTarget;
                priceStatus = priceTarget > 0 ? (priceDiff > 0 ? "Surstock" : priceDiff < 0 ? "Sousstock" : null) : null;
              }

              // ========== 4. Stock par Tier (CAT-MAR) (filtré par catégorie + taille + prix) ==========
              let tierActual = 0;
              let tierTarget = 0;
              let tierStatus = null;
              let tierDiff = 0;
              if (tier && tierPct > 0 && getCatMarFromRow) {
                // Filtrer les vélos par tous les critères précédents (même logique que parking virtuel)
                let velosFiltered = velosInCategory;
                if (sizeLetter) {
                  velosFiltered = velosFiltered.filter(v => {
                    // 1) Vérifier getSizeStocksFromRow
                    const sizeStocks = getSizeStocksFromRow ? getSizeStocksFromRow(v) : null;
                    if (sizeStocks) return Object.keys(sizeStocks).includes(sizeLetter);
                    // 2) Fallback: vérifier getVariantSizeBucketsFromRow (comme parking virtuel)
                    const buckets = getVariantSizeBucketsFromRow ? getVariantSizeBucketsFromRow(v) : null;
                    if (buckets && buckets.length > 0) return buckets.includes(sizeLetter);
                    // 3) Dernier fallback: champ taille direct
                    const vSize = mapFrameSizeToLetter(v?.["Taille cadre"] ?? v?.["Taille"] ?? "");
                    return vSize === sizeLetter;
                  });
                }
                if (priceBandLabel) {
                  velosFiltered = velosFiltered.filter(v => {
                    const vPrice = parseNumericValue(v?.["Prix réduit"]);
                    if (!vPrice) return false;
                    const vBand = getPriceBandForPrice(vPrice, form.category);
                    return vBand === priceBandLabel;
                  });
                }

                const velosForTier = velosFiltered.filter(v => {
                  const vTier = getCatMarFromRow(v);
                  return vTier === tier;
                });

                // Compter les unités (pas les lignes)
                if (sizeLetter && sizePct > 0) {
                  tierActual = sumUnitsForSize(velosForTier, sizeLetter);
                } else {
                  tierActual = sumUnits(velosForTier);
                }

                // Base = le plus petit objectif filtré disponible
                let baseTarget = categoryTarget;
                if (sizeLetter && sizePct > 0) baseTarget = sizeTarget;
                if (priceBandLabel && pricePct > 0) baseTarget = priceTarget;

                tierTarget = Math.round(baseTarget * tierPct);
                tierDiff = tierActual - tierTarget;
                tierStatus = tierTarget > 0 ? (tierDiff > 0 ? "Surstock" : tierDiff < 0 ? "Sousstock" : null) : null;
              }

              // ========== Résultat FINAL (le plus granulaire disponible) ==========
              // On prend le statut le plus spécifique (tier > price > size > category)
              let finalStatus = categoryStatus;
              let finalDiff = Math.abs(categoryDiff);
              let finalActual = categoryActual;
              let finalTarget = categoryTarget;
              let finalLevel = "category";

              if (sizeLetter && sizeTarget > 0) {
                finalStatus = sizeStatus;
                finalDiff = Math.abs(sizeDiff);
                finalActual = sizeActual;
                finalTarget = sizeTarget;
                finalLevel = "size";
              }
              if (priceBandLabel && priceTarget > 0) {
                finalStatus = priceStatus;
                finalDiff = Math.abs(priceDiff);
                finalActual = priceActual;
                finalTarget = priceTarget;
                finalLevel = "price";
              }
              if (tier && tierTarget > 0) {
                finalStatus = tierStatus;
                finalDiff = Math.abs(tierDiff);
                finalActual = tierActual;
                finalTarget = tierTarget;
                finalLevel = "tier";
              }

              return {
                // Niveau catégorie
                categoryActual,
                categoryTarget,
                categoryStatus,
                categoryDiff: Math.abs(categoryDiff),
                // Niveau taille
                sizeLetter,
                sizeActual,
                sizeTarget,
                sizeStatus,
                sizeDiff: Math.abs(sizeDiff),
                // Niveau prix
                priceBandLabel,
                priceActual,
                priceTarget,
                priceStatus,
                priceDiff: Math.abs(priceDiff),
                // Niveau tier
                tier,
                tierActual,
                tierTarget,
                tierStatus,
                tierDiff: Math.abs(tierDiff),
                // Résultat final (le plus granulaire)
                finalStatus,
                finalDiff,
                finalActual,
                finalTarget,
                finalLevel,
                // Pour compatibilité
                velosInCategory: categoryActual,
                targetUnits: categoryTarget,
                stockStatus: finalStatus,
                stockDifference: finalDiff,
              };
            };

            const stockInfo = getStockStatus();

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Affichage de l'état du stock MULTI-CRITÈRES */}
                {stockInfo && form.category && (
                  <div style={{ padding: 10, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 11 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>📦 État du stock - Analyse multi-critères</div>

                    {/* Tableau des critères */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                      {/* Ligne Catégorie */}
                      <div style={{ display: "grid", gridTemplateColumns: "100px 50px 50px 1fr", gap: 4, alignItems: "center", padding: 4, background: "#fff", borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: "#666" }}>Catégorie</div>
                        <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}>{stockInfo.categoryActual}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "#666" }}>{stockInfo.categoryTarget || "—"}</div>
                        {stockInfo.categoryStatus && (
                          <div style={{ fontSize: 10, fontWeight: 600, color: stockInfo.categoryStatus === "Surstock" ? "#dc2626" : "#2563eb", textAlign: "right" }}>
                            {stockInfo.categoryStatus === "Surstock" ? `+${stockInfo.categoryDiff}` : `-${stockInfo.categoryDiff}`}
                          </div>
                        )}
                      </div>

                      {/* Ligne Taille (si sélectionnée) */}
                      {stockInfo.sizeLetter && stockInfo.sizeTarget > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "100px 50px 50px 1fr", gap: 4, alignItems: "center", padding: 4, background: "#fff", borderRadius: 4 }}>
                          <div style={{ fontSize: 10, color: "#666" }}>Taille {stockInfo.sizeLetter}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}>{stockInfo.sizeActual}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "#666" }}>{stockInfo.sizeTarget}</div>
                          {stockInfo.sizeStatus && (
                            <div style={{ fontSize: 10, fontWeight: 600, color: stockInfo.sizeStatus === "Surstock" ? "#dc2626" : "#2563eb", textAlign: "right" }}>
                              {stockInfo.sizeStatus === "Surstock" ? `+${stockInfo.sizeDiff}` : `-${stockInfo.sizeDiff}`}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ligne Prix (si applicable) */}
                      {stockInfo.priceBandLabel && (
                        <div style={{ display: "grid", gridTemplateColumns: "100px 50px 50px 1fr", gap: 4, alignItems: "center", padding: 4, background: stockInfo.priceTarget > 0 ? "#fff" : "#f9fafb", borderRadius: 4 }}>
                          <div style={{ fontSize: 10, color: "#666" }}>Prix: {stockInfo.priceBandLabel}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}>{stockInfo.priceActual}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "#666" }}>{stockInfo.priceTarget || "—"}</div>
                          {stockInfo.priceStatus ? (
                            <div style={{ fontSize: 10, fontWeight: 600, color: stockInfo.priceStatus === "Surstock" ? "#dc2626" : "#2563eb", textAlign: "right" }}>
                              {stockInfo.priceStatus === "Surstock" ? `+${stockInfo.priceDiff}` : `-${stockInfo.priceDiff}`}
                            </div>
                          ) : stockInfo.priceTarget === 0 && (
                            <div style={{ fontSize: 9, color: "#999", textAlign: "right" }}>
                              (non configuré)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ligne Tier (si marque sélectionnée) */}
                      {stockInfo.tier && stockInfo.tierTarget > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "100px 50px 50px 1fr", gap: 4, alignItems: "center", padding: 4, background: "#fff", borderRadius: 4 }}>
                          <div style={{ fontSize: 10, color: "#666" }}>Tier {stockInfo.tier}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}>{stockInfo.tierActual}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "#666" }}>{stockInfo.tierTarget}</div>
                          {stockInfo.tierStatus && (
                            <div style={{ fontSize: 10, fontWeight: 600, color: stockInfo.tierStatus === "Surstock" ? "#dc2626" : "#2563eb", textAlign: "right" }}>
                              {stockInfo.tierStatus === "Surstock" ? `+${stockInfo.tierDiff}` : `-${stockInfo.tierDiff}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* En-tête des colonnes */}
                    <div style={{ display: "grid", gridTemplateColumns: "100px 50px 50px 1fr", gap: 4, marginBottom: 4, fontSize: 9, color: "#999" }}>
                      <div>Critère</div>
                      <div style={{ textAlign: "center" }}>Actuel</div>
                      <div style={{ textAlign: "center" }}>Objectif</div>
                      <div style={{ textAlign: "right" }}>Écart</div>
                    </div>

                    {/* Résultat final */}
                    {stockInfo.finalStatus && (
                      <div style={{
                        padding: 8,
                        borderRadius: 4,
                        background: stockInfo.finalStatus === "Surstock" ? "#fee2e2" : "#dbeafe",
                        color: stockInfo.finalStatus === "Surstock" ? "#dc2626" : "#2563eb",
                        fontWeight: 600,
                        textAlign: "center",
                        marginTop: 4
                      }}>
                        {stockInfo.finalStatus === "Surstock"
                          ? `⚠️ SURSTOCK +${stockInfo.finalDiff} unités (niveau: ${stockInfo.finalLevel})`
                          : `📉 Sousstock -${stockInfo.finalDiff} unités (niveau: ${stockInfo.finalLevel})`}
                      </div>
                    )}
                  </div>
                )}

                {/* ÉTAPE 1 - Marge */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "#f0fdf4",
                      border: "1px solid #86efac",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                      Étape 1 - Taux de marge
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>
                      {result.step1.marginRatePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                      → {result.step1.result.toFixed(2)}€
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAlgoDetails(showAlgoDetails === 1 ? null : 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "2px solid #059669",
                      background: showAlgoDetails === 1 ? "#059669" : "#fff",
                      color: showAlgoDetails === 1 ? "#fff" : "#059669",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    ?
                  </button>
                </div>

                {/* Détails étape 1 */}
                {showAlgoDetails === 1 && (
                  <div
                    style={{
                      marginTop: -5,
                      marginLeft: 40,
                      padding: 10,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 4,
                      fontSize: 10,
                      color: "#666",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong>Prix moyen stock :</strong> {result.step1.avgPrice.toFixed(2)}€
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Marge souhaitée :</strong> {result.step1.desiredMargin}€
                    </div>
                    <div>
                      {result.step1.desiredMargin}€ ÷ {result.step1.avgPrice.toFixed(2)}€ = {result.step1.marginRatePct.toFixed(1)}%
                    </div>
                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #e5e7eb" }}>
                      {form.estimatedPrice}€ × (1 - {result.step1.marginRatePct.toFixed(1)}%) = <span style={{ color: "#059669", fontWeight: 600 }}>{result.step1.result.toFixed(2)}€</span>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 2 - Frais de pièces */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "#fef3c7",
                      border: "1px solid #fcd34d",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                      Étape 2 - Frais de pièces ({(result.step2.partsFeeRate).toFixed(1)}%)
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#b45309" }}>
                      -{result.step2.partsFee.toFixed(2)}€
                    </div>
                    <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                      → {result.step2.result.toFixed(2)}€
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAlgoDetails(showAlgoDetails === 2 ? null : 2)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "2px solid #b45309",
                      background: showAlgoDetails === 2 ? "#b45309" : "#fff",
                      color: showAlgoDetails === 2 ? "#fff" : "#b45309",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    ?
                  </button>
                </div>

                {/* Détails étape 2 */}
                {showAlgoDetails === 2 && (
                  <div
                    style={{
                      marginTop: -5,
                      marginLeft: 40,
                      padding: 10,
                      background: "#fffbeb",
                      border: "1px solid #fcd34d",
                      borderRadius: 4,
                      fontSize: 10,
                      color: "#666",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong>Taux de frais de pièces :</strong> {result.step2.partsFeeRate.toFixed(1)}%
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Montant de frais :</strong> {result.step2.partsFee.toFixed(2)}€
                    </div>
                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #fcd34d" }}>
                      {result.step1.result.toFixed(2)}€ - {result.step2.partsFee.toFixed(2)}€ = <span style={{ color: "#b45309", fontWeight: 600 }}>{result.step2.result.toFixed(2)}€</span>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3 - Frais de transport */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      background: result.step3.skipped ? "#e0e7ff" : "#dbeafe",
                      border: result.step3.skipped ? "1px solid #a5b4fc" : "1px solid #7dd3fc",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                      Étape 3 - Frais de transport {result.step3.skipped ? "❌ (ignorés)" : ""}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: result.step3.skipped ? "#4c51bf" : "#0369a1" }}>
                      {result.step3.skipped ? "0€" : `-${result.step3.transportFee}€`}
                    </div>
                    <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                      → {result.step3.result.toFixed(2)}€
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAlgoDetails(showAlgoDetails === 3 ? null : 3)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: result.step3.skipped ? "2px solid #4c51bf" : "2px solid #0369a1",
                      background: showAlgoDetails === 3 ? (result.step3.skipped ? "#4c51bf" : "#0369a1") : "#fff",
                      color: showAlgoDetails === 3 ? "#fff" : (result.step3.skipped ? "#4c51bf" : "#0369a1"),
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    ?
                  </button>
                </div>

                {/* Détails étape 3 */}
                {showAlgoDetails === 3 && (
                  <div
                    style={{
                      marginTop: -5,
                      marginLeft: 40,
                      padding: 10,
                      background: result.step3.skipped ? "#e0e7ff" : "#cffafe",
                      border: result.step3.skipped ? "1px solid #a5b4fc" : "1px solid #7dd3fc",
                      borderRadius: 4,
                      fontSize: 10,
                      color: "#666",
                    }}
                  >
                    {result.step3.skipped ? (
                      <div>Les frais de transport sont <strong>ignorés</strong> (client livre à l'entrepôt)</div>
                    ) : (
                      <>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Frais de transport :</strong> {result.step3.transportFee}€
                        </div>
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: result.step3.skipped ? "none" : "1px solid #7dd3fc" }}>
                          {result.step2.result.toFixed(2)}€ - {result.step3.transportFee}€ = <span style={{ color: "#0369a1", fontWeight: 600 }}>{result.step3.result.toFixed(2)}€</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ÉTAPE 4 - Règles de prix */}
                {result.step4 && (
                  <>
                    {/* 4a. Catégorie+Type */}
                    {result.step4.categoryTypeMultiplier && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, padding: 12, background: "#f0f9ff", border: "1px solid #60a5fa", borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                              Étape 4a - Règle Catégorie ({form.category})
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: result.step4.categoryTypeMultiplier > 1 ? "#059669" : "#dc2626" }}>
                              {result.step4.categoryTypeMultiplier > 1 ? "+" : ""}
                              {((result.step4.categoryTypeMultiplier - 1) * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                              → {result.step4.afterCategoryType.toFixed(2)}€
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAlgoDetails(showAlgoDetails === 41 ? null : 41)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: "2px solid #3b82f6",
                              background: showAlgoDetails === 41 ? "#3b82f6" : "#fff",
                              color: showAlgoDetails === 41 ? "#fff" : "#3b82f6",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            ?
                          </button>
                        </div>
                        {showAlgoDetails === 41 && (
                          <div style={{ marginTop: -5, marginLeft: 40, padding: 10, background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 4, fontSize: 10, color: "#666" }}>
                            <div><strong>Catégorie :</strong> {form.category}</div>
                            <div><strong>Multiplicateur :</strong> ×{result.step4.categoryTypeMultiplier.toFixed(2)}</div>
                            <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #93c5fd" }}>
                              {result.step3.result.toFixed(2)}€ × {result.step4.categoryTypeMultiplier.toFixed(2)} = <span style={{ fontWeight: 600 }}>{result.step4.afterCategoryType.toFixed(2)}€</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* 4b. Price Band */}
                    {result.step4.priceBandMultiplier && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, padding: 12, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                              Étape 4b - Règle Tranche de prix
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: result.step4.priceBandMultiplier > 1 ? "#059669" : "#dc2626" }}>
                              {result.step4.priceBandMultiplier > 1 ? "+" : ""}
                              {((result.step4.priceBandMultiplier - 1) * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                              → {result.step4.afterPriceBand.toFixed(2)}€
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAlgoDetails(showAlgoDetails === 42 ? null : 42)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: "2px solid #f59e0b",
                              background: showAlgoDetails === 42 ? "#f59e0b" : "#fff",
                              color: showAlgoDetails === 42 ? "#fff" : "#f59e0b",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            ?
                          </button>
                        </div>
                        {showAlgoDetails === 42 && result.step4.priceBandCondition && (
                          <div style={{ marginTop: -5, marginLeft: 40, padding: 10, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 4, fontSize: 10, color: "#666" }}>
                            <div><strong>Condition :</strong> Prix {result.step4.priceBandCondition.operator} {result.step4.priceBandCondition.threshold}€</div>
                            <div><strong>Prix estimé :</strong> {form.estimatedPrice}€</div>
                            <div><strong>Multiplicateur :</strong> ×{result.step4.priceBandMultiplier.toFixed(2)}</div>
                            <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #fcd34d" }}>
                              {result.step4.afterCategoryType.toFixed(2)}€ × {result.step4.priceBandMultiplier.toFixed(2)} = <span style={{ fontWeight: 600 }}>{result.step4.afterPriceBand.toFixed(2)}€</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* 4c. Taille */}
                    {result.step4.sizeMultiplier && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, padding: 12, background: "#f5d5e7", border: "1px solid #ec4899", borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                              Étape 4c - Règle Taille ({form.size})
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: result.step4.sizeMultiplier > 1 ? "#059669" : "#dc2626" }}>
                              {result.step4.sizeMultiplier > 1 ? "+" : ""}
                              {((result.step4.sizeMultiplier - 1) * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                              → {result.step4.afterSize.toFixed(2)}€
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAlgoDetails(showAlgoDetails === 43 ? null : 43)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: "2px solid #ec4899",
                              background: showAlgoDetails === 43 ? "#ec4899" : "#fff",
                              color: showAlgoDetails === 43 ? "#fff" : "#ec4899",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            ?
                          </button>
                        </div>
                        {showAlgoDetails === 43 && (
                          <div style={{ marginTop: -5, marginLeft: 40, padding: 10, background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 4, fontSize: 10, color: "#666" }}>
                            <div><strong>Taille :</strong> {mapFrameSizeToLetter(form.size)}</div>
                            <div><strong>Multiplicateur :</strong> ×{result.step4.sizeMultiplier.toFixed(2)}</div>
                            <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #fbcfe8" }}>
                              {result.step4.afterPriceBand.toFixed(2)}€ × {result.step4.sizeMultiplier.toFixed(2)} = <span style={{ fontWeight: 600 }}>{result.step4.afterSize.toFixed(2)}€</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* 4d. Tier */}
                    {result.step4.tierMultiplier && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, padding: 12, background: "#d1fae5", border: "1px solid #10b981", borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                              Étape 4d - Règle Tier de marque
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: result.step4.tierMultiplier > 1 ? "#059669" : "#dc2626" }}>
                              {result.step4.tierMultiplier > 1 ? "+" : ""}
                              {((result.step4.tierMultiplier - 1) * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                              → {result.step4.afterTier.toFixed(2)}€
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAlgoDetails(showAlgoDetails === 44 ? null : 44)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: "2px solid #10b981",
                              background: showAlgoDetails === 44 ? "#10b981" : "#fff",
                              color: showAlgoDetails === 44 ? "#fff" : "#10b981",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            ?
                          </button>
                        </div>
                        {showAlgoDetails === 44 && (
                          <div style={{ marginTop: -5, marginLeft: 40, padding: 10, background: "#ecfdf5", border: "1px solid #86efac", borderRadius: 4, fontSize: 10, color: "#666" }}>
                            <div><strong>Tier de marque :</strong> {getBrandTier()}</div>
                            <div><strong>Multiplicateur :</strong> ×{result.step4.tierMultiplier.toFixed(2)}</div>
                            <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #86efac" }}>
                              {result.step4.afterSize.toFixed(2)}€ × {result.step4.tierMultiplier.toFixed(2)} = <span style={{ fontWeight: 600 }}>{result.step4.afterTier.toFixed(2)}€</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* ÉTAPE 5 - Ajustement par état du stock */}
                {result.step4?.stockMultiplier && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, padding: 12, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>
                          Étape 5 - Ajustement par État du Stock
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: result.step4.stockMultiplier > 1 ? "#059669" : "#dc2626" }}>
                          {result.step4.stockMultiplier > 1 ? "+" : ""}
                          {((result.step4.stockMultiplier - 1) * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>
                          → {result.step4.afterStock.toFixed(2)}€
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAlgoDetails(showAlgoDetails === 50 ? null : 50)}
                        style={{
                          width: 28, height: 28, borderRadius: "50%",
                          border: "2px solid #3b82f6",
                          background: showAlgoDetails === 50 ? "#3b82f6" : "#fff",
                          color: showAlgoDetails === 50 ? "#fff" : "#3b82f6",
                          fontSize: 12, fontWeight: 700, cursor: "pointer",
                          padding: 0, display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        ?
                      </button>
                    </div>
                    {showAlgoDetails === 50 && (
                      <div style={{ marginTop: -5, marginLeft: 40, padding: 10, background: "#fef9e7", border: "1px solid #fcd34d", borderRadius: 4, fontSize: 10, color: "#666" }}>
                        <div><strong>État du stock :</strong> {result.step4.stockCondition?.stockStatus}</div>
                        <div><strong>Seuil d'unités :</strong> {result.step4.stockCondition?.unitDifference}</div>
                        <div><strong>Multiplicateur :</strong> ×{result.step4.stockMultiplier.toFixed(2)}</div>
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #fcd34d" }}>
                          {result.step4.afterTier?.toFixed(2) || result.step4.afterSize?.toFixed(2) || result.step3.result.toFixed(2)}€ × {result.step4.stockMultiplier.toFixed(2)} = <span style={{ fontWeight: 600 }}>{result.step4.afterStock.toFixed(2)}€</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Résumé final */}
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#ecfdf5",
                    border: "2px solid #10b981",
                    borderRadius: 6,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>
                    Prix de reprise final (après toutes les règles)
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#059669" }}>
                    {result.finalPrice.toFixed(2)}€
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
          </>
        )}

        {/* ===== ONGLET PARAMÈTRES ===== */}
        {activeTab === "parametres" && pricingRules && (
          <PricingRulesManager
            rules={pricingRules}
            onUpdateRules={updatePricingRules}
            parkingCategories={parkingCategories}
            currentForm={form}
          />
        )}

        {/* ===== Actions ===== */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#e5e7eb",
              color: "#1f2937",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
};

export default PriceToolModal;
