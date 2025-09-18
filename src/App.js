import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { FaTrash, FaEnvelope, FaSyncAlt, FaBalanceScale } from "react-icons/fa";
import logoMint from "./logo mint.png";
import "./App.css";
import { FaHeart } from "react-icons/fa";

/* =============================
   Labels champs
============================= */
const fieldLabels = {
  Title: "Nom du vélo",
  "Prix réduit": "Prix",
  "Prix original": "Prix barré",
  URL: "Lien produit",
  "Published At": "Date de publication",
  "Updated At": "Dernière mise à jour",
  "Total Inventory Qty": "Stock disponible",
  Status: "Statut",

  Marque: "Marque",
  Modèle: "Modèle",
  Année: "Année",
  "Type de vélo": "Type de vélo",
  Catégorie: "Catégorie",
  "Poids du vélo": "Poids",
  Transmission: "Transmission",
  "Nb de vitesses": "Nombre de vitesses",
  "Nb de plateaux": "Nombre de plateaux",
  Cassette: "Cassette",
  "Dérailleur arrière": "Dérailleur arrière",
  "Dérailleur avant": "Dérailleur avant",
  Chaine: "Chaîne",
  Pédalier: "Pédalier",
  Guidon: "Guidon",
  Potence: "Potence",
  Selle: "Selle",
  "Tige de selle": "Tige de selle",
  "Type tige de selle": "Type de tige de selle",
  "Type de freins": "Type de freins",
  "Frein avant": "Frein avant",
  "Frein arrière": "Frein arrière",
  "Levier de freins": "Levier de freins",
  "Marque moteur": "Marque moteur",
  "Modèle moteur": "Modèle moteur",
  "Puissance moteur": "Puissance moteur",
  "Vitesse max": "Vitesse max",
  "Marque batterie": "Marque batterie",
  "Modèle batterie": "Modèle batterie",
  "Puissance batterie": "Puissance batterie",
  Autonomie: "Autonomie",
  "Etat batterie": "État batterie",
  "Nombre de cycles batterie": "Cycles batterie",
  "Matériau cadre": "Matériau cadre",
  "Marque fourche": "Marque fourche",
  "Modèle fourche": "Modèle fourche",
  "Débattement fourche": "Débattement fourche",
  Amortisseur: "Amortisseur",
  "Débattement amortisseur": "Débattement amortisseur",
  "Type de pneus": "Type de pneus",
  "Pneu avant": "Pneu avant",
  "Pneu arrière": "Pneu arrière",
  "Taille des roues": "Taille des roues",
  Kilométrage: "Kilométrage",
  "Taille du cadre": "Taille du cadre",
  "Taille Minimum": "Taille Minimum (cm)",
  "Taille Maximum": "Taille Maximum (cm)",
  "Denture cassette": "Denture cassette",
  "Denture plateaux": "Denture plateaux",
};

/* =============================
   Groupes caractéristiques
============================= */
const fieldGroups = {
  "Infos générales": [
    "Année",
    "Catégorie",
    "Type de vélo",
    "Poids du vélo",
    "Kilométrage",
    "Taille du cadre",
    "Taille Minimum",
    "Taille Maximum",
  ],
  Transmission: [
    "Transmission",
    "Nb de plateaux",
"Denture plateaux",
    "Nb de vitesses",
    "Cassette",
"Denture cassette",
    "Dérailleur avant",
    "Dérailleur arrière",
    "Chaine",
    "Pédalier",
  ],
  "Roues & Pneus": ["Type de pneus", "Pneu avant", "Pneu arrière", "Taille des roues"],
  "Cadre & Suspension": [
    "Matériau cadre",
    "Marque fourche",
    "Modèle fourche",
    "Débattement fourche",
    "Amortisseur",
    "Débattement amortisseur",
  ],
  Freinage: ["Type de freins", "Frein avant", "Frein arrière", "Levier de freins"],
  "Poste de pilotage": ["Guidon", "Potence", "Selle", "Tige de selle", "Type tige de selle"],
  "Électrique (VAE)": [
    "Marque moteur",
    "Modèle moteur",
    "Puissance moteur",
    "Vitesse max",
    "Marque batterie",
    "Modèle batterie",
    "Puissance batterie",
    "Autonomie",
    "Etat batterie",
    "Nombre de cycles batterie",
  ],
};
// Formatte les prix en "k"
const formatPrice = (value) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(".0", "") + "k €";
  }
  return value + " €";
};


/* =============================
   App
============================= */
function App() {
  // Données
  const [velos, setVelos] = useState([]);

  // Sélection / UI
  const [selected, setSelected] = useState({});
  const [selectedVelo, setSelectedVelo] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // Galerie image active
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Tri & Filtres
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({
    title: "",
    categorie: "",
    typeVelo: "",
    tailleCycliste: "",
    prixMin: 0,
    prixMax: 10000,
    advanced: {}, // clé = nom de champ, valeur = filtre texte
  });

  // Email HTML
  const [emailHTML, setEmailHTML] = useState("");

  /* -------- Fetch Supabase -------- */
  useEffect(() => {
    const fetchVelos = async () => {
      const { data, error } = await supabase.from("velosmint").select("*");
      if (error) {
        console.error(error);
        setVelos([]);
      } else {
        setVelos(data || []);
      }
    };
    fetchVelos();
  }, []);

  /* -------- Options filtres -------- */
  const allTitles = useMemo(() => [...new Set(velos.map(v => v.Title).filter(Boolean))], [velos]);
  const allCategories = useMemo(() => [...new Set(velos.map(v => v.Catégorie).filter(Boolean))], [velos]);
  const allTypes = useMemo(() => [...new Set(velos.map(v => v["Type de vélo"]).filter(Boolean))], [velos]);

  /* -------- Filtrer + Trier -------- */
  const filteredAndSortedVelos = useMemo(() => {
    let items = [...velos];

    if (filters.title) {
      const term = filters.title.toLowerCase();
      items = items.filter(v => (v.Title || "").toLowerCase().includes(term));
    }
    if (filters.categorie) {
      items = items.filter(v => v.Catégorie === filters.categorie);
    }
    if (filters.typeVelo) {
      items = items.filter(v => v["Type de vélo"] === filters.typeVelo);
    }
    if (filters.tailleCycliste) {
      const cible = Number(filters.tailleCycliste);
      items = items.filter(v => {
        const min = Number(v["Taille Minimum"]);
        const max = Number(v["Taille Maximum"]);
        if (!isNaN(min) && cible < min) return false;
        if (!isNaN(max) && cible > max) return false;
        return true;
      });
    }
    if (filters.prixMin || filters.prixMax) {
      items = items.filter(v => {
        const p = Number(v["Prix réduit"]);
        if (filters.prixMin && p < Number(filters.prixMin)) return false;
        if (filters.prixMax && p > Number(filters.prixMax)) return false;
        return true;
      });
    }
    // Avancés (contient tous les champs possibles)
   for (const [field, value] of Object.entries(filters.advanced)) {
  if (value) {
    items = items.filter(x =>
      String(x[field] ?? "").toLowerCase().includes(String(value).toLowerCase())
    );
  }
}


    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }
        return sortConfig.direction === "asc"
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      });
    }
    return items;
  }, [velos, filters, sortConfig]); // eslint-disable-line

  /* -------- Utilitaires sélection -------- */
  const toggleSelect = (url) => setSelected(prev => ({ ...prev, [url]: !prev[url] }));
  const resetSelection = () => setSelected({});
  const selectedCount = Object.values(selected).filter(Boolean).length;

  /* -------- Prix -------- */
  const renderPriceBox = (v) => {
  // Récupère brut
  let price = v["Prix réduit"];
  let compare = v["Prix original"];

  // Si c’est une string → nettoyage
  if (typeof price === "string") {
    price = Number(price.replace(/[^\d.-]/g, ""));
  }
  if (typeof compare === "string") {
    compare = Number(compare.replace(/[^\d.-]/g, ""));
  }

  const hasPrice = !isNaN(price) && price > 0;
  const hasCompare = !isNaN(compare) && compare > 0 && compare > price;

  return (
    <div className="price-box">
      <div className="new-price">
        {hasPrice ? `${price.toLocaleString("fr-FR")} €` : "Prix N/A"}
      </div>
      {hasCompare && (
        <div style={{ fontSize: "0.85em", color: "#666" }}>
          <span className="old-price">
            {compare.toLocaleString("fr-FR")} €
          </span>
          <span className="discount">
            -{Math.round((1 - price / compare) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};



  /* -------- Email HTML (complet) -------- */
  useEffect(() => {
    const selectedVelos = velos.filter(v => selected[v.URL]);
    if (selectedVelos.length === 0) {
      setEmailHTML("<p>Aucun vélo sélectionné.</p>");
      return;
    }

    const mintGreen = "#8FD9A8";
    const accentRed = "#d32f2f";

    let html = `
  <body style="margin:0; padding:0; background:#F9FAFB;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#F9FAFB" style="border-collapse:collapse; border-spacing:0;">
      <tr>
        <td align="center" style="padding:0; margin:0;">
          <!-- Conteneur principal -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:800px; margin:0 auto; border-radius:12px; overflow:hidden; border-collapse:collapse; border-spacing:0;">

            <!-- HEADER -->
            <tr>
              <td bgcolor="${mintGreen}" style="background:${mintGreen}; padding:20px; text-align:center;">
                <img src="https://cdn.trustpilot.net/consumersite-businessunitimages/63bd86bb5a1748a5ecb9a02a/profile-description/p.png" alt="Mint-Bikes" style="height:70px; margin-bottom:8px;">
                <h1 style="margin:0; font-size:22px; color:#111827; font-family:Arial,sans-serif;">Votre sélection personnalisée ! 🚲</h1>
                <p style="margin:8px 0 0; font:14px Arial; color:#111827;">
                  Merci d'avoir laissé vos critères de recherche sur <strong>mint-bikes.com</strong>.<br/>
                  Voici une sélection de vélos rien que pour vous !
                </p>
              </td>
            </tr>

            <!-- Liste des vélos -->
            <tr><td style="height:16px; line-height:16px;">&nbsp;</td></tr>
    `;

    for (let i = 0; i < selectedVelos.length; i += 2) {
      html += `
        <tr>
          <td align="center" style="padding:0; margin:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:800px; margin:0 auto; border-spacing:16px 0; border-collapse:separate;">
              <tr>
      `;
      for (let j = i; j < i + 2 && j < selectedVelos.length; j++) {
  const v = selectedVelos[j];

  // Nettoyage des prix (garde que les chiffres)
  let price = v["Prix réduit"];
  let compare = v["Prix original"];

  if (typeof price === "string") {
    price = Number(price.replace(/[^\d.-]/g, ""));
  }
  if (typeof compare === "string") {
    compare = Number(compare.replace(/[^\d.-]/g, ""));
  }

  const hasPrice = !isNaN(price) && price > 0;
  const hasCompare = !isNaN(compare) && compare > 0 && compare > price;

  const img = v["Image 1"] || "";

  html += `
    <td valign="top" align="center" style="width:50%; padding:0 8px; margin:0;">
      <table role="presentation" width="100%" style="border:1px solid #E5E7EB; border-radius:10px; background:#fff; margin:0 auto; border-collapse:collapse; border-spacing:0;">
        <tr>
          <td style="padding:12px; text-align:center;">
            <div style="font:600 15px Arial; color:#111827; margin-bottom:6px;">${v.Title || ""}</div>
            ${img ? `<img src="${img}" alt="" style="width:100%; max-width:220px; height:auto; border:1px solid #eee; border-radius:8px; margin-bottom:8px; display:block; margin-left:auto; margin-right:auto;">` : ""}
            <div style="font:14px Arial; color:#374151; margin:6px 0;">
              <div><strong>Année :</strong> ${v.Année || "N/A"}</div>
              <div><strong>Taille :</strong> ${v["Taille du cadre"] || "N/A"}</div>
              <div><strong>Kilométrage :</strong> ${v.Kilométrage || "N/A"}</div>
            </div>

            <!-- Bloc prix -->
            <div style="margin:8px 0;">
              <span style="font:700 18px Arial; color:#111827;">
                ${hasPrice ? `${price.toLocaleString("fr-FR")} €` : "Prix N/A"}
              </span>
              ${hasCompare ? `
                <span style="text-decoration:line-through; color:${accentRed}; margin-left:6px; font:700 14px Arial;">
                  ${compare.toLocaleString("fr-FR")} €
                </span>
                <span style="background:${accentRed}; color:#fff; padding:2px 6px; border-radius:4px; font:700 12px; margin-left:6px;">
                  -${Math.round((1 - price / compare) * 100)}%
                </span>` : ""}
            </div>

            ${v.URL ? `
              <a href="${v.URL}" target="_blank" style="display:inline-block; padding:10px 14px; background:${mintGreen}; color:#111827; font:700 14px Arial; border-radius:8px; text-decoration:none;">
                Voir le vélo
              </a>` : ""}
          </td>
        </tr>
      </table>
    </td>
  `;
}

      html += `
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    html += `
            <!-- CONTACTEZ NOUS -->
            <tr><td style="height:16px; line-height:16px;">&nbsp;</td></tr>
            <tr>
              <td align="center" style="padding:10px 20px; text-align:center; font:14px Arial; color:#111827;">
                <h2 style="margin:0 0 10px; font:600 18px Arial; color:#111827;">CONTACTEZ NOUS !</h2>
                <p style="max-width:500px; margin:0 auto 12px; line-height:1.6;">
                  Nous serions très heureux de pouvoir vous conseiller !<br/>
                  N’hésitez pas à nous appeler, nous ne sommes pas des robots 😊<br/>
                  Nous sommes passionnés de vélo et là pour vous aider à trouver votre bonheur.
                </p>
                <p style="margin:0; font:italic 14px Arial; color:#374151;">
                  Sportivement,<br/>L’équipe Mint-Bikes
                </p>
              </td>
            </tr>

            <!-- Boutons -->
            <tr>
              <td align="center" style="padding:0 20px 10px;">
                <a href="tel:+33484980028" style="display:block; width:100%; text-align:center; background:#111827; color:#fff; padding:14px 0; border-radius:10px; text-decoration:none; font:700 15px Arial;">📞 Nous appeler</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 20px 18px;">
                <a href="mailto:contact@mint-bikes.com" style="display:block; width:100%; text-align:center; background:#2563EB; color:#fff; padding:14px 0; border-radius:10px; text-decoration:none; font:700 15px Arial;">✉️ Nous écrire</a>
              </td>
            </tr>

            <!-- Gros bouton visiter -->
            <tr>
              <td align="center" style="padding:0 20px 20px;">
                <a href="https://mint-bikes.com" target="_blank" style="display:block; width:100%; text-align:center; background:${mintGreen}; color:#111827; padding:16px 0; border-radius:12px; text-decoration:none; font:700 16px Arial;">
                  🌿 Visiter mint-bikes.com
                </a>
              </td>
            </tr>

            <!-- Bloc garanties avec image -->
            <tr>
              <td align="center" style="padding:0; margin:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                       style="max-width:760px; margin:0 auto; background-color:${mintGreen}; border-collapse:collapse; border-spacing:0;">
                  <tr>
                    <!-- Texte -->
                    <td valign="middle" align="center" style="vertical-align:middle; width:60%; padding:20px;">
                      <div style="max-width:320px; margin:0 auto; text-align:center;">
                        <h2 style="margin:0 0 10px; font:600 18px Arial; color:#111827;">Pourquoi choisir Mint-Bikes ?</h2>
                        <p style="margin:0; font:14px Arial; color:#111827; line-height:1.6;">
                          ✅ 12 mois de garantie<br/>
                          🔧 Reconditonnement avec 100 points de contrôle<br/>
                          🚚 Livraison via 200 boutiques partenaires<br/>
                          💳 Paiement en plusieurs fois (Alma, Younited, Paypal)<br/>
                          📞 Support réactif et disponible
                        </p>
                      </div>
                    </td><!-- PAS DE RETOUR --><td valign="middle" align="center" style="vertical-align:middle; width:40%; padding:20px;">
                      <img src="https://mint-bikes.com/cdn/shop/files/img-contact-min_1800x.jpg?v=1639492862"
                           alt="Mécanicien Mint-Bikes"
                           style="max-width:100%; height:auto; border-radius:8px; border:2px solid #fff; display:block;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:12px; text-align:center; font:12px Arial; color:#6B7280;">
                Mint-Bikes • 215 Rue Paul Langevin, 13290 Aix-en-Provence<br/>
                <a href="mailto:contact@mint-bikes.com" style="color:#2CA76A; text-decoration:none;">contact@mint-bikes.com</a><br/>
                <a href="https://mint-bikes.com/unsubscribe" style="color:#9CA3AF; text-decoration:underline;">Se désabonner</a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>`;

setEmailHTML(html);


  }, [selected, velos]);

  /* =============================
     Rendu
  ============================= */
  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="header-fixed">
        <div className="header-bar">
          <div className="header-left">
            <img src={logoMint} alt="Logo" className="header-logo" />
          </div>
          <div className="header-center">
            <h1>Mint-Bikes Viewer</h1>
          </div>
          <div className="header-right">
            <p>{filteredAndSortedVelos.length} vélo(s) affiché(s)</p>
          </div>
        </div>

        {/* Filtres */}
<div className="filters">

  {/* Partie gauche = filtres */}
  <div className="filters-left">
    {/* Titre */}
    <div className="filter-block">
      <label>Titre</label>
      <input
        type="text"
        value={filters.title}
        onChange={(e) => setFilters({ ...filters, title: e.target.value })}
        list="titles"
        placeholder="Commence à taper…"
      />
      <datalist id="titles">
        {allTitles.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>

    {/* Catégorie */}
    <div className="filter-block">
      <label>Catégorie</label>
      <select
        value={filters.categorie}
        onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
      >
        <option value="">Toutes</option>
        {allCategories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>

    {/* Type de vélo */}
    <div className="filter-block">
      <label>Type de vélo</label>
      <select
        value={filters.typeVelo}
        onChange={(e) => setFilters({ ...filters, typeVelo: e.target.value })}
      >
        <option value="">Tous</option>
        {allTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>

    {/* Taille cycliste */}
    <div className="filter-block">
      <label>Taille cycliste (cm)</label>
      <input
        type="number"
        placeholder="ex: 178"
        value={filters.tailleCycliste}
        onChange={(e) => setFilters({ ...filters, tailleCycliste: e.target.value })}
      />
    </div>

    {/* Prix */}
    <div className="filter-block">
      <label style={{ visibility: "hidden" }}>Prix</label>
      <div className="range-slider">
        <div
          className="range-label"
          style={{ left: `${(filters.prixMin / 10000) * 100}%` }}
        >
          {formatPrice(filters.prixMin)}
        </div>
        <div
          className="range-label"
          style={{ left: `${(filters.prixMax / 10000) * 100}%` }}
        >
          {formatPrice(filters.prixMax)}
        </div>

        <input
          type="range"
          min="0"
          max="10000"
          step="100"
          value={filters.prixMin}
          onChange={(e) =>
            setFilters({
              ...filters,
              prixMin: Math.min(Number(e.target.value), filters.prixMax - 100)
            })
          }
        />
        <input
          type="range"
          min="0"
          max="10000"
          step="100"
          value={filters.prixMax}
          onChange={(e) =>
            setFilters({
              ...filters,
              prixMax: Math.max(Number(e.target.value), filters.prixMin + 100)
            })
          }
        />
        <div
          className="range-track"
          style={{
            left: `${(filters.prixMin / 10000) * 100}%`,
            right: `${100 - (filters.prixMax / 10000) * 100}%`
          }}
        />
      </div>
    </div>

    {/* Bouton filtres avancés */}
    <div className="filter-block">
      <label style={{ visibility: "hidden" }}> </label>
      <button
        className="advanced-btn"
        onClick={() => setShowAdvancedFilters(true)}
      >
        ⚙️ Filtres avancés
      </button>
    </div>
  </div>

  {/* Partie droite = vue + tri */}
  <div className="filters-right">
    {/* Vue */}
    <div className="filter-block">
      <label>Vue</label>
      <div className="view-buttons">
        <button
          type="button"
          className={viewMode === "grid" ? "active" : ""}
          onClick={() => setViewMode("grid")}
        >
          Grille
        </button>
        <button
          type="button"
          className={viewMode === "list" ? "active" : ""}
          onClick={() => setViewMode("list")}
        >
          Liste
        </button>
      </div>
    </div>

    {/* Tri */}
    <div className="filter-block">
      <label>Trier par</label>
      <div className="sort-row">
        <select
          value={sortConfig.key || ""}
          onChange={(e) => {
            const key = e.target.value;
            setSortConfig(key ? { key, direction: "asc" } : { key: null, direction: "asc" });
          }}
        >
          <option value="">—</option>
          <option value="Title">Titre</option>
          <option value="Année">Année</option>
          <option value="Prix réduit">Prix</option>
          <option value="Published At">Date de publication</option>
        </select>
        <button
          type="button"
          onClick={() =>
            setSortConfig((prev) =>
              prev.key ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" } : prev
            )
          }
          disabled={!sortConfig.key}
        >
          {sortConfig.direction === "asc" ? "⬆️" : "⬇️"}
        </button>
      </div>
    </div>
  </div>
</div>

        {/* Actions rapides */}
        <div className="actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span><strong>{selectedCount}</strong> vélo(x) sélectionné(s)</span>
          <button onClick={resetSelection} className="icon-btn" title="Réinitialiser la sélection" disabled={selectedCount === 0}>
            <FaSyncAlt />
          </button>
          <button onClick={() => setShowPreview(true)} className="icon-btn" title="Prévisualiser le mail">
            <FaEnvelope />
          </button>
          <button
            onClick={() => setShowCompare(true)}
            className="icon-btn"
            title="Comparer"
            disabled={selectedCount < 2}
          >
            <FaBalanceScale />
          </button>
          <button
            onClick={() => {
              setFilters({ title: "", categorie: "", typeVelo: "", tailleCycliste: "", prixMin: "", prixMax: "", advanced: {} });
            }}
            className="icon-btn"
            title="Réinitialiser les filtres"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* CONTENU */}
<div className="content-scroll">
  {viewMode === "grid" && (
  <div className="grid-container">
    {filteredAndSortedVelos.map((v) => (
      <div
        key={v.URL}
        className={`velo-card ${selected[v.URL] ? "selected" : ""}`}
        onClick={() => setSelectedVelo(v)}
      >
        {/* Image avec cœur */}
        <div className="image-wrapper">
          {v["Image 1"] && (
            <img src={v["Image 1"]} alt="Vélo" className="velo-image" />
          )}
          <div
            className={`wishlist-icon ${selected[v.URL] ? "selected" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(v.URL);
            }}
          >
            <FaHeart />
          </div>
        </div>

        {/* Titre */}
        <div className="title">
          <strong>{v.Title}</strong>
        </div>

        {/* Prix */}
        {renderPriceBox(v)}

        {/* Infos principales */}
        <div style={{ fontSize: "0.9em", color: "#555" }}>
          <strong>Année:</strong> {v.Année || "N/A"}<br />
          <strong>Taille:</strong> {v["Taille du cadre"] || "N/A"}
          {v["Type de vélo"] === "Électrique" && (
            <>
              <br />
              <strong>Kilométrage:</strong> {v.Kilométrage || "N/A"}
            </>
          )}
        </div>
      </div>
    ))}
  </div>
)}

  {viewMode === "list" && (
    <table>
      <thead>
        <tr>
          <th>Sélection</th>
          <th>Titre</th>
          <th>Type</th>
          <th>Catégorie</th>
          <th>Année</th>
          <th>Prix</th>
          <th>Kilométrage</th>
        </tr>
      </thead>
      <tbody>
        {filteredAndSortedVelos.map((v) => (
          <tr key={v.URL} onClick={() => setSelectedVelo(v)}>
            <td onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!selected[v.URL]}
                onChange={() => toggleSelect(v.URL)}
              />
            </td>
            <td>{v.Title}</td>
            <td>{v["Type de vélo"] || "N/A"}</td>
            <td>{v.Catégorie || "N/A"}</td>
            <td>{v.Année || "N/A"}</td>
            <td>{v["Prix réduit"] ? `${v["Prix réduit"]} €` : "N/A"}</td>
            <td>{v.Kilométrage || "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
      {/* PANNEAU LATÉRAL */}
      {selectedVelo && (
        <>
          <div className="overlay" onClick={() => setSelectedVelo(null)}></div>
          <div className="side-panel open">
            <button className="close-btn" onClick={() => setSelectedVelo(null)}>X</button>
            <h2>{selectedVelo.Title}</h2>

            {/* Galerie avancée */}
{(() => {
  const images = Array.from({ length: 26 }, (_, i) => selectedVelo[`Image ${i + 1}`]).filter(Boolean);
  if (images.length === 0) return null;

  return (
    <div className="gallery-advanced">
      {/* Image principale */}
      <div className="gallery-main">
        <button
          className="nav-btn left"
          onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
        >
          ‹
        </button>
        <img src={images[currentImageIndex]} alt="Vélo" className="gallery-main-img" />
        <button
          className="nav-btn right"
          onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
        >
          ›
        </button>
      </div>

      {/* Miniatures */}
      <div className="gallery-thumbs">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Thumb ${idx + 1}`}
            className={`gallery-thumb ${idx === currentImageIndex ? "active" : ""}`}
            onClick={() => setCurrentImageIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
})()}


            {/* Prix + bouton Voir le vélo */}
<div className="price-and-link">
  {renderPriceBox(selectedVelo)}

  {selectedVelo.URL && (
    <a
      href={selectedVelo.URL}
      target="_blank"
      rel="noreferrer"
      className="btn-link"
    >
      Voir le vélo
    </a>
  )}
</div>

            {/* Détails en tableaux par groupe */}
            <div className="details-grid">
              {Object.entries(fieldGroups).map(([groupName, fields]) => {
  // 👉 N'affiche la section "Électrique (VAE)" que si Type de vélo est "Électrique"
  if (
    groupName === "Électrique (VAE)" &&
    selectedVelo["Type de vélo"]?.toLowerCase() !== "électrique"
  ) {
    return null;
  }

  return (
    <div key={groupName} className="detail-group">
      <h3>{groupName}</h3>
      <table className="detail-table">
        <tbody>
          {fields.map((field) => (
            <tr key={field}>
              <td><strong>{fieldLabels[field] || field}</strong></td>
              <td>
                {selectedVelo[field] !== undefined
                  ? String(selectedVelo[field])
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
})}
            </div>

            {selectedVelo.URL && (
              <a href={selectedVelo.URL} target="_blank" rel="noreferrer" className="btn-link" style={{ marginTop: 10 }}>
                Voir le vélo
              </a>
            )}
          </div>
        </>
      )}

      {/* PREVIEW EMAIL */}
      {showPreview && (
        <>
          <div className="overlay" onClick={() => setShowPreview(false)}></div>
          <div className="modal-preview">
            <button className="close-btn" onClick={() => setShowPreview(false)}>X</button>
            <h2>Prévisualisation du mail</h2>
            <p style={{ fontStyle: "italic", color: "#d35400" }}>
              ⚠️ Contenu généré automatiquement — vérifie avant envoi
            </p>
            <div
              id="email-preview-content"
              style={{ border: "1px solid #ddd", padding: "10px", background: "#F9FAFB", marginBottom: "10px" }}
              dangerouslySetInnerHTML={{ __html: emailHTML }}
            />
            <button
              onClick={() => {
                const el = document.getElementById("email-preview-content");
                if (!el) return;
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand("copy");
                alert("Contenu copié !");
              }}
            >
              Copier le HTML
            </button>
          </div>
        </>
      )}

      {/* COMPARATEUR */}
      {showCompare && (
        <>
          <div className="overlay" onClick={() => setShowCompare(false)}></div>
          <div className="modal-preview">
            <button className="close-btn" onClick={() => setShowCompare(false)}>X</button>
            <h2>Comparateur de vélos</h2>
            {velos.filter(v => selected[v.URL]).length > 0 ? (
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Vélos</th>
                    {velos.filter(v => selected[v.URL]).slice(0, 4).map((v) => (
                      <th key={v.URL} style={{ textAlign: "center" }}>
                        {v["Image 1"] ? (
                          <img
                            src={v["Image 1"]}
                            alt="Vélo"
                            style={{ width: 100, height: 80, objectFit: "contain", marginBottom: 6 }}
                          />
                        ) : null}
                        <div style={{ fontWeight: "bold" }}>{v.Title}</div>
                        <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                          {v["Prix réduit"] ? `${v["Prix réduit"]} €` : "Prix N/A"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fieldGroups).map(([groupName, fields]) => (
                    <React.Fragment key={groupName}>
                      <tr>
                        <td colSpan={5} style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                          {groupName}
                        </td>
                      </tr>
                      {fields.map((field) => (
                        <tr key={field}>
                          <td><strong>{fieldLabels[field] || field}</strong></td>
                          {velos.filter(v => selected[v.URL]).slice(0, 4).map((v) => (
                            <td key={v.URL + field}>
                              {v[field] !== undefined ? String(v[field]) : "N/A"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucun vélo sélectionné pour comparaison.</p>
            )}
          </div>
        </>
      )}

      {/* DRAWER FILTRES AVANCÉS */}
      {showAdvancedFilters && (
        <>
          <div className="overlay" onClick={() => setShowAdvancedFilters(false)}></div>
          <div className="advanced-filters-drawer open">
            <button className="close-btn" onClick={() => setShowAdvancedFilters(false)}>X</button>
            <h2>Filtres avancés</h2>
            {Object.entries(fieldGroups).map(([groupName, fields]) => (
              <div key={groupName} className="advanced-group">
                <h3>{groupName}</h3>
                <div className="advanced-grid">
                  {fields.map((field) => (
                    <div key={field} className="filter-adv-item">
                      <label>{fieldLabels[field] || field}</label>
                      <input
                        type="text"
                        value={filters.advanced[field] || ""}
                        onChange={(e) =>	
                          setFilters((prev) => ({
                            ...prev,
                            advanced: { ...prev.advanced, [field]: e.target.value },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
