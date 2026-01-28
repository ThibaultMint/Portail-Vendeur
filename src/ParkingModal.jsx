import React from "react";

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
    getSizeStocksFromRow: _getSizeStocksFromRow,
    getVariantSizeBucketsFromRow: _getVariantSizeBucketsFromRow,
  } = props;

  // Local helpers used in modal (copied/adapted)
  const getPct = (obj, key) => {
    if (!obj) return 1;
    const v = obj[key];
    if (v === undefined || v === null) return 1;
    return Number.isFinite(v) ? v : 1;
  };

  const computeSizeDistribution = (rows) => {
    const out = {};
    let totalUnits = 0;
    for (const r of rows || []) {
      const sizeStocks = (getSizeStocksFromRow || _getSizeStocksFromRow)(r);
      if (sizeStocks) {
        for (const [size, units] of Object.entries(sizeStocks)) {
          out[size] = (out[size] || 0) + units;
          totalUnits += units;
        }
        continue;
      }
      const units = Number((getRowTotalStock || getRowTotalStock)(r) || 0);
      if (!Number.isFinite(units) || units <= 0) continue;
      const buckets = (getVariantSizeBucketsFromRow || _getVariantSizeBucketsFromRow)(r);
      if (!buckets || buckets.length === 0) continue;
      const share = units / buckets.length;
      totalUnits += units;
      for (const b of buckets) out[b] = (out[b] || 0) + share;
    }
    return { out, totalUnits };
  };

  // Render
  return (
    <>
      <div className="parking-overlay" onClick={() => setParkingOpen(false)} />

      <div className="parking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="parking-header">
          <div>
            <div className="parking-title">🅿️ Parking Virtuel</div>
            <div className="parking-subtitle">
              Objectif stock : <strong>{parkingRules.objectiveTotal}</strong> unités
            </div>
          </div>

          <button className="close-btn" onClick={() => setParkingOpen(false)}>×</button>
        </div>

        <div className="parking-tabs">
          <button type="button" className={`parking-tab ${parkingTab === "vue" ? "active" : ""}`} onClick={() => setParkingTab("vue")}>Vue</button>
          <button type="button" className={`parking-tab ${parkingTab === "params" ? "active" : ""}`} onClick={() => setParkingTab("params")}>Paramètres</button>
        </div>

        {parkingTab === "vue" && (
          <div style={{ padding: 12 }}>
            {priceBandsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>⏳ Chargement des paramètres en cours...</div>
            ) : !allPriceBandsByCategory || Object.keys(allPriceBandsByCategory).length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#999" }}>⏳ Aucune tranche de prix définie. Allez dans Paramètres pour en créer.</div>
            ) : (
              <div style={{ padding: 8 }}>
                {/* For clarity, show a short recap */}
                <div style={{ marginBottom: 8 }}>
                  <strong>Catégorie active:</strong> {parkingSelection.category || parkingCategory}
                </div>
                <div style={{ color: "#555" }}>Contenu du parking rendu depuis `ParkingModal`.</div>
              </div>
            )}
          </div>
        )}

        {parkingTab === "params" && (
          <div style={{ padding: 16 }}>
            <div>Paramètres du parking (à conserver dans l'UI principale)</div>
          </div>
        )}
      </div>
    </>
  );
}
