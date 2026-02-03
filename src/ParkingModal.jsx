import React, { useMemo } from "react";

export default function ParkingModal(props) {
  const {
    setParkingOpen,
    parkingTab,
    setParkingTab,
    parkingRules,
    priceBandsLoading,
    allPriceBandsByCategory,
    parkingSelection,
    setParkingSelection,
    parkingCategory,
    filteredAndSortedVelos,
    applyParkingSelection,
    buildBrandRecapByTier,
    getRowTotalStock,
    getSizeStocksFromRow,
    getVariantSizeBucketsFromRow,
    getCategoryFromRow,
    getPriceBand,
    getPriceFromRow,
    buildGapRows,
    getCatMarFromRow,
    normStr,
  } = props;

  // Derived data
  const bandsToUse = useMemo(() => {
    let categoryToUse = parkingSelection.category || parkingCategory;
    if (!categoryToUse && allPriceBandsByCategory) {
      const keys = Object.keys(allPriceBandsByCategory);
      if (keys.length) categoryToUse = keys[0];
    }
    return (categoryToUse && allPriceBandsByCategory && allPriceBandsByCategory[categoryToUse]) || [];
  }, [parkingSelection.category, parkingCategory, allPriceBandsByCategory]);

  const baseRows = filteredAndSortedVelos || [];
  const rowsForView = applyParkingSelection ? applyParkingSelection(baseRows, parkingSelection, bandsToUse) : baseRows;
  const brandRecap = buildBrandRecapByTier ? buildBrandRecapByTier(rowsForView) : { A: [], B: [], C: [], D: [] };
  const baseUnits = (baseRows || []).reduce((s, r) => s + Number(getRowTotalStock?.(r) || 0), 0);
  const filteredUnits = (rowsForView || []).reduce((s, r) => s + Number(getRowTotalStock?.(r) || 0), 0);

  const computeSizeDistribution = (rows) => {
    const out = {};
    let totalUnits = 0;
    for (const r of rows || []) {
      const sizeStocks = getSizeStocksFromRow?.(r);
      if (sizeStocks) {
        for (const [size, units] of Object.entries(sizeStocks)) {
          out[size] = (out[size] || 0) + units;
          totalUnits += units;
        }
        continue;
      }
      const units = Number(getRowTotalStock?.(r) || 0);
      if (!Number.isFinite(units) || units <= 0) continue;
      const buckets = getVariantSizeBucketsFromRow?.(r) || [];
      if (!buckets || buckets.length === 0) continue;
      const share = units / buckets.length;
      totalUnits += units;
      for (const b of buckets) out[b] = (out[b] || 0) + share;
    }
    return { out, totalUnits };
  };

  const distCategory = useMemo(() => computeDistribution(baseRows, getCategoryFromRow), [baseRows, getCategoryFromRow]);

  function computeDistribution(rows, getKeyFn) {
    const out = {};
    let totalUnits = 0;
    for (const r of rows || []) {
      const units = Number(getRowTotalStock?.(r) || 0);
      if (!Number.isFinite(units) || units <= 0) continue;
      const key = String(getKeyFn?.(r) || "").trim();
      if (!key) continue;
      out[key] = (out[key] || 0) + units;
      totalUnits += units;
    }
    return { out, totalUnits };
  }

  const rowsForSizes = parkingSelection.category
    ? baseRows.filter((r) => getCategoryFromRow?.(r) === parkingSelection.category)
    : baseRows;
  const distSize = computeSizeDistribution(rowsForSizes);

  const rowsForPrices = parkingSelection.size
    ? rowsForSizes.filter((r) => {
        const sizeStocks = getSizeStocksFromRow?.(r);
        if (sizeStocks) return Object.keys(sizeStocks).includes(parkingSelection.size);
        const buckets = getVariantSizeBucketsFromRow?.(r);
        return buckets && buckets.includes(parkingSelection.size);
      })
    : rowsForSizes;

  const computeDistributionForSize = (rows, getKeyFn, selectedSize) => {
    const out = {};
    let totalUnits = 0;
    for (const r of rows || []) {
      let units = 0;
      if (selectedSize) {
        const sizeStocks = getSizeStocksFromRow?.(r);
        if (sizeStocks && sizeStocks[selectedSize]) {
          units = Number(sizeStocks[selectedSize] || 0);
        } else {
          const totalStock = Number(getRowTotalStock?.(r) || 0);
          const buckets = getVariantSizeBucketsFromRow?.(r);
          if (buckets && buckets.includes(selectedSize)) units = totalStock / buckets.length;
        }
      } else {
        units = Number(getRowTotalStock?.(r) || 0);
      }
      if (!Number.isFinite(units) || units <= 0) continue;
      const key = String(getKeyFn?.(r) || "").trim();
      if (!key) continue;
      totalUnits += units;
      out[key] = (out[key] || 0) + units;
    }
    return { out, totalUnits };
  };

  const distPrice = computeDistributionForSize(rowsForPrices, (r) => getPriceBand?.(getPriceFromRow?.(r), bandsToUse), parkingSelection.size);

  // Ensure bands appear even if 0
  if (bandsToUse && bandsToUse.length > 0) {
    bandsToUse.forEach((band) => {
      if (!distPrice.out[band.label]) distPrice.out[band.label] = 0;
    });
  }

  const objectiveTotal = Number(parkingRules?.objectiveTotal || 0);
  const getPct = (obj, key) => {
    if (!obj) return 1;
    const v = obj[key];
    if (v === undefined || v === null) return 1;
    return Number.isFinite(v) ? v : 1;
  };
  const multCategory = parkingSelection.category ? getPct(parkingRules?.categoryPct, parkingSelection.category) : 1;
  const multSize = parkingSelection.size ? getPct(parkingRules?.sizePct, parkingSelection.size) : 1;
  const multPrice = parkingSelection.priceBand ? getPct(parkingRules?.pricePct, parkingSelection.priceBand) : 1;

  const objTotalForCategory = objectiveTotal;
  const objTotalForSize = objectiveTotal * multCategory;
  const objTotalForPrice = objectiveTotal * multCategory * multSize;

  const catRows = buildGapRows ? buildGapRows(distCategory.out, distCategory.totalUnits, parkingRules?.categoryPct, objTotalForCategory) : [];
  const sizeRows = buildGapRows ? buildGapRows(distSize.out, distSize.totalUnits, parkingRules?.sizePct, objTotalForSize) : [];
  const priceRows = buildGapRows ? buildGapRows(distPrice.out, distPrice.totalUnits, parkingRules?.pricePct, objTotalForPrice) : [];

  // Calcul des vélos filtrés progressivement, groupés par tier A/B/C/D
  const velosByTier = useMemo(() => {
    const tiers = ["A", "B", "C", "D"];
    const result = { A: [], B: [], C: [], D: [] };
    const normStrLocal = (s) => String(s ?? "").toLowerCase().trim();

    // On ne montre les vélos que si au moins la catégorie est sélectionnée
    if (!parkingSelection.category) return result;

    let filtered = baseRows.filter((r) => normStrLocal(getCategoryFromRow?.(r)) === normStrLocal(parkingSelection.category));

    // Filtre par taille si sélectionnée
    if (parkingSelection.size) {
      const sizeLetter = String(parkingSelection.size).trim().toUpperCase();
      filtered = filtered.filter((r) => {
        const sizeStocks = getSizeStocksFromRow?.(r);
        if (sizeStocks) return Object.keys(sizeStocks).map(s => s.toUpperCase()).includes(sizeLetter);
        const buckets = (getVariantSizeBucketsFromRow?.(r) || []).map((x) => String(x).trim().toUpperCase());
        return buckets.includes(sizeLetter);
      });
    }

    // Filtre par tranche de prix si sélectionnée
    if (parkingSelection.priceBand) {
      filtered = filtered.filter((r) => {
        const b = getPriceBand?.(getPriceFromRow?.(r), bandsToUse);
        return normStrLocal(b) === normStrLocal(parkingSelection.priceBand);
      });
    }

    // Grouper par tier (A/B/C/D)
    for (const row of filtered) {
      const tier = String(getCatMarFromRow?.(row) || "").trim().toUpperCase();
      if (tiers.includes(tier)) {
        result[tier].push(row);
      }
    }

    return result;
  }, [baseRows, parkingSelection, getCategoryFromRow, getSizeStocksFromRow, getVariantSizeBucketsFromRow, getPriceBand, getPriceFromRow, bandsToUse, getCatMarFromRow]);

  // Fonction pour formater l'affichage d'un vélo
  const formatVeloDisplay = (row) => {
    const marque = row?.["Marque"] ?? "";
    const modele = row?.["Modèle"] ?? "";
    const annee = row?.["Année"] ?? "";
    const taille = row?.["Taille du cadre"] ?? "";
    const prix = getPriceFromRow?.(row);
    const prixStr = Number.isFinite(prix) ? `${Math.round(prix)}€` : "";
    return { marque, modele, annee, taille, prix: prixStr };
  };

  if (!props) return null;

  return (
    <>
      <div className="parking-overlay" onClick={() => setParkingOpen(false)} />

      <div className="parking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="parking-header">
          <div>
            <div className="parking-title">🅿️ Parking Virtuel</div>
            <div className="parking-subtitle">Objectif stock : <strong>{parkingRules?.objectiveTotal}</strong> unités</div>
          </div>
          <button className="close-btn" onClick={() => setParkingOpen(false)}>×</button>
        </div>

        <div className="parking-tabs">
          <button type="button" className={`parking-tab ${parkingTab === "vue" ? "active" : ""}`} onClick={() => setParkingTab("vue")}>Vue</button>
          <button type="button" className={`parking-tab ${parkingTab === "params" ? "active" : ""}`} onClick={() => setParkingTab("params")}>Paramètres</button>
        </div>

        {parkingTab === "vue" && (
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>Récapitulatif</div>
              <div style={{ color: "#666", fontSize: 13 }}>Base: {baseUnits} unités · Filtré: {filteredUnits} unités</div>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
              {Object.keys(brandRecap).map((t) => (
                <div key={t} style={{ flex: 1, minWidth: 150, background: "#fff", padding: 8, borderRadius: 10, boxShadow: "0 4px 10px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "#333" }}>{(brandRecap[t] || []).slice(0,6).join(", ")}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Étape 1 : Catégories
                  {parkingSelection.category && (
                    <button
                      onClick={() => setParkingSelection({ category: null, size: null, priceBand: null })}
                      style={{ marginLeft: 8, fontSize: 11, padding: "2px 6px", cursor: "pointer", background: "#eee", border: "none", borderRadius: 4 }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                {catRows.map((r) => {
                  const isSelected = parkingSelection.category === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => setParkingSelection({ category: r.key, size: null, priceBand: null })}
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        background: isSelected ? "#e0f2fe" : "transparent",
                        borderLeft: isSelected ? "3px solid #0284c7" : "3px solid transparent",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{r.key}</div>
                      <div style={{ color: "#555" }}>Actuel: {r.actualUnits} — Cible: {r.targetUnits}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ opacity: parkingSelection.category ? 1 : 0.4 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Étape 2 : Tailles
                  {parkingSelection.size && (
                    <button
                      onClick={() => setParkingSelection(prev => ({ ...prev, size: null, priceBand: null }))}
                      style={{ marginLeft: 8, fontSize: 11, padding: "2px 6px", cursor: "pointer", background: "#eee", border: "none", borderRadius: 4 }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                {sizeRows.map((r) => {
                  const isSelected = parkingSelection.size === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => parkingSelection.category && setParkingSelection(prev => ({ ...prev, size: r.key, priceBand: null }))}
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        cursor: parkingSelection.category ? "pointer" : "not-allowed",
                        background: isSelected ? "#dcfce7" : "transparent",
                        borderLeft: isSelected ? "3px solid #16a34a" : "3px solid transparent",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{r.key}</div>
                      <div style={{ color: "#555" }}>Actuel: {r.actualUnits} — Cible: {r.targetUnits}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ opacity: parkingSelection.size ? 1 : 0.4 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Étape 3 : Tranches Prix
                  {parkingSelection.priceBand && (
                    <button
                      onClick={() => setParkingSelection(prev => ({ ...prev, priceBand: null }))}
                      style={{ marginLeft: 8, fontSize: 11, padding: "2px 6px", cursor: "pointer", background: "#eee", border: "none", borderRadius: 4 }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                {priceRows.map((r) => {
                  const isSelected = parkingSelection.priceBand === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => parkingSelection.size && setParkingSelection(prev => ({ ...prev, priceBand: r.key }))}
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        cursor: parkingSelection.size ? "pointer" : "not-allowed",
                        background: isSelected ? "#fef3c7" : "transparent",
                        borderLeft: isSelected ? "3px solid #d97706" : "3px solid transparent",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{r.key}</div>
                      <div style={{ color: "#555" }}>Actuel: {r.actualUnits} — Cible: {r.targetUnits}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section vélos par colonnes A/B/C/D */}
            {parkingSelection.category && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>
                  Vélos filtrés par Tier
                  <span style={{ fontWeight: 400, color: "#666", marginLeft: 8, fontSize: 13 }}>
                    ({velosByTier.A.length + velosByTier.B.length + velosByTier.C.length + velosByTier.D.length} vélos)
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  {["A", "B", "C", "D"].map((tier) => (
                    <div key={tier} style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: 10,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      maxHeight: 300,
                      overflowY: "auto"
                    }}>
                      <div style={{
                        fontWeight: 800,
                        marginBottom: 8,
                        fontSize: 14,
                        color: tier === "A" ? "#16a34a" : tier === "B" ? "#2563eb" : tier === "C" ? "#d97706" : "#dc2626",
                        borderBottom: "2px solid",
                        borderColor: tier === "A" ? "#16a34a" : tier === "B" ? "#2563eb" : tier === "C" ? "#d97706" : "#dc2626",
                        paddingBottom: 6
                      }}>
                        Tier {tier} ({velosByTier[tier].length})
                      </div>
                      {velosByTier[tier].length === 0 ? (
                        <div style={{ color: "#999", fontSize: 12, fontStyle: "italic" }}>Aucun vélo</div>
                      ) : (
                        velosByTier[tier].map((row, idx) => {
                          const velo = formatVeloDisplay(row);
                          return (
                            <div key={idx} style={{
                              padding: "6px 0",
                              borderBottom: idx < velosByTier[tier].length - 1 ? "1px solid #eee" : "none",
                              fontSize: 12
                            }}>
                              <div style={{ fontWeight: 600, color: "#333" }}>{velo.marque} {velo.modele}</div>
                              <div style={{ color: "#666", fontSize: 11 }}>
                                {[velo.annee, velo.taille, velo.prix].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {parkingTab === "params" && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}><strong>Prix / Tranches</strong></div>
            <div style={{ color: "#444" }}>Interface d'administration des tranches de prix (à compléter).</div>
          </div>
        )}
      </div>
    </>
  );
}
