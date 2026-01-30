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

  // computeCatMarDistribution_STRICT inline (simplified reuse)
  function computeCatMarDistribution_STRICT(rows, sel, bands, getCatMarFromRow, tierPctMap) {
    const normStrLocal = (s) => String(s ?? "").toLowerCase().trim();
    const tiers = ["A", "B", "C", "D"];
    let filtered = rows || [];
    if (sel.category) filtered = filtered.filter((r) => normStrLocal(getCategoryFromRow?.(r)) === normStrLocal(sel.category));
    const sizeLetter = sel.size ? String(sel.size).trim().toUpperCase() : null;
    if (sizeLetter) filtered = filtered.filter((r) => {
      const buckets = (getVariantSizeBucketsFromRow?.(r) || []).map((x) => String(x).trim().toUpperCase());
      return buckets.includes(sizeLetter);
    });
    if (sel.priceBand) filtered = filtered.filter((r) => {
      const b = getPriceBand?.(getPriceFromRow?.(r), bands);
      return normStrLocal(b) === normStrLocal(sel.priceBand);
    });

    const categoryPct = parkingRules?.categoryPct?.[sel.category] || 0;
    const sizePct = sizeLetter ? (parkingRules?.sizePct?.[sizeLetter] || 0) : 0;
    const bandObj = (bands || []).find((b) => normStrLocal(b.label) === normStrLocal(sel.priceBand));
    const pricePct = bandObj?.share_pct > 1 ? bandObj.share_pct / 100 : (bandObj?.share_pct || 0);
    const objectiveTotalLocal = Number(parkingRules?.objectiveTotal || 0);
    const categoryTarget = Math.round(objectiveTotalLocal * categoryPct);
    const sizeTarget = sizeLetter && sizePct > 0 && categoryTarget > 0 ? Math.round(categoryTarget * sizePct) : categoryTarget;
    const priceTarget = sel.priceBand && pricePct > 0 && sizeTarget > 0 ? Math.round(sizeTarget * pricePct) : sizeTarget;

    const sumUnits = (arr) => arr.reduce((s, r) => s + (getRowTotalStock?.(r) || 0), 0);
    const sumUnitsForSize = (arr, targetSize) => {
      let total = 0;
      for (const r of arr) {
        const sizeStocks = getSizeStocksFromRow?.(r);
        if (sizeStocks && sizeStocks[targetSize]) { total += Number(sizeStocks[targetSize] || 0); continue; }
        const totalStock = Number(getRowTotalStock?.(r) || 0);
        const buckets = getVariantSizeBucketsFromRow?.(r) || [];
        if (buckets && buckets.length > 0 && buckets.includes(targetSize)) total += totalStock / buckets.length;
      }
      return Math.round(total);
    };

    return tiers.map((tier) => {
      let velosFiltered = filtered.filter((r) => String(getCatMarFromRow?.(r) || "").trim().toUpperCase() === tier);
      let actualUnits = 0;
      if (sizeLetter && sizePct > 0) actualUnits = sumUnitsForSize(velosFiltered, sizeLetter);
      else actualUnits = sumUnits(velosFiltered);
      const tierPct = tierPctMap?.[tier] || 0;
      let baseTarget = categoryTarget;
      if (sizeLetter && sizePct > 0) baseTarget = sizeTarget;
      if (sel.priceBand && pricePct > 0) baseTarget = priceTarget;
      const targetUnits = Math.round(baseTarget * tierPct);
      const gapUnits = actualUnits - targetUnits;
      return { key: tier, actualUnits, targetUnits, gapUnits, targetPct: tierPct, actualPct: baseTarget > 0 ? actualUnits / baseTarget : 0 };
    });
  }

  const catMarRows = computeCatMarDistribution_STRICT(priceRows, parkingSelection, allPriceBandsByCategory?.[parkingSelection.category] || [], getCatMarFromRow, parkingRules?.tierPct || {});

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
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Catégories</div>
                {catRows.map((r) => (
                  <div key={r.key} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ fontWeight: 700 }}>{r.key}</div>
                    <div style={{ color: "#555" }}>Actuel: {r.actualUnits} — Cible: {r.targetUnits}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Tailles</div>
                {sizeRows.map((r) => (
                  <div key={r.key} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ fontWeight: 700 }}>{r.key}</div>
                    <div style={{ color: "#555" }}>Actuel: {r.actualUnits} — Cible: {r.targetUnits}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Tranches Prix</div>
                {priceRows.map((r) => (
                  <div key={r.key} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ fontWeight: 700 }}>{r.key}</div>
                    <div style={{ color: "#555" }}>Actuel: {r.actualUnits} — Cible: {r.targetUnits}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Tiers (A/B/C/D)</div>
              <div style={{ display: "flex", gap: 8 }}>
                {catMarRows.map((r) => (
                  <div key={r.key} style={{ padding: 10, background: "#fff", borderRadius: 8, flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{r.key}</div>
                    <div style={{ color: "#444" }}>Actuel: {r.actualUnits}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>Cible: {r.targetUnits}</div>
                  </div>
                ))}
              </div>
            </div>
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
