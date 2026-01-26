import React, { useState, useMemo } from "react";

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
}) => {
  const sizeOptions = ["XS", "S", "M", "L", "XL"];

  // Filtrer les marques pour l'autocomplete
  const [brandInput, setBrandInput] = useState(form.brand);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  const filteredBrands = useMemo(() => {
    if (!brandInput) return allBrands.slice(0, 10);
    const lower = brandInput.toLowerCase();
    return allBrands.filter(b => b.toLowerCase().includes(lower));
  }, [brandInput, allBrands]);

  if (!isOpen) return null;

  const handleBrandSelect = (brand) => {
    onFormChange({ ...form, brand });
    setBrandInput(brand);
    setShowBrandSuggestions(false);
  };

  const handleInputChange = (field, value) => {
    onFormChange({ ...form, [field]: value });
    if (field === "brand") {
      setBrandInput(value);
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
              <input
                type="number"
                value={form.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                min="1990"
                max={new Date().getFullYear()}
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
          </div>

          {/* Ligne 2: Taille et Catégorie */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Taille */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
                Taille
              </label>
              <select
                value={form.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
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
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
                <option value="Cadre">Taille Cadre</option>
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
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
                {parkingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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

          {/* Placeholder pour l'algo - à compléter */}
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
            ℹ️ L'algorithme de calcul du prix de reprise sera affiché ici une fois le prix de vente estimé saisi.
          </div>
        </div>

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
