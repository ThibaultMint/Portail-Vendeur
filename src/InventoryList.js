import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./InventoryList.css";

const InventoryList = ({ isOpen, onClose, onCountChange }) => {
  const [inventory, setInventory] = useState([]);
  const [publishedSerials, setPublishedSerials] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showPublished, setShowPublished] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(null);
  const [editingSerial, setEditingSerial] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filters, setFilters] = useState({
    marque: "",
    type_velo: "",
    is_vae: "all",
    annee_min: "",
    annee_max: "",
  });

  useEffect(() => {
    // Charger les données au montage pour avoir le compteur dès le début
    const loadData = async () => {
      const serialsSet = await fetchPublishedSerials();
      await fetchInventory(serialsSet);
    };
    loadData();
  }, []);

  const fetchPublishedSerials = async () => {
    try {
      const { data, error } = await supabase
        .from("velosmint")
        .select("*");

      if (error) throw error;
      
      // Créer un Set de tous les serial_number publiés
      const serialsSet = new Set();
      (data || []).forEach(row => {
        // Parcourir toutes les colonnes "Numéros de série variant N"
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase();
          
          if ((lowerKey.includes("numéro") || lowerKey.includes("numero")) && 
              (lowerKey.includes("série") || lowerKey.includes("serie")) && 
              lowerKey.includes("variant")) {
            const value = row[key];
            if (value) {
              // Séparer par | et nettoyer chaque numéro
              const serials = String(value).split("|").map(s => s.trim()).filter(Boolean);
              serials.forEach(serial => {
                if (serial) serialsSet.add(serial);
              });
            }
          }
        });
      });
      
      setPublishedSerials(serialsSet);
      return serialsSet; // Retourner le Set pour l'utiliser immédiatement
    } catch (error) {
      console.error("Erreur chargement serial_number publiés:", error);
      setPublishedSerials(new Set());
      return new Set();
    }
  };

  const fetchInventory = async (publishedSerialsSet) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("serial_number, marque, modele, taille, annee_affichee, type_velo, is_vae, vae_kilometrage, prix_achat_negocie, date_achat, prix_occasion_marche, status")
        .order("date_achat", { ascending: false });

      if (error) throw error;
      
      // Identifier les vélos publiés et mettre à jour leur statut dans la DB
      const serialsToUpdate = [];
      (data || []).forEach(item => {
        const serial = item.serial_number ? String(item.serial_number).trim() : null;
        if (serial && item.status !== 'publie') {
          // Vérifier si le numéro de série existe tel quel OU avec "MPE" devant
          const serialWithMPE = `MPE${serial}`;
          if (publishedSerialsSet.has(serial) || publishedSerialsSet.has(serialWithMPE)) {
            serialsToUpdate.push(serial);
          }
        }
      });
      
      // Mise à jour batch dans la DB
      if (serialsToUpdate.length > 0) {
        console.log(`Mise à jour de ${serialsToUpdate.length} vélos en statut "publié"...`);
        for (const serial of serialsToUpdate) {
          await supabase
            .from("inventory")
            .update({ status: 'publie' })
            .eq("serial_number", serial);
        }
      }
      
      // Mettre à jour le statut localement
      const updatedData = (data || []).map(item => {
        const serial = item.serial_number ? String(item.serial_number).trim() : null;
        if (serial) {
          // Vérifier si le numéro de série existe tel quel OU avec "MPE" devant
          const serialWithMPE = `MPE${serial}`;
          if (publishedSerialsSet.has(serial) || publishedSerialsSet.has(serialWithMPE)) {
            return { ...item, status: 'publie' };
          }
        }
        return item;
      });
      
      setInventory(updatedData);
    } catch (error) {
      console.error("Erreur chargement inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (serialNumber, newStatus) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .update({ status: newStatus })
        .eq("serial_number", serialNumber);

      if (error) throw error;

      // Mettre à jour l'état local
      setInventory(prev =>
        prev.map(item =>
          item.serial_number === serialNumber
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const startEditing = (item) => {
    setEditingSerial(item.serial_number);
    setEditingData({ ...item });
  };

  const saveEdit = async () => {
    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          marque: editingData.marque,
          modele: editingData.modele,
          taille: editingData.taille,
          annee_affichee: editingData.annee_affichee,
          type_velo: editingData.type_velo,
          is_vae: editingData.is_vae,
          vae_kilometrage: editingData.vae_kilometrage,
          prix_achat_negocie: editingData.prix_achat_negocie,
          date_achat: editingData.date_achat,
          prix_occasion_marche: editingData.prix_occasion_marche,
        })
        .eq("serial_number", editingSerial);

      if (error) throw error;

      // Mettre à jour l'état local
      setInventory(prev =>
        prev.map(item =>
          item.serial_number === editingSerial
            ? { ...item, ...editingData }
            : item
        )
      );
      
      setEditingSerial(null);
      setEditingData({});
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const cancelEdit = () => {
    setEditingSerial(null);
    setEditingData({});
  };

  const filteredInventory = inventory.filter((item) => {
    // FILTRAGE PRINCIPAL: Exclure les vélos publiés (sauf si showPublished est activé)
    if (!showPublished && item.status === 'publie') {
      return false;
    }
    
    if (filters.marque) {
      const searchTerm = filters.marque.toLowerCase();
      const matchMarque = item.marque?.toLowerCase().includes(searchTerm);
      const matchModele = item.modele?.toLowerCase().includes(searchTerm);
      const matchSerial = item.serial_number?.toLowerCase().includes(searchTerm);
      if (!matchMarque && !matchModele && !matchSerial) {
        return false;
      }
    }
    if (filters.type_velo && !item.type_velo?.toLowerCase().includes(filters.type_velo.toLowerCase())) {
      return false;
    }
    if (filters.is_vae !== "all") {
      const isVae = filters.is_vae === "true";
      if (item.is_vae !== isVae) return false;
    }
    if (filters.annee_min && item.annee_affichee && item.annee_affichee < parseInt(filters.annee_min)) {
      return false;
    }
    if (filters.annee_max && item.annee_affichee && item.annee_affichee > parseInt(filters.annee_max)) {
      return false;
    }
    return true;
  });

  // Compteur fixe pour le bouton : uniquement les vélos non publiés
  const upcomingBikesCount = inventory.filter(item => item.status !== 'publie').length;

  useEffect(() => {
    if (onCountChange) {
      onCountChange(upcomingBikesCount);
    }
  }, [upcomingBikesCount, onCountChange]);

  if (!isOpen) return null;

  return (
    <div className="inventory-modal-overlay" onClick={onClose}>
      <div className="inventory-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-modal-header">
          <h2>📦 Vélos à venir dans le stock</h2>
          <button className="inventory-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Filtres */}
        <div className="inventory-filters">
          <input
            type="text"
            placeholder="Marque, modèle ou n° série..."
            value={filters.marque}
            onChange={(e) => setFilters({ ...filters, marque: e.target.value })}
          />
          
          <select
            value={filters.type_velo}
            onChange={(e) => setFilters({ ...filters, type_velo: e.target.value })}
          >
            <option value="">Tous les types</option>
            <option value="VTT">VTT</option>
            <option value="VTC">VTC</option>
            <option value="Ville">Ville</option>
            <option value="Route">Route</option>
            <option value="Gravel">Gravel</option>
            <option value="Pliant">Pliant</option>
            <option value="Cargo">Cargo</option>
          </select>
          
          <select
            value={filters.is_vae}
            onChange={(e) => setFilters({ ...filters, is_vae: e.target.value })}
          >
            <option value="all">Tous (VAE/Musculaire)</option>
            <option value="true">VAE uniquement</option>
            <option value="false">Musculaire uniquement</option>
          </select>

          <input
            type="number"
            placeholder="Année min"
            value={filters.annee_min}
            onChange={(e) => setFilters({ ...filters, annee_min: e.target.value })}
            style={{ width: 100 }}
          />

          <input
            type="number"
            placeholder="Année max"
            value={filters.annee_max}
            onChange={(e) => setFilters({ ...filters, annee_max: e.target.value })}
            style={{ width: 100 }}
          />

          <button
            onClick={() => setFilters({ marque: "", type_velo: "", is_vae: "all", annee_min: "", annee_max: "" })}
            style={{ padding: "8px 12px", cursor: "pointer" }}
          >
            Réinitialiser
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: 10 }}>
            <input
              type="checkbox"
              checked={showPublished}
              onChange={(e) => setShowPublished(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontSize: 13 }}>Afficher les publiés</span>
          </label>
        </div>

        {/* Statistiques */}
        <div className="inventory-stats">
          <span>Total: <strong>{filteredInventory.length}</strong> vélos</span>
          <span>VAE: <strong>{filteredInventory.filter(v => v.is_vae).length}</strong></span>
          <span>Musculaire: <strong>{filteredInventory.filter(v => !v.is_vae).length}</strong></span>
          <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 12 }}>
            ({inventory.length - filteredInventory.length} déjà publiés masqués)
          </span>
        </div>

        {/* Table */}
        <div className="inventory-table-wrapper">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Chargement...</div>
          ) : filteredInventory.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>Aucun vélo trouvé</div>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>N° Série</th>
                  <th>Marque</th>
                  <th>Modèle</th>
                  <th>Taille</th>
                  <th>Année</th>
                  <th>Type</th>
                  <th>VAE</th>
                  <th>Km</th>
                  <th>Prix Achat</th>
                  <th>Date Achat</th>
                  <th>Prix Occasion</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, idx) => {
                  const isEditing = editingSerial === item.serial_number;
                  const isHovered = hoveredRow === idx;
                  
                  return (
                    <tr 
                      key={idx}
                      onMouseEnter={() => setHoveredRow(idx)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ position: 'relative' }}
                    >
                      <td 
                        className="serial-number"
                        onClick={() => {
                          if (item.serial_number && !isEditing) {
                            navigator.clipboard.writeText(item.serial_number);
                            setCopiedSerial(item.serial_number);
                            setTimeout(() => setCopiedSerial(null), 800);
                          }
                        }}
                        style={{ cursor: item.serial_number && !isEditing ? 'pointer' : 'default' }}
                        title={!isEditing ? "Cliquer pour copier" : ""}
                      >
                        {copiedSerial === item.serial_number ? '✓ Copié !' : (item.serial_number || "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.marque || ""}
                            onChange={(e) => setEditingData({ ...editingData, marque: e.target.value })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.marque || "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.modele || ""}
                            onChange={(e) => setEditingData({ ...editingData, modele: e.target.value })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.modele || "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.taille || ""}
                            onChange={(e) => setEditingData({ ...editingData, taille: e.target.value })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.taille || "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.annee_affichee || ""}
                            onChange={(e) => setEditingData({ ...editingData, annee_affichee: parseInt(e.target.value) || null })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.annee_affichee || "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingData.type_velo || ""}
                            onChange={(e) => setEditingData({ ...editingData, type_velo: e.target.value })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          >
                            <option value="">-</option>
                            <option value="VTT">VTT</option>
                            <option value="VTC">VTC</option>
                            <option value="Vélo de ville">Vélo de ville</option>
                            <option value="Vélo De Route">Vélo De Route</option>
                            <option value="Gravel">Gravel</option>
                            <option value="Cargo">Cargo</option>
                          </select>
                        ) : (item.type_velo || "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingData.is_vae ? "true" : "false"}
                            onChange={(e) => setEditingData({ ...editingData, is_vae: e.target.value === "true" })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          >
                            <option value="true">⚡ Oui</option>
                            <option value="false">Non</option>
                          </select>
                        ) : item.is_vae ? (
                          <span style={{ color: "var(--mint-green)", fontWeight: 700 }}>⚡ Oui</span>
                        ) : (
                          <span style={{ opacity: 0.6 }}>Non</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.vae_kilometrage || ""}
                            onChange={(e) => setEditingData({ ...editingData, vae_kilometrage: parseInt(e.target.value) || null })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.vae_kilometrage ? `${item.vae_kilometrage} km` : "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingData.prix_achat_negocie || ""}
                            onChange={(e) => setEditingData({ ...editingData, prix_achat_negocie: parseFloat(e.target.value) || null })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.prix_achat_negocie ? `${item.prix_achat_negocie.toFixed(2)} €` : "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editingData.date_achat || ""}
                            onChange={(e) => setEditingData({ ...editingData, date_achat: e.target.value })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.date_achat ? new Date(item.date_achat).toLocaleDateString("fr-FR") : "-")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingData.prix_occasion_marche || ""}
                            onChange={(e) => setEditingData({ ...editingData, prix_occasion_marche: parseFloat(e.target.value) || null })}
                            style={{ width: "100%", padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                          />
                        ) : (item.prix_occasion_marche ? `${item.prix_occasion_marche.toFixed(2)} €` : "-")}
                      </td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #10b981",
                                background: "#d1fae5",
                                color: "#065f46",
                                fontSize: 13,
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              ✓ Sauver
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #ef4444",
                                background: "#fee2e2",
                                color: "#991b1b",
                                fontSize: 13,
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              ✕ Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <select
                              value={item.status || "achat_confirme"}
                              onChange={(e) => updateStatus(item.serial_number, e.target.value)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #d1d5db",
                                fontSize: 13,
                                cursor: "pointer",
                                background: item.status === "publie" ? "#d1fae5" : "#fef3c7",
                              }}
                            >
                              <option value="achat_confirme">Achat confirmé</option>
                              <option value="publie">Publié</option>
                            </select>
                            {isHovered && (
                              <button
                                onClick={() => startEditing(item)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: 16,
                                  padding: 4,
                                  opacity: 0.6,
                                  transition: "opacity 0.2s",
                                }}
                                onMouseEnter={(e) => e.target.style.opacity = 1}
                                onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                title="Éditer cette ligne"
                              >
                                ✏️
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;
