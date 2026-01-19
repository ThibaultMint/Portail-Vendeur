import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./InventoryList.css";

const InventoryList = ({ isOpen, onClose, onCountChange }) => {
  const [inventory, setInventory] = useState([]);
  const [publishedSerials, setPublishedSerials] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showPublished, setShowPublished] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(null);
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
        if (serial && publishedSerialsSet.has(serial) && item.status !== 'publie') {
          serialsToUpdate.push(serial);
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
        if (serial && publishedSerialsSet.has(serial)) {
          return { ...item, status: 'publie' };
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
                {filteredInventory.map((item, idx) => (
                  <tr key={idx}>
                    <td 
                      className="serial-number"
                      onClick={() => {
                        if (item.serial_number) {
                          navigator.clipboard.writeText(item.serial_number);
                          setCopiedSerial(item.serial_number);
                          setTimeout(() => setCopiedSerial(null), 800);
                        }
                      }}
                      style={{ cursor: item.serial_number ? 'pointer' : 'default' }}
                      title="Cliquer pour copier"
                    >
                      {copiedSerial === item.serial_number ? '✓ Copié !' : (item.serial_number || "-")}
                    </td>
                    <td>{item.marque || "-"}</td>
                    <td>{item.modele || "-"}</td>
                    <td>{item.taille || "-"}</td>
                    <td>{item.annee_affichee || "-"}</td>
                    <td>{item.type_velo || "-"}</td>
                    <td>
                      {item.is_vae ? (
                        <span style={{ color: "var(--mint-green)", fontWeight: 700 }}>⚡ Oui</span>
                      ) : (
                        <span style={{ opacity: 0.6 }}>Non</span>
                      )}
                    </td>
                    <td>{item.vae_kilometrage ? `${item.vae_kilometrage} km` : "-"}</td>
                    <td>{item.prix_achat_negocie ? `${item.prix_achat_negocie.toFixed(2)} €` : "-"}</td>
                    <td>{item.date_achat ? new Date(item.date_achat).toLocaleDateString("fr-FR") : "-"}</td>
                    <td>{item.prix_occasion_marche ? `${item.prix_occasion_marche.toFixed(2)} €` : "-"}</td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;
