/**
 * EXEMPLE D'UTILISATION DES AUTO-UPSERTS
 * 
 * Ce fichier montre comment activer les sauvegardes automatiques
 * pour les champs "métadonnées" (buyer, promo, etc.) tout en
 * gardant le bouton "Enregistrer" manuel pour les champs pricing.
 */

// =====================================================
// 1. CHAMPS AVEC AUTO-UPSERT (pas de bouton)
// =====================================================

// Exemple 1 : Select "Acheteur"
<select
  value={pricingRow?.buyer ?? ""}
  onChange={(e) => {
    const newValue = e.target.value;
    
    // ✅ Mise à jour locale immédiate (pour l'UI)
    setPricingRow(prev => ({ ...prev, buyer: newValue }));
    
    // ✅ Auto-upsert en arrière-plan
    autoUpsertPricingField(selectedVelo.URL, 'buyer', newValue);
  }}
  style={inputStyle}
>
  {BUYERS.map((name) => (
    <option key={name || "__empty__"} value={name}>
      {name ? name : "— Choisir —"}
    </option>
  ))}
</select>

// Exemple 2 : Input "Montant promo"
<input
  type="number"
  value={pricingRow?.mint_promo_amount ?? ""}
  onBlur={(e) => {
    // ✅ Auto-upsert quand on quitte le champ (onBlur)
    const newValue = parseNumericValue(e.target.value);
    autoUpsertPricingField(selectedVelo.URL, 'mint_promo_amount', newValue);
  }}
  onChange={(e) => {
    // ✅ Mise à jour locale pour l'affichage
    setPricingRow(prev => ({
      ...prev,
      mint_promo_amount: parseNumericValue(e.target.value)
    }));
  }}
  style={inputStyle}
/>

// Exemple 3 : Textarea "Commentaire"
<textarea
  value={pricingRow?.comment ?? ""}
  onBlur={(e) => {
    // ✅ Auto-upsert au blur
    autoUpsertPricingField(selectedVelo.URL, 'comment', e.target.value);
  }}
  onChange={(e) => {
    // ✅ Mise à jour locale
    setPricingRow(prev => ({
      ...prev,
      comment: e.target.value
    }));
  }}
  style={inputStyle}
  rows={3}
  placeholder="Notes internes sur ce vélo…"
/>

// =====================================================
// 2. CHAMPS AVEC BOUTON "ENREGISTRER" (manuel)
// =====================================================

// Exemple : Input "Meilleur prix occasion"
// ❌ PAS d'auto-upsert ici car ça affecte le pricing
<input
  type="number"
  value={pricingRow?.best_used_price ?? ""}
  onChange={(e) => {
    // ✅ Juste la mise à jour locale
    setPricingRow(prev => ({
      ...prev,
      best_used_price: parseNumericValue(e.target.value)
    }));
  }}
  style={inputStyle}
/>

// Le bouton "Enregistrer" en bas sauvegarde tout :
<button
  type="button"
  className="save-btn"
  onClick={() => savePricingRow(pricingRow, true)}
  // ✅ true = mettre à jour price_updated_at
  disabled={pricingSaving || pricingLoading || !pricingRow?.mint_url}
>
  {pricingSaving ? "Enregistrement..." : "Enregistrer"}
</button>

// =====================================================
// 3. DÉCISION : QUAND UTILISER QUOI ?
// =====================================================

/**
 * AUTO-UPSERT (pas de bouton) :
 * ✅ buyer (acheteur)
 * ✅ seller (vendeur) 
 * ✅ mint_promo_amount (promo)
 * ✅ comment (commentaire)
 * ✅ brand_category (catégorie marque)
 * 
 * Raison : ce sont des métadonnées qui ne changent pas
 * la logique de pricing. On peut les sauvegarder au fil
 * de l'eau sans impacter la date de pricing.
 */

/**
 * BOUTON "ENREGISTRER" (manuel) :
 * ✅ best_used_url
 * ✅ best_used_price
 * ✅ new_bike_url
 * ✅ new_price
 * ✅ estimated_sale_price
 * ✅ mint_depreciation_price
 * ✅ negotiated_buy_price
 * ✅ parts_cost_actual
 * ✅ logistics_cost
 * ✅ marketing_cost
 * 
 * Raison : ces champs affectent directement le pricing.
 * On veut garder un contrôle manuel et mettre à jour
 * price_updated_at uniquement quand on valide.
 */

// =====================================================
// 4. INDICATEUR VISUEL (optionnel)
// =====================================================

// Ajouter un petit badge "Auto-save" pour les champs auto-upsert
<div style={{ position: 'relative' }}>
  <input
    type="number"
    value={pricingRow?.mint_promo_amount ?? ""}
    onBlur={(e) => {
      const newValue = parseNumericValue(e.target.value);
      autoUpsertPricingField(selectedVelo.URL, 'mint_promo_amount', newValue);
    }}
    onChange={(e) => {
      setPricingRow(prev => ({
        ...prev,
        mint_promo_amount: parseNumericValue(e.target.value)
      }));
    }}
    style={inputStyle}
  />
  
  {/* Badge "Auto-save" */}
  <div style={{
    position: 'absolute',
    top: -8,
    right: -8,
    padding: '2px 6px',
    borderRadius: 999,
    background: '#10b981',
    color: '#fff',
    fontSize: 9,
    fontWeight: 800,
    pointerEvents: 'none'
  }}>
    AUTO
  </div>
</div>
