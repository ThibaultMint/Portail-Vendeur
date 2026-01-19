# Modifications du système de pricing

## Objectif
Séparer la gestion des mises à jour :
- **Colonne `price_updated_at`** : mise à jour uniquement lors de changements de pricing (champ `best_used_url`)
- **Colonne `updated_at`** : mise à jour pour tous les autres changements

## Changements effectués

### 1. Backend - Fonctions de sauvegarde

#### `savePricingRow(row, updatePriceTimestamp = false)`
- **Bouton manuel "Enregistrer"** requis pour cette fonction
- Paramètre `updatePriceTimestamp` : si `true`, met à jour `price_updated_at`
- Toujours met à jour `updated_at` pour tracer toutes les modifications

#### `autoUpsertPricingField(mintUrl, field, value)`
- **Sauvegarde automatique** sans bouton
- Utilisée pour les champs "secondaires" : `buyer`, `mint_promo_amount`, etc.
- Ne touche PAS à `price_updated_at`
- Met à jour uniquement `updated_at`

### 2. Utilisation recommandée

#### Bouton "Enregistrer" (avec `price_updated_at`)
Utiliser pour les champs qui affectent directement le pricing :
- `best_used_url` ✅
- `best_used_price` ✅
- `new_bike_url` ✅
- `new_price` ✅
- `estimated_sale_price` ✅
- `mint_depreciation_price` ✅
- `negotiated_buy_price` ✅
- `parts_cost_actual` ✅
- `logistics_cost` ✅

#### Auto-upsert (sans `price_updated_at`)
Utiliser pour les champs "métadonnées" :
- `buyer` ✅ (acheteur)
- `seller` ✅ (vendeur)
- `mint_promo_amount` ✅ (montant promo)
- `comment` ✅ (commentaire)
- `brand_category` ✅ (catégorie de marque)

### 3. SQL - Nouvelle colonne

```sql
-- Ajouter la colonne price_updated_at à la table mode_pricing
ALTER TABLE mode_pricing
ADD COLUMN price_updated_at TIMESTAMPTZ;

-- Initialiser avec la valeur de updated_at pour les lignes existantes
UPDATE mode_pricing
SET price_updated_at = updated_at
WHERE price_updated_at IS NULL;

-- Optionnel : créer un index pour améliorer les performances de tri
CREATE INDEX idx_mode_pricing_price_updated_at ON mode_pricing(price_updated_at DESC);
```

### 4. Interface utilisateur

#### Mode actuel
- Le bouton "Enregistrer" sauvegarde TOUS les champs du formulaire pricing
- Appel : `savePricingRow(pricingRow, true)` 
  - `true` = on met à jour `price_updated_at` car on modifie des champs de pricing

#### Améliorations futures (optionnelles)
Si vous souhaitez des auto-upserts en temps réel pour certains champs :

```javascript
// Exemple pour le champ "buyer"
<select
  value={pricingRow?.buyer ?? ""}
  onChange={(e) => {
    const newValue = e.target.value;
    // Mise à jour locale immédiate
    setPricingRow(prev => ({ ...prev, buyer: newValue }));
    // Auto-upsert en arrière-plan (sans toucher price_updated_at)
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
```

## Tests recommandés

1. **Test modification pricing** :
   - Modifier `best_used_url`
   - Cliquer sur "Enregistrer"
   - Vérifier que `price_updated_at` a été mis à jour

2. **Test modification métadonnée** :
   - Modifier `buyer` (si auto-upsert activé)
   - OU modifier un autre champ et cliquer "Enregistrer"
   - Vérifier que `updated_at` a été mis à jour
   - Vérifier que `price_updated_at` N'A PAS changé (sauf si vous avez aussi modifié un champ de pricing)

3. **Test tri** :
   - Trier par "Date du dernier pricing"
   - Vérifier que l'ordre correspond à `price_updated_at`

## Notes importantes

- **La colonne `price_updated_at` doit être créée dans Supabase** avant d'utiliser ces fonctions
- Le bouton "Enregistrer" garde son comportement manuel
- Les auto-upserts sont facultatifs et peuvent être activés champ par champ selon vos besoins
