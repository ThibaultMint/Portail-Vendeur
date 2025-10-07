import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import { FaTrash, FaEnvelope, FaSyncAlt, FaBalanceScale, FaHeart, FaUser, FaUserCircle } from "react-icons/fa";
import logoMint from "./logo mint.png";
import "./App.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { createPortal } from "react-dom";

// 🚨 Mets ta vraie clé Gemini ici :
const API_KEY = "XXXXXXXXXXXX";

/* =============================
   Labels champs
============================= */
const fieldLabels = {
  Title: "Nom du vélo",
  "Marque": "Marque",
  "Modèle": "Modèle",
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
  "Type tige de selle": "Type tige de selle",
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
  "Levier de vitesse": "Levier de vitesse",
  "Plateaux": "Plateaux",
  "Roue avant": "Roue avant",
  "Matériau roue avant": "Matériau roue avant",
  "Roue arrière": "Roue arrière",
  "Matériau roue arrière": "Matériau roue arrière",
  "Pièces neuves": "Pièces neuves",
  "Défauts visuels": "Défauts visuels",
  "Points forts": "Points forts",
  "Tailles conseillées": "Tailles de cadre disponibles",
};

/* =============================
   Groupes caractéristiques
============================= */
const fieldGroups = {
  "Infos générales": [
      "Marque",
  "Modèle",
    "Année",
    "Catégorie",
    "Type de vélo",
    "Poids du vélo",
    "Kilométrage",
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
    "Levier de vitesse",
    "Plateaux",
  ],
  "Roues & Pneus": ["Type de pneus", "Pneu avant", "Pneu arrière", "Taille des roues","Roue avant",
    "Matériau roue avant",
    "Roue arrière",
    "Matériau roue arrière",],
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
  Divers: [
    "Pièces neuves",
    "Défauts visuels",
    "Points forts"
  ],
};

// Champs numériques -> sliders (noms EXACTS des colonnes)
const numericFields = {
  "Année": { min: 2017, max: 2025, step: 1, unit: "" },
  "Poids du vélo": { min: 0, max: 35, step: 1, unit: "kg" },
  "Kilométrage": { min: 0, max: 40000, step: 100, unit: "km" },
  "Débattement fourche": { min: 0, max: 220, step: 5, unit: "mm" },
  "Débattement amortisseur": { min: 0, max: 220, step: 5, unit: "mm" },
  "Nb de vitesses": { min: 1, max: 13, step: 1, unit: "" },
  "Puissance batterie": { min: 100, max: 1200, step: 50, unit: "Wh" },
  "Puissance moteur": { min: 0, max: 120, step: 5, unit: "Nm" },
};

// 🔑 mapping "Nom de colonne" -> préfixe de clé dans `filters`
const rangeKeyMap = {
  "Année": "annee",
  "Poids du vélo": "poids",
  "Kilométrage": "kilometrage",
  "Débattement fourche": "debattementFourche",
  "Débattement amortisseur": "debattementAmortisseur",
  "Nb de vitesses": "nbVitesses",
  "Puissance batterie": "puissanceBatterie",
  "Puissance moteur": "puissanceMoteur",
  "Nombre de cycles batterie": "cyclesBatterie",
  "Vitesse max": "vitesseMax",
  // Optionnels si tu ajoutes des sliders un jour :
  "Nb de plateaux": "nbPlateaux",
  "Denture cassette": "dentureCassette",
  "Denture plateaux": "denturePlateaux",
  "Taille du cadre": "tailleCadre",
  "Autonomie": "autonomie",
};

// Mapping MultiSelect "nom colonne" -> clé `filters`
const multiSelectMapping = {
  "Catégorie": "categories",
  "Type de vélo": "typesVelo",
  "Taille du cadre": "taillesCadre",
  "Matériau cadre": "materiauxCadre",
  "Type de freins": "typesFreins",
  "Type de pneus": "typesPneus",
  "Marque moteur": "marqueMoteur",
  "Marque batterie": "marqueBatterie",
  "Marque fourche": "marqueFourche",
  "Amortisseur": "amortisseurs",
  "Taille des roues": "tailleRoues",
   "Transmission": "transmission",
  "Nb de plateaux": "nbPlateaux",
  "Denture plateaux": "denturePlateaux",
  "Denture cassette": "dentureCassette",

  // ➕ Roues & pneus
  "Pneu avant": "pneusAvant",
  "Pneu arrière": "pneusArriere",
  "Roue avant": "rouesAvant",
  "Matériau roue avant": "materiauRoueAvant",
  "Roue arrière": "rouesArriere",
  "Matériau roue arrière": "materiauRoueArriere",

  // ➕ Cadre & suspension
  "Modèle fourche": "modelesFourche",


  // ➕ Freinage
  "Frein avant": "freinsAvant",
  "Frein arrière": "freinsArriere",
  "Levier de freins": "leviersFreins",

  "Type tige de selle": "typesTigeSelle",

  // ➕ Moteur / Batterie (textuels)
  "Modèle moteur": "modelesMoteur",
};

// Formatte les prix en "k"
const formatPrice = (value) => {
  if (value >= 1000) return (value / 1000).toFixed(1).replace(".0", "") + "k €";
  return value + " €";
};

/** Liste à cocher déroulante réutilisable */
function MultiSelect({ label, options, values, onChange, placeholder = "Choisir…" }) {
  const [open, setOpen] = useState(false);
  const toggle = (val) => {
    if (values.includes(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  };
  return (
    <div className="multi-select">
      <button type="button" className="multi-select-btn" onClick={() => setOpen((o) => !o)}>
        {label} {values.length > 0 ? `(${values.length})` : ""} ▾
      </button>
      {open && (
        <div className="multi-select-dropdown" onMouseLeave={() => setOpen(false)}>
          {options.length === 0 ? (
            <div className="multi-select-empty">{placeholder}</div>
          ) : (
            options.map((opt) => (
              <label key={opt} className="multi-select-item">
                <input type="checkbox" checked={values.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))
          )}
          {values.length > 0 && (
            <button type="button" className="multi-select-clear" onClick={() => onChange([])}>
              Effacer la sélection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
const parseDateFlexible = (val) => {
  if (!val) return NaN;
  const t = Date.parse(val);
  if (!Number.isNaN(t)) return t;
  const m = String(val).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    return new Date(y, mo, d).getTime();
  }
  return NaN;
};

// Utilitaires
const cleanText = (val) => String(val ?? "").trim().replace(/\s+/g, " ");
const parseNumericValue = (val) => {
  if (val == null) return null;
  const str = String(val).replace(/[^0-9.,-]/g, "").replace(",", ".");
  const num = parseFloat(str);
  return Number.isNaN(num) ? null : num;
};
// Helper multi-select réutilisable (global)
const applyMulti = (list, field, selected) => {
  if (!selected || selected.length === 0) return list;
  const wanted = new Set((selected || []).map(cleanText));
  return list.filter((v) => wanted.has(cleanText(v[field])));
};

/* =========================
   Helpers variantes & tailles
   ========================= */

// --- STOCK PAR VARIANTE ---
// lit "Stock variant 1/2/3..." (tolère espaces/._-)
const getVariantStockMap = (row) => {
  const map = {};
  if (!row || typeof row !== "object") return map;
  for (const [key, val] of Object.entries(row)) {
    const k = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    const m = k.match(/^stockvariant(\d+)$/) || k.match(/^stockvar(\d+)$/);
    if (m) {
      const idx = Number(m[1]);
      const n = parseNumericValue(val);
      map[idx] = Number.isFinite(n) ? n : null; // null => inconnu
    }
  }
  return map;
};

const isVariantInStock = (stockMap, idx) => {
  // S’il n’y a AUCUNE info de stock, on n’exclut rien.
  if (!stockMap || Object.keys(stockMap).length === 0) return true;
  const s = stockMap[idx];
  // Exclure uniquement si on sait que c’est 0
  return !(Number.isFinite(s) && s <= 0);
};

// --- LIBELLÉS (S/M/L…) PAR VARIANTE ---
// depuis "Taille cadre variant N" (tolère espaces/._- et 'var' abrégé)
const getVariantLabelsMap = (row) => {
  const labels = {};
  if (!row || typeof row !== "object") return labels;

  for (const [key, val] of Object.entries(row)) {
    const cleaned = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    const m =
      cleaned.match(/^taillecadrevar(?:iant|iante)?(\d+)$/) ||
      cleaned.match(/^taillecadrevar(\d+)$/);
    if (m) {
      const idx = Number(m[1]);
      const label = cleanText(val);
      if (label && label !== "N/A") labels[idx] = label;
    }
  }

  // Fallback ancien champ si AUCUNE colonne variant
  if (Object.keys(labels).length === 0) {
    const fb = cleanText(row["Taille du cadre"]);
    if (fb && fb !== "N/A") labels[1] = fb;
  }
  return labels;
};

// --- PLAGES DE TAILLE (cm) PAR VARIANTE ---
// depuis "TailleMin VarN" / "TailleMax VarN" (tolère "Variant" et séparateurs)
const getVariantRangesMap = (row) => {
  const ranges = {};
  if (!row || typeof row !== "object") return ranges;

  for (const [key, val] of Object.entries(row)) {
    const k = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    let m = k.match(/^taille(min|minimum)(variant|var)?(\d+)$/);
    if (m) {
      const idx = Number(m[3]);
      ranges[idx] = ranges[idx] || {};
      ranges[idx].min = parseNumericValue(val);
      continue;
    }
    m = k.match(/^taille(max|maximum)(variant|var)?(\d+)$/);
    if (m) {
      const idx = Number(m[3]);
      ranges[idx] = ranges[idx] || {};
      ranges[idx].max = parseNumericValue(val);
      continue;
    }
  }
  return ranges;
};

/* ============ AFFICHAGES ============ */

// 1) Tailles de cadre disponibles (labels S/M/L…), en filtrant le stock
const getFrameSizes = (row) => {
  const labelsMap = getVariantLabelsMap(row);
  const stockMap = getVariantStockMap(row);

  // S’il n’y a AUCUNE colonne variant, getVariantLabelsMap renvoie le fallback “Taille du cadre”.
  const hasRealVariants = Object.keys(labelsMap).some((i) => Number(i) !== 1 || labelsMap[1] !== cleanText(row["Taille du cadre"]));

  const idxs = Object.keys(labelsMap)
    .map(Number)
    .filter((i) => isVariantInStock(stockMap, i))
    .sort((a, b) => a - b);

  const labels = idxs.map((i) => labelsMap[i]).filter(Boolean);

  // Si on avait des colonnes variantes mais toutes à 0 → renvoyer [] pour ne rien afficher
  if (hasRealVariants && labels.length === 0) return [];

  // Sinon (pas de colonnes variantes), labels contient le fallback éventuel
  return labels;
};

const formatFrameSizes = (row) => {
  const sizes = getFrameSizes(row);
  return sizes.length ? sizes.join(" / ") : "N/A";
};

// 2) Plages conseillées en cm par taille (ex: "S : 165–175 cm ; M : 176–186 cm")
const formatVariantSizeRanges = (row) => {
  const labelsMap = getVariantLabelsMap(row);
  const rangesMap = getVariantRangesMap(row);
  const stockMap  = getVariantStockMap(row);

  const allIdxs = Array.from(
    new Set([...Object.keys(labelsMap), ...Object.keys(rangesMap)].map(Number))
  ).sort((a, b) => a - b);

  const parts = allIdxs
    .filter((i) => isVariantInStock(stockMap, i))
    .map((i) => {
      const label = labelsMap[i] || `Var${i}`;
      const min = rangesMap[i]?.min;
      const max = rangesMap[i]?.max;
      if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
      return `${label} : ${Math.round(min)}–${Math.round(max)} cm`;
    })
    .filter(Boolean);

  return parts.length ? parts.join(" / ") : null;
};

/* ============ RECHERCHE PAR TAILLE (cm) ============ */

// Version “liste de paires [min,max]” (in-stock) si besoin ailleurs
const getHeightRanges = (row) => {
  const rangesMap = getVariantRangesMap(row);
  const stockMap  = getVariantStockMap(row);

  const variantIdxs = Object.keys(rangesMap).map(Number);
  const hasVariants = variantIdxs.length > 0;

  if (hasVariants) {
    const ranges = variantIdxs
      .filter((i) => isVariantInStock(stockMap, i))
      .map((i) => {
        const { min, max } = rangesMap[i] || {};
        return (Number.isFinite(min) && Number.isFinite(max)) ? [min, max] : null;
      })
      .filter(Boolean);
    return ranges; // peut être [] si tout est out-of-stock
  }

  // Fallback ancien schéma
  const min = parseNumericValue(row["Taille Minimum"]);
  const max = parseNumericValue(row["Taille Maximum"]);
  return (Number.isFinite(min) && Number.isFinite(max)) ? [[min, max]] : [];
};

// Filtre “taille cycliste” : ne matche que des variantes EN STOCK
const heightMatches = (heightCm, row) => {
  const h = parseNumericValue(heightCm);
  if (h == null) return true; // pas de saisie → on ne filtre pas

  const labelsMap = getVariantLabelsMap(row);
  const rangesMap = getVariantRangesMap(row);
  const stockMap  = getVariantStockMap(row);

  const hasVariants =
    Object.keys(labelsMap).length > 0 ||
    Object.keys(rangesMap).length > 0 ||
    Object.keys(stockMap).length > 0;

  if (hasVariants) {
    const idxs = Object.keys(rangesMap)
      .map(Number)
      .filter((i) => isVariantInStock(stockMap, i));

    // Si on a des variantes mais AUCUNE en stock → ne pas matcher
    if (idxs.length === 0) return false;

    return idxs.some((i) => {
      const r = rangesMap[i];
      return Number.isFinite(r?.min) && Number.isFinite(r?.max) && h >= r.min && h <= r.max;
    });
  }

  // Fallback ancien schéma (sans variantes)
  const min = parseNumericValue(row["Taille Minimum"]);
  const max = parseNumericValue(row["Taille Maximum"]);
  if (Number.isFinite(min) && Number.isFinite(max)) return h >= min && h <= max;

  // Pas d’infos de taille → on ne filtre pas
  return true;
};

/* ============ Compat (si l’ancien code appelle encore ces noms) ============ */

// Variantes “brutes” (labels), déjà filtrées par stock
const getSizeVariants = (row) => getFrameSizes(row);

// Chaîne jointe des variantes (labels), filtrées par stock
const formatSizeVariants = (row) => formatFrameSizes(row);

// ---- Email helpers: Points forts ----
const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Bloc email centré + taille qui survit au copier-coller Pipedrive
const renderPointsFortsEmail = (val) => {
  if (!val) return "";

  // Normalisation en liste (string, <br>, virgules, points-virgules, puces)
  let items = [];
  if (Array.isArray(val)) {
    items = val;
  } else {
    const s = String(val || "").replace(/<br\s*\/?>/gi, "\n");
    items = s
      .split(/[;\n,•]+/g)
      .map(t => t.trim().replace(/^[-–•\u2022]+\s*/, ""))
      .filter(Boolean);
  }
  if (!items.length) return "";

  const text = items.join(" – ");

  // Astuces "qui collent" dans Pipedrive :
  // - <font size="2"> pour réduire la taille (1-7)
  // - <small> (x2) comme backup si Pipedrive touche au <font>
  // - table + align="center" pour un centrage robuste
  return [
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;">',
      '<tr><td align="center" style="padding:0;margin:0;">',
        '<div style="margin:10px 0 0 0;text-align:center;">',

          // Titre
          '<small><small><font size="2" style="line-height:1.35;color:#6b7280;">',
            '<b>Pourquoi il va vous plaire</b>',
          '</font></small></small>',

          '<br/>',

          // Texte (centré, largeur lisible)
          '<div style="display:inline-block;max-width:520px;margin:0;">',
            '<small><small><font size="2" style="line-height:1.45;color:#374151;">',
              text,
            '</font></small></small>',
          '</div>',

        '</div>',
      '</td></tr>',
    '</table>',
  ].join('');
};
// ===== Tooltip stock par variantes (version sans conflit) =====

// petit nettoyage
const _clean = (s) => (s == null ? "" : String(s).trim());

// --- FIX — construit {index -> quantité} à partir des colonnes "Stock variant N"
// Garde les décimales "9.0" -> 9 (et "9,0" -> 9), au lieu de transformer en "90".
const _buildVariantStockMap = (row) => {
  const map = {};
  if (!row || typeof row !== "object") return map;

  const toInt = (val) => {
    if (val == null) return 0;
    if (typeof val === "number") return Math.round(val);
    const n = parseFloat(String(val).trim().replace(",", "."));
    return Number.isFinite(n) ? Math.round(n) : 0;
  };

  for (const [key, val] of Object.entries(row)) {
    // accepte: "Stock variant 1", "Stock var 2", "stock_variant_3", etc.
    const k = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    const m = k.match(/^stock(?:variant|var)?(\d+)$/);
    if (!m) continue;

    const idx = Number(m[1]);
    const qty = toInt(val);
    if (qty > 0) map[idx] = qty;         // ignore 0 / null
  }
  return map;
};


// "56 : 2 stock\n58 : 10 stock" (une ligne par variante)
const formatVariantStockInline = (row) => {
  if (!row || typeof row !== "object") return "";

  // Labels {index -> "S" | "M" | "56" ...} depuis "Taille cadre variant N"
  const labels = {};
  for (const [key, val] of Object.entries(row)) {
    const k = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    const m =
      k.match(/^taillecadrevar(?:iant|iante)?(\d+)$/) ||
      k.match(/^taillecadrevar(\d+)$/);
    if (!m) continue;
    const idx = Number(m[1]);
    const label = (val == null ? "" : String(val).trim());
    if (label) labels[idx] = label;
  }

  // Quantités {index -> number} depuis "Stock variant N"
  const stocks = _buildVariantStockMap(row); // ← ta fonction existante
  const idxs = Object.keys(stocks).map(Number).sort((a, b) => a - b);

  const NBSP = "\u00A0"; // espace insécable pour éviter "56:" puis ligne suivante "2"
  const parts = [];
  for (const i of idxs) {
    const qty = stocks[i] || 0;
    if (qty > 0) {
      const label = labels[i] || `Var${i}`;
      parts.push(`${label}${NBSP}:${NBSP}${qty}${NBSP}en stock`);
    }
  }
  return parts.join("\n"); // un retour à la ligne entre chaque variante
};







/* =============================
   App
============================= */
function App() {
  // 🔑 Auth
  const [session, setSession] = useState(null);

  const currentUser = session?.user?.email || "Anonyme";


  // Données
  const [velos, setVelos] = useState([]);

  // Sélection / UI
  const [selected, setSelected] = useState({});
  const [selectedVelo, setSelectedVelo] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // Galerie
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
const imagesForSelected = useMemo(() => {
  if (!selectedVelo) return [];
  const imgs = [];
  for (let i = 1; i <= 26; i++) {
    const u = selectedVelo[`Image ${i}`];
    if (u) imgs.push(u);
  }
  return imgs;
}, [selectedVelo]);

const openGalleryAt = (idx = 0) => {
  setModalImageIndex(idx);
  setShowGalleryModal(true);
  document.body.style.overflow = "hidden";
};

const closeGallery = () => {
  setShowGalleryModal(false);
  document.body.style.overflow = "";
};

const nextImage = () => {
  if (!imagesForSelected.length) return;
  setModalImageIndex((i) => (i + 1) % imagesForSelected.length);
};

const prevImage = () => {
  if (!imagesForSelected.length) return;
  setModalImageIndex((i) => (i - 1 + imagesForSelected.length) % imagesForSelected.length);
};



  const [showSaveAlert, setShowSaveAlert] = useState(false);
const [alertsOpen, setAlertsOpen] = useState(false);
const [alerts, setAlerts] = useState([]);
// ===== ALERTE : états & helpers =====
const [alertsBadgeCount, setAlertsBadgeCount] = useState(0);   // total des "nouveaux vélos"
const [alertsUnseenMap, setAlertsUnseenMap] = useState({});    // { alertId: count }

// Remplace l'ancien toTime
const toTime = (val) => {
  const t = parseDateFlexible(val);
  return Number.isNaN(t) ? 0 : t;
};

// ===== ALERTE : fetch + calcul des nouveaux vélos =====
const fetchAlerts = useCallback(async () => {
  if (!session?.user?.id) {
    setAlerts([]);
    setAlertsBadgeCount(0);
    setAlertsUnseenMap({});
    return;
  }

  // 1) Récupère les alertes
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ fetchAlerts error:", error);
    setAlerts([]);
    setAlertsBadgeCount(0);
    setAlertsUnseenMap({});
    return;
  }

  // 2) Calcule les "nouveaux" par alerte
  const unseenMap = {};
  let total = 0;

  (data || []).forEach((a) => {
    if (a?.is_active === false) {
      unseenMap[a.id] = 0;
      return;
    }

    const dateField = a?.date_field === "Updated At" ? "Updated At" : "Published At";
    // base = dernière vue (si dispo) sinon "depuis le"
    const baseDateStr = a?.last_seen_max_published_at || a?.since || null;
    const baseT = baseDateStr ? toTime(baseDateStr) : 0;

    const matching = applyAllFilters(velos, a?.filters || {});
    const unseen = matching.reduce((acc, v) => {
      const vt = toTime(v?.[dateField]);     // ← robustifié
      return acc + (vt > baseT ? 1 : 0);
    }, 0);

    unseenMap[a.id] = unseen;
    total += unseen;
  });

  // 3) États
  setAlerts(data || []);
  setAlertsUnseenMap(unseenMap);
  setAlertsBadgeCount(total);
}, [session?.user?.id, velos, supabase]);

  

  

 // <— dépend de velos pour recalculer dès que le catalogue change

// 4) Auto-refresh au montage + quand velos change
useEffect(() => {
  fetchAlerts();
}, [fetchAlerts]);

// Quand la modale des alertes se FERME, on recalcule (ex: après avoir consulté)
useEffect(() => {
  if (!alertsOpen) fetchAlerts();
}, [alertsOpen, fetchAlerts]);

// Quand la modale "Créer alerte" se FERME, on recalcule (ex: après création)
useEffect(() => {
  if (!showSaveAlert) fetchAlerts();
}, [showSaveAlert, fetchAlerts]);



useEffect(() => {
  const onKey = (e) => {
    if (!showGalleryModal || !imagesForSelected.length) return;
    if (e.key === "Escape") closeGallery();
    else if (e.key === "ArrowRight") nextImage();
    else if (e.key === "ArrowLeft")  prevImage();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [showGalleryModal, imagesForSelected.length]);




  // Filtres
  const defaultFilters = {
    title: "",
    categorie: "",
    typeVelo: "",
    tailleCycliste: "",
    

    prixMin: 0,
    prixMax: 10000,

    anneeMin: 2017,
    anneeMax: 2025,
    poidsMin: 0,
    poidsMax: 35,
    kilometrageMin: 0,
    kilometrageMax: 40000,
    debattementFourcheMin: 0,
    debattementFourcheMax: 220,
    debattementAmortisseurMin: 0,
    debattementAmortisseurMax: 220,
    puissanceBatterieMin: 0,
    puissanceBatterieMax: 1250,
    nbVitessesMin: 0,
    nbVitessesMax: 13,

    // autres numériques que le drawer peut renseigner
    puissanceMoteurMin: undefined,
    puissanceMoteurMax: undefined,
    cyclesBatterieMin: undefined,
    cyclesBatterieMax: undefined,
    vitesseMaxMin: undefined,
    vitesseMaxMax: undefined,
    tailleRouesMin: undefined,
    tailleRouesMax: undefined,
    publishedAfter: undefined, // ISO string (ex: '2025-01-01')
  updatedAfter: undefined,   // ISO string

    // MultiSelect
    categories: [],
  typesVelo: [],
    taillesCadre: [],
    materiauxCadre: [],
    typesFreins: [],
    typesPneus: [],
    marqueMoteur: [],
    marqueBatterie: [],
    marqueFourche: [],
    amortisseurs: [],
    tailleRoues: [],pedaliers: [],
  leviersVitesse: [],
  plateaux: [],

  pneusAvant: [],
  pneusArriere: [],
  rouesAvant: [],
  materiauRoueAvant: [],
  rouesArriere: [],
  materiauRoueArriere: [],

  modeleFourche: [],
  freinsAvant: [],
  freinsArriere: [],
  leviersFreins: [],

  guidons: [],
  potences: [],
  selles: [],
  tigesSelle: [],
  typesTigeSelle: [],

  modelesMoteur: [],
  modelesBatterie: [],
  etatsBatterie: [],
  transmission: [],
  nbPlateaux: [],
  denturePlateaux: [],
  dentureCassette: [],
  
    

    // Texte libres
    advanced: {},
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const handleShowAlert = useCallback((a) => {
  if (!a) return;

  const dateField = a?.date_field === "Updated At" ? "Updated At" : "Published At";

  // Vélos correspondants + date max vue
  const matching = applyAllFilters(velos, a?.filters || {});
  let max = 0;
  for (const v of matching) {
    const t = Date.parse(v?.[dateField]);
    if (!Number.isNaN(t) && t > max) max = t;
  }
  const maxIso = max ? new Date(max).toISOString() : null;

  // Persiste "dernier vu" (promise, sans await)
  supabase
    .from("alerts")
    .update({
      last_seen_max_published_at: maxIso,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", a.id)
    .then(({ error }) => {
      if (error) console.error("update alert last_seen error:", error);
    })
    .catch((e) => console.error(e));

  // Reset compteur UI (+N) et badge cloche
  setAlertsUnseenMap((prev) => {
    const next = { ...prev, [a.id]: 0 };
    const total = Object.values(next).reduce((s, n) => s + (Number(n) || 0), 0);
    setAlertsBadgeCount(total);
    return next;
  });

  // Màj locale de la ligne
  setAlerts((prev) =>
    (prev || []).map((row) =>
      row.id === a.id
        ? { ...row, last_seen_max_published_at: maxIso, last_seen_at: new Date().toISOString() }
        : row
    )
  );

  // Applique les filtres et ferme (un useEffect refetch quand la modale se ferme)
  setFilters(a?.filters || defaultFilters);
  setAlertsOpen(false);
}, [velos, supabase]);


// Signature utilisateur
const [showSignatureModal, setShowSignatureModal] = useState(false);
const [signatureHTML, setSignatureHTML] = useState("");   // version “sauvegardée”
const [signatureDraft, setSignatureDraft] = useState(""); // en cours d’édition
const buildDefaultSignature = () => {
  const name = session?.user?.user_metadata?.full_name || "Votre Nom";
  const email = session?.user?.email || "vous@exemple.com";
  return `
  <div style="font-family:sans-serif;text-align:center;">
  <img src="https://media.licdn.com/dms/image/v2/D4D03AQGCKnkUrrryGw/profile-displayphoto-scale_200_200/B4DZfLep46GsAg-/0/1751465500721?e=2147483647&v=beta&t=wtBI8zdAxvwpoVG_8O85DvShX_CD2HyeTi0oUiWm6Y4" alt="Thibault" width="96" style="display:block;margin:0 auto;border-radius:50%;border:0;line-height:0;">
  <p style="margin:0;font-size:13px;line-height:1.6;color:#374151;font-style:italic;">
    &laquo;&nbsp;Passionné de vélo depuis des années, avec un faible pour la route et le gravel, j’aime autant grimper des cols au petit matin que rouler tranquille pour explorer. Chez Mint-Bikes, je conseille des vélos reconditionnés fiables et adaptés à ton usage, avec le souci du détail et une vraie transparence. Raconte-moi ta pratique : je t’oriente vers des modèles révisés et garantis qui donnent envie de sortir plus souvent.&nbsp;&raquo;
  </p>
  <p style="margin:0;font-weight:700;font-size:14px;color:#111827;">Thibault, Conseiller Cycle</p>
</div>`;
};

const [personalPhone, setPersonalPhone] = useState("");
// charger la signature + numéro perso
useEffect(() => {
  if (!session?.user?.id) return;
  (async () => {
    const { data, error } = await supabase
      .from("user_signatures")
      .select("signature_html, personal_phone")
      .eq("user_id", session.user.id)
      .single();

    if (!error && data) {
      setSignatureHTML(data.signature_html || "");
      setPersonalPhone(data.personal_phone || "");
    }
  })();
}, [session?.user?.id]);

  // Email HTML
  const [emailHTML, setEmailHTML] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formHeight, setFormHeight] = useState(0);

  // Gemini
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState("");
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [errorGemini, setErrorGemini] = useState(null);

  // Menu utilisateur
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };
  const userMenuRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
      setUserMenuOpen(false);
    }
  };
  const handleEsc = (e) => {
    if (e.key === "Escape") setUserMenuOpen(false);
  };

  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleEsc);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleEsc);
  };
}, []);

  // === state du formulaire ===
const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
const [feedbackCategory, setFeedbackCategory] = useState("bug");
const [feedbackMessage, setFeedbackMessage] = useState("");

// --- États pour le feedback ---
const [showFeedback, setShowFeedback] = useState(false);

// Fonction pour envoyer
const submitFeedback = async () => {
  const { error } = await supabase.from("feedback").insert({
    username: currentUser,
    category: feedbackCategory,
    message: feedbackMessage,
    created_at: new Date(),
  });

  if (error) {
    console.error("Supabase insert error:", error);
    alert("Erreur lors de l’envoi du feedback : " + error.message);
    return;
  }

  alert("Merci pour votre retour 🙏");
  setShowFeedback(false);
  setFeedbackMessage("");
};

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved != null) setDarkMode(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const getDaysSincePublication = (dateString) => {
  if (!dateString) return null;
  const published = new Date(dateString);
  const now = new Date();
  const diffTime = now - published;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // jours
};


 // ===== Prospects (intérêts par vélo) =====
const [interests, setInterests] = useState({}); // { "vendeur@ex.com": 2, "autre@ex.com": 1 }

// Qui est l'utilisateur courant (vendeur) ?
const currentUserName =
  session?.user?.user_metadata?.full_name ||
  session?.user?.email ||
  "Vendeur inconnu";

const INTERESTS_TABLE = "interests";

// Récupère la map des intérêts pour un vélo
const fetchInterests = async (veloUrl) => {
  if (!veloUrl) return;
  try {
    const { data, error } = await supabase
      .from(INTERESTS_TABLE)
      .select("interests")
      .eq("velo_url", veloUrl)
      .single();

    if (error) {
      // Si la ligne n'existe pas encore, c’est normal => on repart sur {}
      if (error.code === "PGRST116" /* row not found */) {
        setInterests({});
        return;
      }
      console.error("❌ fetchInterests error:", error);
      setInterests({});
      return;
    }

    setInterests(data?.interests || {});
  } catch (e) {
    console.error("❌ fetchInterests exception:", e);
    setInterests({});
  }
};

// +1 pour le vendeur courant
const addInterest = async (veloUrl) => {
  if (!veloUrl) return;
  const current = Number(interests[currentUserName] || 0);
  const updated = { ...interests, [currentUserName]: current + 1 };

  try {
    const { error } = await supabase
      .from(INTERESTS_TABLE)
      .upsert(
        { velo_url: veloUrl, interests: updated },
        { onConflict: "velo_url" } // s'appuie sur la PK
      );

    if (error) {
      console.error("❌ addInterest error:", error);
      return;
    }

    setInterests(updated); // mise à jour locale immédiate
  } catch (e) {
    console.error("❌ addInterest exception:", e);
  }
};

// -1 pour le vendeur courant (jamais < 0)
const removeInterest = async (veloUrl) => {
  if (!veloUrl) return;
  const current = Number(interests[currentUserName] || 0);
  if (current <= 0) return;

  const updated = { ...interests, [currentUserName]: current - 1 };

  try {
    const { error } = await supabase
      .from(INTERESTS_TABLE)
      .upsert(
        { velo_url: veloUrl, interests: updated },
        { onConflict: "velo_url" }
      );

    if (error) {
      console.error("❌ removeInterest error:", error);
      return;
    }

    setInterests(updated);
  } catch (e) {
    console.error("❌ removeInterest exception:", e);
  }
};
// ===== Notes par vélo =====
const [notes, setNotes] = useState({});
const [isNotesOpen, setIsNotesOpen] = useState(false); // modal ouverte ?
const [draftNote, setDraftNote] = useState(""); // texte en cours d'édition
const NOTES_TABLE = "notes";
const selectedKey = selectedVelo?.URL || selectedVelo?.id || selectedVelo?.Référence;

// Compte les notes non vides
const noteCount = useMemo(() => {
  if (!notes || typeof notes !== "object") return 0;
  return Object.values(notes).filter(
    (v) => typeof v === "string" && v.trim().length > 0
  ).length;
}, [notes]);

// Charger les notes d’un vélo
const fetchNotes = async (veloUrl) => {
  if (!veloUrl) return;
  try {
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select("notes")
      .eq("velo_url", veloUrl)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        setNotes({});
        return;
      }
      console.error("❌ fetchNotes error:", error);
      setNotes({});
      return;
    }

    setNotes(data?.notes || {});
    setDraftNote(data?.notes?.[currentUserName] || "");
  } catch (e) {
    console.error("❌ fetchNotes exception:", e);
    setNotes({});
  }
};

// Sauvegarder la note du vendeur courant
const saveNote = async (veloUrl, text) => {
  if (!veloUrl) return;

  const updated = { ...notes, [currentUserName]: text };

  try {
    const { error } = await supabase
      .from(NOTES_TABLE)
      .upsert(
        { velo_url: veloUrl, notes: updated },
        { onConflict: "velo_url" }
      );

    if (error) {
      console.error("❌ saveNote error:", error);
      return;
    }

    setNotes(updated);
    setDraftNote(text);
  } catch (e) {
    console.error("❌ saveNote exception:", e);
  }
};


// 👉 Très important : recharger les intérêts quand on ouvre un vélo
useEffect(() => {
  // ⚠️ Ton dataset utilise "URL" (MAJUSCULES), pas "url"
  if (selectedVelo?.URL) {
    fetchInterests(selectedVelo.URL);
    fetchNotes(selectedVelo.URL).then(() => {
      setDraftNote(notes[currentUserName] || "");
    });  
  }
}, [selectedVelo?.URL]);



  /* -------- Gestion session Supabase -------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* -------- Fetch Supabase (vélos) -------- */
  useEffect(() => {
    const fetchVelos = async () => {
      const { data, error } = await supabase.from("velosmint").select("*");
      if (error) {
        console.error(error);
        setVelos([]);
        return;
      }
      const velosFetched = data || [];
      setVelos(velosFetched);
         };
    fetchVelos();
  }, []);

function GalleryModal({ isOpen, images = [], index = 0, onClose, onPrev, onNext }) {
  if (!isOpen || !images.length) return null;

  return createPortal(
    <div className="gallery-overlay" onClick={onClose}>
      <div className="gallery-frame" onClick={(e) => e.stopPropagation()}>
        <button className="gallery-close" onClick={onClose} aria-label="Fermer">✕</button>

        <button className="gallery-arrow left" onClick={onPrev} aria-label="Précédente">‹</button>

        <img
          className="gallery-img"
          src={images[index]}
          alt={`Photo ${index + 1} / ${images.length}`}
        />

        <button className="gallery-arrow right" onClick={onNext} aria-label="Suivante">›</button>
      </div>
    </div>,
    document.body
  );
}

  /* -------- Options filtres (listes) -------- */
  const allTitles = useMemo(() => [...new Set(velos.map((v) => v.Title).filter(Boolean))], [velos]);
  const allCategories = useMemo(() => [...new Set(velos.map((v) => v["Catégorie"]).filter(Boolean))], [velos]);
  const allTypes = useMemo(() => [...new Set(velos.map((v) => v["Type de vélo"]).filter(Boolean))], [velos]);

  // Retourne la liste unique triée des valeurs d'un champ
  const getOptionsFor = (field) => {
    const opts = velos.map((v) => cleanText(v[field])).filter((s) => s && s !== "N/A");
    return [...new Set(opts)].sort((a, b) => a.localeCompare(b, "fr"));
  };

  // --- 💚 La fonction de filtrage réutilisable (pipeline complet SANS tri)
const applyAllFilters = (sourceVelos, f = {}) => {
  let items = [...sourceVelos];

  // 1) Filtres de base
  if (f.title) {
    const term = String(f.title).toLowerCase();
    items = items.filter((v) => (v.Title || "").toLowerCase().includes(term));
  }
  if (f.categorie) items = items.filter((v) => v["Catégorie"] === f.categorie);
  if (f.typeVelo) items = items.filter((v) => v["Type de vélo"] === f.typeVelo);

  if (f.tailleCycliste) {
  const cible = parseNumericValue(f.tailleCycliste);
  items = items.filter((v) => heightMatches(cible, v));
}




  // 2) Prix principal
  items = items.filter((v) => {
    const prix = parseNumericValue(v["Prix réduit"]);
    if (prix === null) return true;
    if (f.prixMin !== undefined && prix < f.prixMin) return false;
    if (f.prixMax !== undefined && prix > f.prixMax) return false;
    return true;
  });

  // 3) Numériques avancés (via numericFields + rangeKeyMap)
  const checkRange = (value, min, max) => {
    if (value === null) return true;
    if (min !== undefined && min !== null && value < min) return false;
    if (max !== undefined && max !== null && value > max) return false;
    return true;
  };

  const numericPairs = Object.keys(numericFields).map((field) => {
    const keyPrefix = rangeKeyMap[field];
    const minKey = keyPrefix ? `${keyPrefix}Min` : undefined;
    const maxKey = keyPrefix ? `${keyPrefix}Max` : undefined;
    return { field, minKey, maxKey };
  });

  items = items.filter((v) => {
    for (const { field, minKey, maxKey } of numericPairs) {
      if (!minKey || !maxKey) continue;
      const val = parseNumericValue(v[field]);
      if (!checkRange(val, f[minKey], f[maxKey])) return false;
    }
    return true;
  });

   // 4) Multi-select …
  items = applyMulti(items, "Catégorie", f.categories);
  items = applyMulti(items, "Type de vélo", f.typesVelo);
  items = applyMulti(items, "Taille du cadre", f.taillesCadre);

  // Transmission
  items = applyMulti(items, "Transmission", f.transmission);
  items = applyMulti(items, "Nb de plateaux", f.nbPlateaux);
  items = applyMulti(items, "Denture plateaux", f.denturePlateaux);
  items = applyMulti(items, "Denture cassette", f.dentureCassette);
  items = applyMulti(items, "Dérailleur avant", f.derailleursAvant);
  items = applyMulti(items, "Dérailleur arrière", f.derailleursArriere);
  items = applyMulti(items, "Chaine", f.chaines);
  items = applyMulti(items, "Pédalier", f.pedaliers);
  items = applyMulti(items, "Levier de vitesse", f.leviersVitesse);
  items = applyMulti(items, "Plateaux", f.plateaux);

  // Roues & pneus
  items = applyMulti(items, "Type de pneus", f.typesPneus);
  items = applyMulti(items, "Pneu avant", f.pneusAvant);
  items = applyMulti(items, "Pneu arrière", f.pneusArriere);
  items = applyMulti(items, "Taille des roues", f.tailleRoues);
  items = applyMulti(items, "Roue avant", f.rouesAvant);
  items = applyMulti(items, "Matériau roue avant", f.materiauRoueAvant);
  items = applyMulti(items, "Roue arrière", f.rouesArriere);
  items = applyMulti(items, "Matériau roue arrière", f.materiauRoueArriere);

  // Cadre & suspension
  items = applyMulti(items, "Matériau cadre", f.materiauxCadre);
  items = applyMulti(items, "Marque fourche", f.marqueFourche);
  items = applyMulti(items, "Modèle fourche", f.modeleFourche);
  items = applyMulti(items, "Amortisseur", f.amortisseurs);

  // Freinage
  items = applyMulti(items, "Type de freins", f.typesFreins);
  items = applyMulti(items, "Frein avant", f.freinsAvant);
  items = applyMulti(items, "Frein arrière", f.freinsArriere);
  items = applyMulti(items, "Levier de freins", f.leviersFreins);

  // Poste de pilotage
  items = applyMulti(items, "Guidon", f.guidons);
  items = applyMulti(items, "Potence", f.potences);
  items = applyMulti(items, "Selle", f.selles);
  items = applyMulti(items, "Tige de selle", f.tigesSelle);
  items = applyMulti(items, "Type tige de selle", f.typesTigeSelle);

  // Électrique (VAE)
  items = applyMulti(items, "Marque moteur", f.marqueMoteur);
  items = applyMulti(items, "Modèle moteur", f.modelesMoteur);
  items = applyMulti(items, "Vitesse max", f.vitessesMax);
  items = applyMulti(items, "Marque batterie", f.marqueBatterie);
  items = applyMulti(items, "Modèle batterie", f.modelesBatterie);
  items = applyMulti(items, "Autonomie", f.autonomies);
  items = applyMulti(items, "Etat batterie", f.etatsBatterie);
  items = applyMulti(items, "Nombre de cycles batterie", f.cyclesBatterie);

  // 5) Filtre DATE : uniquement Published At
  if (f.publishedAfter) {
    const t = Date.parse(f.publishedAfter);
    if (!Number.isNaN(t)) {
      items = items.filter((v) => {
        const vt = parseDateFlexible(v["Published At"]);
        return !Number.isNaN(vt) && vt >= t;
      });
    }
  }

  return items;
};

  /* -------- Filtrer + Trier (PIPELINE UNIQUE) -------- */
  const filteredAndSortedVelos = useMemo(() => {
  let items = applyAllFilters(velos, filters); // ← filtrage réutilisable

  // Tri (on garde ta logique)
  if (sortConfig.key) {
    const key = sortConfig.key;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    items.sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      const aEmpty = aVal == null || aVal === "";
      const bEmpty = bVal == null || bVal === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1 * dir;
      if (bEmpty) return -1 * dir;

      if (key === "Published At") {
        const at = parseDateFlexible(aVal);
        const bt = parseDateFlexible(bVal);
        if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
        if (Number.isNaN(at)) return 1 * dir;
        if (Number.isNaN(bt)) return -1 * dir;
        return (at - bt) * dir;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * dir;
      }

      return String(aVal).localeCompare(String(bVal), "fr", { sensitivity: "base", numeric: true }) * dir;
    });
  }

  return items;
}, [velos, filters, sortConfig]);


  /* -------- Utilitaires sélection -------- */
  const toggleSelect = (url) => setSelected((prev) => ({ ...prev, [url]: !prev[url] }));
  const resetSelection = () => setSelected({});
  const selectedCount = Object.values(selected).filter(Boolean).length;

  /* -------- Prix -------- */
  const renderPriceBox = (v) => {
    let price = v["Prix réduit"];
    let compare = v["Prix original"];
    if (typeof price === "string") price = Number(price.replace(/[^\d.-]/g, ""));
    if (typeof compare === "string") compare = Number(compare.replace(/[^\d.-]/g, ""));
    const hasPrice = !isNaN(price) && price > 0;
    const hasCompare = !isNaN(compare) && compare > 0 && compare > price;
    return (
      <div className="price-box">
        <div className="new-price">{hasPrice ? `${price.toLocaleString("fr-FR")} €` : "Prix N/A"}</div>
        {hasCompare && (
          <div style={{ fontSize: "0.85em", color: "#666" }}>
            <span className="old-price">{compare.toLocaleString("fr-FR")} €</span>
            <span className="discount">-{Math.round((1 - price / compare) * 100)}%</span>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
  if (!alertsOpen) return;
  (async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAlerts(data || []);
  })();
}, [alertsOpen]);

  /* -------- Signature -------- */
useEffect(() => {
  const loadSignature = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("user_signatures")
      .select("signature_html")
      .eq("user_id", session.user.id)
      .single();

    const html = data?.signature_html || buildDefaultSignature();
    setSignatureHTML(html);
    setSignatureDraft(html); // on préremplit l’éditeur
  };
  loadSignature();
}, [session?.user?.id]);


  useEffect(() => {
  const selectedVelos = velos.filter((v) => selected[v.URL]);
  if (selectedVelos.length === 0) {
    setEmailHTML('<p style="font-family:sans-serif">Aucun vélo sélectionné.</p>');
    return;
  }

  const mint = "#A2E4B8";
  const accentRed = "#d32f2f";

  // Barré robuste pour Pipedrive (caractères combinants)
  const strike = (txt) => {
    if (!txt) return "";
    return txt.split("").join("\u0336") + "\u0336";
  };

  // Barré "compatibilité Pipedrive" : ajoute U+0336 après chaque caractère
const strikeCompat = (txt = "") =>
  txt.split("").map(ch => (/\s/.test(ch) ? ch : ch + "\u0336")).join("");


  // Signature : on garde la tienne si dispo, sinon fallback
  const signatureToUse =
    signatureHTML && signatureHTML.trim()
      ? signatureHTML
      : (typeof buildDefaultSignature === "function" ? buildDefaultSignature() : "");

  const chunks = [];

  // Wrapper global
  chunks.push(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F9FAFB;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;background:#F9FAFB;font-family:sans-serif;">'
  );

  // Bandeau
  chunks.push(
    '<tr><td align="center" style="padding:0;margin:0;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px;margin:0 auto;border-collapse:separate;border-spacing:0;">',
        '<tr><td bgcolor="' + mint + '" style="background:' + mint + ';padding:20px;text-align:center;">',
          '<img src="https://cdn.trustpilot.net/consumersite-businessunitimages/63bd86bb5a1748a5ecb9a02a/profile-description/p.png" alt="Mint-Bikes" style="height:70px;margin:0 auto 8px;display:block;">',
          '<div style="margin:0 0 6px 0;font-weight:700;font-size:22px;color:#111827;">Votre sélection personnalisée ! 🚲</div>',
          '<div style="margin:0;color:#111827;font-size:14px;line-height:1.45;">Merci d\'avoir laissé vos critères de recherche sur <b>mint-bikes.com</b>.<br>Voici une sélection de vélos rien que pour vous !</div>',
        '</td></tr>',
        '<tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>'
  );

  // Cartes vélos (2 par ligne)
  for (let i = 0; i < selectedVelos.length; i += 2) {
    chunks.push('<tr><td align="center" style="padding:0;margin:0;">');
    chunks.push('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px;margin:0 auto;border-collapse:separate;border-spacing:16px 0;"><tr>');

    for (let j = i; j < i + 2 && j < selectedVelos.length; j++) {
      const v = selectedVelos[j];
      const img = v["Image 1"] || "";

      let price = v["Prix réduit"];
      let compare = v["Prix original"];
      if (typeof price === "string") price = Number(price.replace(/[^\d.-]/g, ""));
      if (typeof compare === "string") compare = Number(compare.replace(/[^\d.-]/g, ""));

      const hasPrice = !isNaN(price) && price > 0;
      const hasCompare = !isNaN(compare) && compare > 0 && compare > price;

      const pFmt = hasPrice ? price.toLocaleString("fr-FR") + " €" : "Prix N/A";
      const cFmt = hasCompare ? compare.toLocaleString("fr-FR") + " €" : "";
      const discount = hasCompare ? Math.round((1 - price / compare) * 100) : null;

      chunks.push(
        '<td valign="top" align="center" style="width:50%;padding:0 8px;margin:0;">',
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:10px;background:#fff;">',
            '<tr><td style="padding:12px;text-align:center;">',
              // Titre
              '<div style="font-weight:600;font-size:15px;color:#111827;margin:0 0 8px;">', (v.Title || ''), '</div>',
              // Image
              (img
                ? '<img src="' + img + '" alt="" width="220" style="max-width:100%;height:auto;border:1px solid #eee;border-radius:8px;margin:0 auto 8px;display:block;">'
                : ''),
              // Infos
              '<div style="font-size:13px;color:#374151;margin:6px 0;line-height:1.45;">',
                '<span><b>Année:</b> ', (v.Année || 'N/A'), '</span>',
                ' &nbsp;•&nbsp; <span><b>Taille:</b> ' + (formatFrameSizes(v) || 'N/A') + '</span>',
                ' &nbsp;•&nbsp; <span><b>Kilométrage:</b> ', (v.Kilométrage || 'N/A'), '</span>',
              '</div>',
              // Après '</div>' du bloc "Infos", ajoute CETTE ligne dans le même chunks.push:
(renderPointsFortsEmail(v["Points forts"]) || ''),

              // Prix (barré + % rouge) — compatible Pipedrive (espaces + rouge + barré garanti)
'<div style="margin:8px 0;">',
  ' <span style="display:inline-block;font-size:18px;line-height:1.2;"><b>' + pFmt + '</b></span>',
  (hasCompare
    ? '&nbsp;&nbsp;<span style="display:inline-block;font-size:14px;line-height:1.2;">' + strikeCompat(cFmt) + '</span>'
      + '&nbsp;&nbsp;<span style="display:inline-block;font-size:12px;line-height:1.2;font-weight:700;color:' + accentRed + ';white-space:nowrap;"><font color="' + accentRed + '">-' + discount + '%</font></span>'
    : ''
  ),
'</div>',
              // CTA
              (v.URL
                ? '<a href="' + v.URL + '" target="_blank" style="display:inline-block;padding:10px 14px;background:' + mint + ';color:#111827;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Voir le vélo</a>'
                : ''),
            '</td></tr>',
          '</table>',
        '</td>'
      );
    }

    chunks.push('</tr></table>');
    chunks.push('</td></tr>');
  }

  // Espace
  chunks.push('<tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>');

  // ===== Bloc contact (2 boutons côte à côte, avec numéro perso) =====
{
  const companyDefaultPhone = "+33484980028";
  const normalizeTel = (s) => (s || "").replace(/[^\d+]/g, "");
  const phoneToUse =
    (typeof personalPhone === "string" && personalPhone.trim())
      ? personalPhone.trim()
      : companyDefaultPhone;
  const telHref = "tel:" + normalizeTel(phoneToUse);
  const callLabel = (phoneToUse !== companyDefaultPhone) ? "📞 M’appeler" : "📞 Nous appeler";

  chunks.push(
    '<tr><td align="center" style="padding:10px 20px;text-align:center;">',
      '<div style="font-weight:600;font-size:18px;color:#111827;margin:0 0 10px;font-family:Arial, sans-serif;">CONTACTEZ NOUS !</div>',
      '<div style="max-width:560px;margin:0 auto 12px;line-height:1.55;font-size:14px;color:#111827;font-family:Arial, sans-serif;">',
        'Nous serions très heureux de pouvoir vous conseiller !<br>N’hésitez pas à nous appeler, nous ne sommes pas des robots 😊<br>Nous sommes passionnés de vélo et là pour vous aider à trouver votre bonheur.',
      '</div>',
    '</td></tr>',
    '<tr><td align="center" style="padding:0 20px 18px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:800px;margin:0 auto;border-collapse:separate;table-layout:fixed;">',
        '<tr>',
          '<td align="center" width="50%" style="padding:0 6px;">',
            '<a href="', telHref, '" ',
               'style="display:block;width:100%;text-align:center;background:#111827;color:#ffffff;',
                      'padding:14px 0;border-radius:10px;text-decoration:none;',
                      'font-weight:700;font-size:15px;font-family:Arial, sans-serif;">',
               callLabel,
            '</a>',
          '</td>',
          '<td align="center" width="50%" style="padding:0 6px;">',
            '<a href="mailto:contact@mint-bikes.com" ',
               'style="display:block;width:100%;text-align:center;background:#2563EB;color:#ffffff;',
                      'padding:14px 0;border-radius:10px;text-decoration:none;',
                      'font-weight:700;font-size:15px;font-family:Arial, sans-serif;">',
              '✉️ Nous écrire',
            '</a>',
          '</td>',
        '</tr>',
      '</table>',
    '</td></tr>'
  );
}

  // Signature (empilée pour éviter les décalages Pipedrive)
  chunks.push(
    '<tr><td align="left" style="padding:16px 20px;">',
      signatureToUse,
    '</td></tr>'
  );

  // CTA site
  chunks.push(
    '<tr><td align="center" style="padding:0 20px 20px;">',
      '<a href="https://mint-bikes.com" target="_blank" style="display:block;width:100%;max-width:800px;text-align:center;background:' + mint + ';color:#111827;padding:16px 0;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;margin:0 auto;">🌿 Visiter mint-bikes.com</a>',
    '</td></tr>'
  );

  // Pourquoi choisir (texte puis image dessous → pas de side-by-side)
  chunks.push(
    '<tr><td align="center" style="padding:0;margin:0;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:760px;margin:0 auto;background:' + mint + ';border-collapse:separate;border-spacing:0;border-radius:10px;">',
        '<tr><td align="center" style="padding:20px;">',
          '<div style="max-width:520px;margin:0 auto;text-align:center;">',
            '<div style="margin:0 0 10px;font-weight:600;font-size:18px;color:#111827;">Pourquoi choisir Mint-Bikes ?</div>',
            '<div style="margin:0;color:#111827;font-size:14px;line-height:1.55;">',
              '✅ 12 mois de garantie • 🔧 Reconditionnement 100 points • 🚚 Livraison via 200 partenaires • 💳 Paiement en plusieurs fois • 📞 Support réactif',
            '</div>',
          '</div>',
          '<div style="height:12px;line-height:12px;font-size:0;">&nbsp;</div>',
        '</td></tr>',
      '</table>',
    '</td></tr>'
  );

  // Footer
  chunks.push(
    '<tr><td align="center" style="padding:12px;text-align:center;font-size:12px;color:#6B7280;">',
      'Mint-Bikes • 215 Rue Paul Langevin, 13290 Aix-en-Provence<br>',
      '<a href="mailto:contact@mint-bikes.com" style="color:#2CA76A;text-decoration:none;">contact@mint-bikes.com</a><br>',
      '<a href="https://mint-bikes.com/unsubscribe" style="color:#9CA3AF;text-decoration:underline;">Se désabonner</a>',
    '</td></tr>',
    '</table></body></html>'
  );

  setEmailHTML(chunks.join(""));
}, [selected, velos, signatureHTML]);



  if (!session) return <Login />;

  // 🚀 Appel à Gemini
  const compareWithGemini = async () => {
    const selectedVelos = velos.filter((v) => selected[v.URL]).slice(0, 4);
    if (selectedVelos.length < 2) {
      alert("⚠️ Sélectionne au moins 2 vélos pour comparer !");
      return;
    }
    const prompt = `
Je suis un vendeur de vélo. Compare objectivement ces ${selectedVelos.length} modèles. Passe en revue les différences majeures dans les vélos (me parle que de trucs de pro, nous sommes des vendeurs avec une grande connaissance des vélos), et lequel tu conseillerais a un client sans prendre en compte le prix ou l'état du vélo. 
${selectedVelos
  .map(
    (v, i) => `
Vélo ${i + 1} : ${v.Title}
Specs :
${Object.entries(v)
  .map(([k, val]) => `${k}: ${val}`)
  .join("\n")}
`
  )
  .join("\n\n")}
`;
    try {
      setGeminiResponse("⏳ Analyse en cours...");
      setShowGeminiModal(true);
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await resp.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        setGeminiResponse(data.candidates[0].content.parts[0].text);
      } else {
        setGeminiResponse("⚠️ Pas de réponse claire de Gemini.");
      }
    } catch (err) {
      console.error("Erreur Gemini:", err);
      setGeminiResponse("❌ Erreur lors de l’appel à Gemini.");
    }
  };
  

  /* =============================
     Rendu
  ============================= */
  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      {/* HEADER */}
      <div className="header-fixed">
        <div className="header-bar">
          <div
  className="header-left"
  style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}
>
  <img src={logoMint} alt="Logo" className="header-logo" />

  {/* Wrapper référencé pour gérer le clic hors zone */}
  <div ref={userMenuRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
    {/* Bouton menu utilisateur */}
    <button
      type="button"
      className="user-info"
      onClick={() => setUserMenuOpen((o) => !o)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 0,
      }}
      aria-haspopup="menu"
      aria-expanded={userMenuOpen}
    >
      <FaUserCircle size={22} />
      <span style={{ fontSize: "0.9em" }}>{session?.user?.email}</span>
    </button>


    {/* Menu utilisateur déroulant */}
    {userMenuOpen && (
      <div
        className="user-menu"
        role="menu"
        style={{
          position: "absolute",
          top: "40px",
          left: 0,
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: "10px",
          zIndex: 1000,
          minWidth: 260,
        }}
      >
        <button
  onClick={() => { setAlertsOpen(true); }}
  style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:"0.9em", padding:"5px 10px", textAlign:"left", width:"100%" }}
>
  🔔 Mes alertes
</button>
<button
  onClick={() => {
    setSignatureDraft(signatureHTML || buildDefaultSignature());
    setShowSignatureModal(true);
  }}
  style={{
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9em",
    padding: "5px 10px",
    textAlign: "left",
    width: "100%",
  }}
>
  ✍️ Personnaliser ma signature
</button>
        <button
          onClick={() => setShowFeedback(true)}
          role="menuitem"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9em",
            padding: "5px 10px",
            textAlign: "left",
            width: "100%",
          }}
        >
          ✍️ Signaler un bug / Suggérer une amélioration
        </button>
        

        <button
          onClick={handleLogout}
          role="menuitem"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9em",
            padding: "5px 10px",
            textAlign: "left",
            width: "100%",
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    )}
  </div>
</div>
{showSignatureModal && (
  <>
    <div className="overlay" onClick={() => setShowSignatureModal(false)} />

    <div className="modal-preview" style={{maxWidth: 980}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center", marginBottom: 10}}>
        <h2 style={{margin:0}}>Modifier ma signature</h2>
        <button className="close-btn" onClick={() => setShowSignatureModal(false)}>✖</button>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          // On récupère *depuis l'état* pour rester fidèle à l’aperçu en direct
          const newSignature = (signatureHTML || "").toString();
          const newPhoneRaw  = (personalPhone || "").toString();

          // nettoyage doux du téléphone (garde + et les chiffres)
          const normalizeTel = (s) => (s || "").replace(/[^\d+]/g, "");
          const newPhone = normalizeTel(newPhoneRaw);

          const { error } = await supabase.from("user_signatures").upsert(
            {
              user_id: session.user.id,
              signature_html: newSignature,
              personal_phone: newPhone || null,
            },
            { onConflict: "user_id" }
          );

          if (error) {
            console.error(error);
            alert("Erreur lors de l’enregistrement de la signature.");
            return;
          }

          // on confirme déjà en local (si nécessaire)
          setSignatureHTML(newSignature);
          setPersonalPhone(newPhone);
          setShowSignatureModal(false);
        }}
        className="form-vertical"
      >
        {/* Grille éditeur / aperçu */}
        <div className="signature-pane" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          {/* Colonne gauche : éditeur */}
          <div className="signature-form">
            <label style={{fontSize:12, color:"#6b7280"}}>Signature (HTML)</label>
            <textarea
              name="signature_html"
              className="signature-textarea"
              rows={14}
              value={signatureHTML || ""}
              onChange={(e) => setSignatureHTML(e.target.value)}
              placeholder="Colle ou écris ici le HTML de ta signature…"
              style={{
                width:"100%", minHeight:220, border:"1px solid #d1d5db",
                borderRadius:8, padding:10, fontFamily:"monospace", fontSize:13
              }}
            />

            {/* Téléphone perso */}
            <div style={{marginTop:12}}>
              <label style={{display:"block", marginBottom:6}}>Numéro perso (remplace le bouton “Nous appeler”)</label>
              <input
                name="personal_phone"
                inputMode="tel"
                placeholder="+33 6 12 34 56 78"
                value={personalPhone || ""}
                onChange={(e) => setPersonalPhone(e.target.value)}
                style={{
                  width:"100%", height:38, padding:"6px 10px",
                  border:"1px solid #d1d5db", borderRadius:8
                }}
              />
              <div style={{fontSize:12, color:"#6b7280", marginTop:6}}>
                Laisse vide pour utiliser le numéro par défaut (+33 4 84 98 00 28).
              </div>
            </div>

            {/* Actions éditeur */}
            <div style={{display:"flex", gap:8, marginTop:12}}>
              <button
                type="button"
                className="reset-btn"
                onClick={() => setSignatureHTML(buildDefaultSignature?.() || "")}
              >
                Réinitialiser
              </button>
              <button className="save-btn" type="submit">Enregistrer</button>
            </div>
          </div>

          {/* Colonne droite : aperçu */}
          <div className="signature-preview" style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden"}}>
            <div className="signature-preview-header" style={{padding:"10px 12px", fontWeight:600, fontSize:14, background:"#f3f4f6", borderBottom:"1px solid #e5e7eb"}}>
              Aperçu
            </div>
            <div
              className="signature-preview-body"
              style={{padding:14, minHeight:220}}
              dangerouslySetInnerHTML={{
                __html:
                  `<div style="font-family: Arial, Helvetica, sans-serif; color:#111827; line-height:1.45;">${
                    (signatureHTML && signatureHTML.trim())
                      ? signatureHTML
                      : (buildDefaultSignature?.() || "<em>(Aucune signature)</em>")
                  }</div>`
              }}
            />
          </div>
        </div>
      </form>
    </div>
  </>
)}

{/* 👉 Fenêtre modale Feedback */}
{showFeedback && (
  <>
    <div className="overlay" onClick={() => setShowFeedback(false)}></div>
    <div className="feedback-modal">
      <button className="close-btn" onClick={() => setShowFeedback(false)}>×</button>
      <h2>Donnez votre retour</h2>

      <select
        value={feedbackCategory}
        onChange={(e) => setFeedbackCategory(e.target.value)}
      >
        <option value="bug">Signaler un bug</option>
        <option value="amelioration">Suggérer une amélioration</option>
      </select>

      <textarea
        value={feedbackMessage}
        onChange={(e) => setFeedbackMessage(e.target.value)}
        placeholder="Décrivez votre idée ou le problème rencontré…"
      />

      <button
        className="save-btn"
        onClick={async () => {
          const { error } = await supabase.from("feedback").insert({
            username: session?.user?.email || "Anonyme",
            category: feedbackCategory,
            message: feedbackMessage,
            created_at: new Date(),
          });
          if (!error) {
            alert("Merci pour votre retour 🙏");
            setShowFeedback(false);
            setFeedbackMessage("");
          } else {
            alert("Erreur lors de l’envoi du feedback");
          }
        }}
      >
        Envoyer
      </button>
    </div>
  </>
)}
          <div className="header-center">
            <h1>Portail Vendeur Mint-Bikes</h1>
          </div>
          {/* ...dans .header-bar */}
<div className="header-right">
  <button
    type="button"
    className={`bell-btn ${alertsBadgeCount > 0 ? "has-unread" : ""}`}
    onClick={() => setAlertsOpen(true)}
    aria-label="Ouvrir mes alertes"
    title="Mes alertes"
  >
    <span className="bell-icon">🔔</span>
    {alertsBadgeCount > 0 && <span className="badge">{alertsBadgeCount}</span>}
  </button>

  <button
    className="theme-toggle"
    onClick={() => setDarkMode((v) => !v)}
    title={darkMode ? "Mode clair" : "Mode sombre"}
  >
    {darkMode ? "☀️" : "🌙"}
  </button>
</div>

        </div>

        {/* Filtres rapides */}
<div className="filters">
  <div className="filters-left">

    <div className="filter-block">
      <label htmlFor="titleFilter">Titre</label>
      <input
        id="titleFilter"
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
      <div className="filter-block">
      <label htmlFor="typeFilter">Type de vélo</label>
      <select
  id="typeFilter"
  value={filters.typesVelo?.[0] || ""}
  onChange={(e) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      typeVelo: val || "",
      typesVelo: val ? [val] : []
    }));
  }}
>
  <option value="">Type de vélo</option>
  {allTypes.map((t) => (
    <option key={t} value={t}>{t}</option>
  ))}
</select>
    </div>

    <div className="filter-block">
      <label htmlFor="categorieFilter">Catégorie</label>
      <select
  value={filters.categories[0] || ""}
  onChange={(e) =>
    setFilters({
      ...filters,
      categories: e.target.value ? [e.target.value] : [],
    })
  }
>
  <option value="">Toutes</option>
  {allCategories.map((c) => (
    <option key={c} value={c}>{c}</option>
  ))}
</select>
    </div>

    <div className="filter-block">
      <label htmlFor="sizeFilter">Taille cycliste (cm)</label>
      <input
        id="sizeFilter"
        type="number"
        placeholder="ex: 178"
        value={filters.tailleCycliste}
        onChange={(e) => setFilters({ ...filters, tailleCycliste: e.target.value })}
      />
    </div>

    <div className="filter-block price-filter">
      <label>Prix (€)</label>
      <div className="slider-wrap">
        <Slider
          range
          min={0}
          max={10000}
          step={100}
          value={[filters.prixMin, filters.prixMax]}
          onChange={(values) =>
            setFilters({ ...filters, prixMin: values[0], prixMax: values[1] })
          }
          trackStyle={[{ backgroundColor: "#2ca76a" }]}
          handleStyle={[
            { borderColor: "#2ca76a", backgroundColor: "#fff" },
            { borderColor: "#2ca76a", backgroundColor: "#fff" },
          ]}
        />
        <div className="slider-values">
          <span>{formatPrice(filters.prixMin)}</span>
          <span>{formatPrice(filters.prixMax)}</span>
        </div>
      </div>
    </div>

    <div className="filter-block">
      <label>Options</label>
      <button
        className="advanced-btn"
        onClick={() => setShowAdvancedFilters(true)}
      >
        ⚙️ Filtres avancés
      </button>
    </div>
    <button
      onClick={() => setFilters(defaultFilters)}
      className="icon-btn"
      title="Réinitialiser les filtres"
    >
      <FaTrash />
    </button>
  </div>
</div>

        {/* Actions + Compteur + Vue/Tri */}
<div
  className="actions-and-filters"
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  }}
>
  {/* Actions */}
  <div
    className="actions"
    style={{ display: "flex", alignItems: "center", gap: 10 }}
  >
    <span>
      <strong>{selectedCount}</strong> vélo(s) sélectionné(s)
    </span>
    <button
      onClick={resetSelection}
      className="icon-btn"
      title="Réinitialiser la sélection"
      disabled={selectedCount === 0}
    >
      <FaSyncAlt />
    </button>
    <button
      onClick={() => setShowPreview(true)}
      className="icon-btn"
      title="Prévisualiser le mail"
      disabled={selectedCount === 0}
    >
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
  </div>

  {/* Compteur au centre */}
  <div className="velo-counter">
  <span className="velo-count">{filteredAndSortedVelos.length}</span>
  <span className="velo-separator"> / </span>
  <span className="velo-total">{velos.length}</span>
  <span className="velo-label">  Vélos</span>
</div>

  {/* Vue + Tri */}
  <div
    className="filters-right"
    style={{ display: "flex", alignItems: "center", gap: 20 }}
  >
    {/* Vue */}
    <div className="view-buttons">
      <button
        type="button"
        className={viewMode === "grid" ? "active" : ""}
        onClick={() => setViewMode("grid")}
        title="Vue grille"
      >
        Grille
      </button>
      <button
        type="button"
        className={viewMode === "list" ? "active" : ""}
        onClick={() => setViewMode("list")}
        title="Vue liste"
      >
        Liste
      </button>
    </div>

    {/* Tri */}
    <div className="sort-row">
      <select
        value={sortConfig.key || ""}
        onChange={(e) => {
          const key = e.target.value;
          setSortConfig(
            key ? { key, direction: "asc" } : { key: null, direction: "asc" }
          );
        }}
      >
        <option value="">Trier par</option>
        <option value="Title">Titre</option>
        <option value="Année">Année</option>
        <option value="Prix réduit">Prix</option>
        <option value="Published At">Date de publication</option>
      </select>
      <button
        type="button"
        onClick={() =>
          setSortConfig((prev) =>
            prev.key
              ? {
                  ...prev,
                  direction: prev.direction === "asc" ? "desc" : "asc",
                }
              : prev
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
{/* CONTENU */}
      <div className={`content-layout ${selectedVelo ? "with-details" : ""}`}>
        <div className="content-scroll">
          {viewMode === "grid" && (
            <div className="grid-container">
              {filteredAndSortedVelos.map((v) => (
                <div key={v.URL} className={`velo-card ${selected[v.URL] ? "selected" : ""}`} onClick={() => setSelectedVelo(v)}>
                  <div className="image-wrapper">
                    {v["Image 1"] && <img src={v["Image 1"]} alt="Vélo" className="velo-image" />}
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
                  <div className="title">
                    <strong>{v.Title}</strong>
                  </div>
                  {renderPriceBox(v)}
                  <div className="infos-secondaires">
                    <strong>Année:</strong> {v.Année || "N/A"}
                    <br />
                    <strong>Tailles :</strong> {formatSizeVariants(v)}
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
                      <input type="checkbox" checked={!!selected[v.URL]} onChange={() => toggleSelect(v.URL)} />
                    </td>
                    <td>{v.Title}</td>
                    <td>{v["Type de vélo"] || "N/A"}</td>
                    <td>{v["Catégorie"] || "N/A"}</td>
                    <td>{v.Année || "N/A"}</td>
                    <td>{v["Prix réduit"] ? `${v["Prix réduit"]} ` : "N/A"}</td>
                    <td>{v.Kilométrage || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedVelo && (
          <div className="velo-details">
            <button className="close-btn" onClick={() => setSelectedVelo(null)}>
              X
            </button>
            <h2>{selectedVelo.Title}</h2>

            {/* Galerie avancée */}
            {(() => {
              const images = Array.from({ length: 26 }, (_, i) => selectedVelo[`Image ${i + 1}`]).filter(Boolean);
              if (images.length === 0) return null;
              return (
                <div className="gallery-advanced">
                  <div className="gallery-main">
  <button className="nav-btn left" onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : images.length - 1)}>‹</button>

  <img
    src={imagesForSelected[currentImageIndex]}
    alt="Vélo"
    className="gallery-main-img"
    onClick={() => openGalleryAt(currentImageIndex)}
    style={{ cursor: "zoom-in" }}
  />

  <button className="nav-btn right" onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}>›</button>
  </div>

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

            <div className="price-and-link">
              {renderPriceBox(selectedVelo)}
              {/* Indicateurs clés */}
  <div className="velo-highlights-inline">
  <div className="highlight stock-highlight">
    <span role="img" aria-label="stock">📦</span>
    {selectedVelo["Total Inventory Qty"] || 0}

    {(() => {
      const detail = formatVariantStockInline(selectedVelo);
      if (!detail) return null;
      return (
        <div className="stock-tooltip">
          {detail}
        </div>
      );
    })()}
  </div>

  <div className="highlight" data-tooltip="Jours depuis publication">
    <span role="img" aria-label="jours">📅</span>
    {getDaysSincePublication(selectedVelo["Published At"])} j
  </div>
</div>
              {selectedVelo.URL && (
                <a href={selectedVelo.URL} target="_blank" rel="noreferrer" className="btn-link">
                  Voir le vélo
                </a>
              )}
            </div>
            {/* 👇 Bloc horizontal Intérêts + Notes */}
<div className="velo-extras">
  {/* Intérêts */}
  {selectedVelo?.URL && (
    <div className="interest-widget">
      <div className="interest-left">
        <span className="interest-icon" title="Prospects sur ce vélo">
          <FaUser />
        </span>
        <span className="interest-count">
          {Object.values(interests).reduce((a, b) => a + Number(b || 0), 0)}
        </span>

        {/* Liste flottante au survol de l'icône */}
        <div className="interest-tooltip">
          <div className="interest-tooltip-title">Prospects par vendeur</div>
          {Object.keys(interests).length === 0 ? (
            <div className="interest-tooltip-empty">Aucun intérêt pour l’instant</div>
          ) : (
            <ul className="interest-tooltip-list">
              {Object.entries(interests).map(([vendor, count]) => (
                <li key={vendor}>
                  <strong>{vendor}</strong> — {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="interest-controls">
        <button
          type="button"
          className="interest-btn"
          onClick={(e) => {
            e.stopPropagation();
            addInterest(selectedVelo.URL);
          }}
          title="+1 client intéressé"
        >
          +
        </button>
        <button
          type="button"
          className="interest-btn"
          onClick={(e) => {
            e.stopPropagation();
            removeInterest(selectedVelo.URL);
          }}
          title="-1 client intéressé"
        >
          −
        </button>
      </div>
    </div>
  )}

  {/* Notes */}
  <div className="notes-widget">
    <button className="notes-btn" onClick={() => setIsNotesOpen(true)}>
  {noteCount > 0 ? `📝Notes (${noteCount})` : "📝Notes"}
</button>
  </div>
</div>


{/* Fenêtre flottante (modal notes) */}
{isNotesOpen && (
  <>
    <div className="overlay" onClick={() => setIsNotesOpen(false)}></div>
    <div className="notes-modal">
      <button className="close-btn" onClick={() => setIsNotesOpen(false)}>×</button>
      <h2>Notes pour ce vélo</h2>

      {/* Zone de texte pour l’utilisateur courant */}
      <textarea
        value={notes[currentUserName] || ""}
        onChange={(e) => {
          const updated = { ...notes, [currentUserName]: e.target.value };
          setNotes(updated);
        }}
        placeholder="Écris ta note ici…"
      />

      <div className="notes-actions">
        <button
          className="save-btn"
          onClick={() => saveNote(selectedVelo.URL, notes[currentUserName] || "")}
        >
          Sauvegarder ma note
        </button>
      </div>

      {/* Liste des autres vendeurs */}
      <div className="notes-list">
        <h3>Notes des autres vendeurs</h3>
        {Object.entries(notes)
          .filter(([user]) => user !== currentUserName)
          .map(([user, text]) => (
            <div key={user} className="note-item">
              <strong>{user}</strong>
              <p>{text}</p>
            </div>
          ))}
      </div>
    </div>
  </>
)}

        
    <div className="details-grid">
  {Object.entries(fieldGroups).map(([groupName, fields]) => {
    const isInfos = groupName === "Infos générales";
    // On retire l'ancien champ pour éviter le doublon
    const fieldsToShow = isInfos
      ? fields.filter((f) => f !== "Taille du cadre")
      : fields;

    const rangesStr = isInfos ? formatVariantSizeRanges(selectedVelo) : null;

    return (
      <div key={groupName} className="detail-group">
        <h3>{groupName}</h3>
        <table className="detail-table">
          <tbody>
            {fieldsToShow.map((field) => (
              <tr key={field}>
                <td><strong>{fieldLabels[field] || field}</strong></td>
                <td>{selectedVelo[field] || "N/A"}</td>
              </tr>
            ))}

            {/* On ajoute UNE SEULE fois ces deux lignes, dans "Infos générales" */}
            {isInfos && (
              <>
                <tr>
                  <td><strong>Tailles de Cadre</strong></td>
                  <td>{formatFrameSizes(selectedVelo)}</td>
                </tr>

                {rangesStr && (
                  <tr>
                    <td><strong>Tailles Recommandées</strong></td>
                    <td>{rangesStr}</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  })}
</div>


          </div>
        )}
      </div>

      {/* PREVIEW EMAIL */}
      {showPreview && (
        <>
          <div className="overlay" onClick={() => setShowPreview(false)}></div>
          <div className="modal-preview" style={{ maxWidth: "900px", width: "90%", textAlign: "center", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h2 style={{ margin: 0 }}>Prévisualisation du mail</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    const iframe = document.getElementById("email-preview-iframe");
                    if (iframe && iframe.contentWindow) {
                      const iframeDoc = iframe.contentWindow.document;
                      const range = iframeDoc.createRange();
                      range.selectNodeContents(iframeDoc.body);
                      const selection = iframeDoc.getSelection();
                      selection.removeAllRanges();
                      selection.addRange(range);
                      try {
                        const success = iframeDoc.execCommand("copy");
                        alert(success ? "✅ Contenu copié !" : "❌ Impossible de copier automatiquement. Fais Ctrl+C.");
                      } catch {
                        alert("❌ Erreur de copie. Sélectionne et copie manuellement.");
                      }
                      selection.removeAllRanges();
                    }
                  }}
                  style={{ padding: "6px 10px", background: "#2ca76a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  📋 Copier
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{ padding: "6px 10px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  ✖ Fermer
                </button>
              </div>
            </div>
            <p style={{ fontStyle: "italic", color: "#d35400" }}>⚠️ Contenu généré automatiquement — vérifie avant envoi</p>
            <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
              <iframe
                id="email-preview-iframe"
                title="Email Preview"
                style={{ width: "100%", maxWidth: "800px", height: "600px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff" }}
                srcDoc={emailHTML}
              />
            </div>
          </div>
        </>
      )}

      {/* COMPARATEUR */}
      {showCompare && (
        <>
          <div className="overlay" onClick={() => setShowCompare(false)}></div>
          <div className="modal-preview">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, flex: 1, textAlign: "left" }}>Comparateur de vélos</h2>
              <div style={{ flex: 1, textAlign: "center" }}>
                <button
                  onClick={() => {
                    compareWithGemini();
                    setShowGeminiModal(true);
                  }}
                  style={{ background: "#2c3e50", color: "#fff", padding: "8px 14px", borderRadius: "6px", cursor: "pointer" }}
                >
                  ⚡ Analyse IA (Gemini)
                </button>
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <button className="close-btn" onClick={() => setShowCompare(false)}>
                  ✖
                </button>
              </div>
            </div>

            {velos.filter((v) => selected[v.URL]).length > 0 ? (
              <>
                <div className="compare-table-wrapper">
                  <table className="compare-table dynamic">
                    <thead>
                      <tr>
                        <th>Vélos</th>
                        {velos
                          .filter((v) => selected[v.URL])
                          .slice(0, 4)
                          .map((v) => (
                            <th key={v.URL} style={{ textAlign: "center" }}>
                              {v["Image 1"] && (
                                <img src={v["Image 1"]} alt="Vélo" style={{ width: 100, height: 80, objectFit: "contain", marginBottom: 6 }} />
                              )}
                              <div style={{ fontWeight: "bold" }}>{v.Title}</div>
                              <div style={{ fontWeight: "bold", color: "red" }}>{v["Prix réduit"] ? `${v["Prix réduit"]} ` : "Prix N/A"}</div>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fieldGroups).map(([groupName, fields]) => (
                        <React.Fragment key={groupName}>
                          <tr>
                            <td colSpan={5} style={{ fontWeight: "bold", textAlign: "center", background: "#333", color: "#fff" }}>
                              {groupName}
                            </td>
                          </tr>
                          {fields.map((field) => (
                            <tr key={field}>
                              <td>
                                <strong>{fieldLabels[field] || field}</strong>
                              </td>
                              {velos
                                .filter((v) => selected[v.URL])
                                .slice(0, 4)
                                .map((v) => (
                                  <td key={v.URL + field}>{v[field] !== undefined ? String(v[field]) : "N/A"}</td>
                                ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>Aucun vélo sélectionné pour comparaison.</p>
            )}
          </div>
        </>
      )}

      {/* MODALE GEMINI */}
      {showGeminiModal && (
        <>
          <div className="overlay" onClick={() => setShowGeminiModal(false)}></div>
          <div className="modal-preview">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Analyse IA des vélos</h2>
              <button className="close-btn" onClick={() => setShowGeminiModal(false)}>
                ✖
              </button>
            </div>
            <div
              className="gemini-response"
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                textAlign: "left",
                padding: "10px",
                background: "var(--bg-card, #fff)",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            >
              {geminiResponse ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: geminiResponse
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/^- (.*$)/gim, "<li>$1</li>")
                      .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                "En attente de la réponse..."
              )}
            </div>
          </div>
        </>
      )}

      {/* MODALE GALERIE */}
      <GalleryModal
  isOpen={showGalleryModal}
  images={imagesForSelected}
  index={modalImageIndex}
  onClose={closeGallery}
  onPrev={prevImage}
  onNext={nextImage}
/>



      {/* DRAWER FILTRES AVANCÉS */}
{showAdvancedFilters && (
  <>
    <div className="overlay" onClick={() => setShowAdvancedFilters(false)}></div>
    <div className="advanced-filters-drawer open">
      <div className="drawer-header">
        <button
          className="close-btn"
          onClick={() => setShowAdvancedFilters(false)}
        >
          X
        </button>
        <h2>Filtres avancés</h2>
      </div>

      {/* Contenu scrollable */}
      <div className="advanced-filters-drawer-content">

        {/* === Infos générales === */}
        <div className="advanced-group group-infos">
          <h3>Infos générales</h3>
          <div className="advanced-grid">

            {/* Nom */}
            <div className="filter-adv-item">
              <label>Nom</label>
              <input
                type="text"
                value={filters.title || ""}
                onChange={(e) =>
                  setFilters({ ...filters, title: e.target.value })
                }
                placeholder="Commence à taper…"
              />
            </div>

            {/* Type de vélo */}
            <MultiSelect
  key="Type de vélo"
  label="Type de vélo"
  options={getOptionsFor("Type de vélo")}
  values={filters.typesVelo || []}
  onChange={(vals) =>
    setFilters((prev) => ({
      ...prev,
      typesVelo: vals,
      typeVelo: vals?.[0] || ""
    }))
  }
/>

            {/* Catégorie */}
            <MultiSelect
              key="Catégorie"
              label="Catégorie"
              options={getOptionsFor("Catégorie")}
              values={filters.categories || []}
              onChange={(vals) => setFilters({ ...filters, categories: vals })}
            />

            {/* Taille cycliste */}
            <div className="filter-adv-item">
              <label>Taille cycliste (cm)</label>
              <input
                type="number"
                value={filters.tailleCycliste || ""}
                onChange={(e) =>
                  setFilters({ ...filters, tailleCycliste: e.target.value })
                }
                placeholder="ex: 178"
              />
            </div>

            {/* Prix */}
            <div className="filter-block" style={{ minWidth: "240px" }}>
              <label>Prix (€)</label>
              <div style={{ padding: "0 10px" }}>
                <Slider
                  range
                  min={0}
                  max={10000}
                  step={100}
                  value={[filters.prixMin, filters.prixMax]}
                  onChange={(values) =>
                    setFilters({
                      ...filters,
                      prixMin: values[0],
                      prixMax: values[1],
                    })
                  }
                  trackStyle={[{ backgroundColor: "#2ca76a" }]}
                  handleStyle={[
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                  ]}
                />
                <div className="slider-values">
                  <span>{filters.prixMin} €</span>
                  <span>{filters.prixMax} €</span>
                </div>
              </div>
            </div>

            {/* Année */}
            {numericFields["Année"] && (
              <div className="filter-block" style={{ minWidth: "240px" }}>
                <label>Année</label>
                <div style={{ padding: "0 10px" }}>
                  <Slider
                    range
                    min={numericFields["Année"].min}
                    max={numericFields["Année"].max}
                    step={1}
                    value={[
                      filters.anneeMin ?? numericFields["Année"].min,
                      filters.anneeMax ?? numericFields["Année"].max,
                    ]}
                    onChange={(values) =>
                      setFilters({
                        ...filters,
                        anneeMin: values[0],
                        anneeMax: values[1],
                      })
                    }
                    trackStyle={[{ backgroundColor: "#2ca76a" }]}
                    handleStyle={[
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    ]}
                  />
                  <div className="slider-values">
                    <span>
                      {filters.anneeMin ?? numericFields["Année"].min}
                    </span>
                    <span>
                      {filters.anneeMax ?? numericFields["Année"].max}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Poids */}
            {numericFields["Poids du vélo"] && (
              <div className="filter-block" style={{ minWidth: "240px" }}>
                <label>Poids du vélo (kg)</label>
                <div style={{ padding: "0 10px" }}>
                  <Slider
                    range
                    min={numericFields["Poids du vélo"].min}
                    max={numericFields["Poids du vélo"].max}
                    step={0.5}
                    value={[
                      filters.poidsMin ?? numericFields["Poids du vélo"].min,
                      filters.poidsMax ?? numericFields["Poids du vélo"].max,
                    ]}
                    onChange={(values) =>
                      setFilters({
                        ...filters,
                        poidsMin: values[0],
                        poidsMax: values[1],
                      })
                    }
                    trackStyle={[{ backgroundColor: "#2ca76a" }]}
                    handleStyle={[
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    ]}
                  />
                  <div className="slider-values">
                    <span>
                      {filters.poidsMin ?? numericFields["Poids du vélo"].min}{" "}
                      kg
                    </span>
                    <span>
                      {filters.poidsMax ?? numericFields["Poids du vélo"].max}{" "}
                      kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === Transmission === */}
        <div className="advanced-group group-transmission">
          <h3>Transmission</h3>
          <div className="advanced-grid">
            <MultiSelect
              key="Transmission"
              label="Transmission"
              options={getOptionsFor("Transmission")}
              values={filters.transmission || []}
              onChange={(vals) =>
                setFilters({ ...filters, transmission: vals })
              }
            />
            <MultiSelect
              key="Nb de plateaux"
              label="Nombre de plateaux"
              options={getOptionsFor("Nb de plateaux")}
              values={filters.nbPlateaux || []}
              onChange={(vals) => setFilters({ ...filters, nbPlateaux: vals })}
            />
            <MultiSelect
              key="Denture plateaux"
              label="Denture plateaux"
              options={getOptionsFor("Denture plateaux")}
              values={filters.denturePlateaux || []}
              onChange={(vals) =>
                setFilters({ ...filters, denturePlateaux: vals })
              }
            />

            {/* Nb vitesses */}
            {numericFields["Nb de vitesses"] && (
              <div className="filter-block" style={{ minWidth: "240px" }}>
                <label>Nombre de vitesses</label>
                <div style={{ padding: "0 10px" }}>
                  <Slider
                    range
                    min={numericFields["Nb de vitesses"].min}
                    max={numericFields["Nb de vitesses"].max}
                    step={1}
                    value={[
                      filters.nbVitessesMin ??
                        numericFields["Nb de vitesses"].min,
                      filters.nbVitessesMax ??
                        numericFields["Nb de vitesses"].max,
                    ]}
                    onChange={(values) =>
                      setFilters({
                        ...filters,
                        nbVitessesMin: values[0],
                        nbVitessesMax: values[1],
                      })
                    }
                    trackStyle={[{ backgroundColor: "#2ca76a" }]}
                    handleStyle={[
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    ]}
                  />
                  <div className="slider-values">
                    <span>
                      {filters.nbVitessesMin ??
                        numericFields["Nb de vitesses"].min}
                    </span>
                    <span>
                      {filters.nbVitessesMax ??
                        numericFields["Nb de vitesses"].max}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <MultiSelect
              key="Denture cassette"
              label="Denture cassette"
              options={getOptionsFor("Denture cassette")}
              values={filters.dentureCassette || []}
              onChange={(vals) =>
                setFilters({ ...filters, dentureCassette: vals })
              }
            />
          </div>
        </div>

        {/* === VAE === */}
        <div className="advanced-group group-vae">
          <h3>Électrique (VAE)</h3>
          <div className="advanced-grid">
            <MultiSelect
              key="Marque moteur"
              label="Marque moteur"
              options={getOptionsFor("Marque moteur")}
              values={filters.marqueMoteur || []}
              onChange={(vals) =>
                setFilters({ ...filters, marqueMoteur: vals })
              }
            />
            <MultiSelect
              key="Modèle moteur"
              label="Modèle moteur"
              options={getOptionsFor("Modèle moteur")}
              values={filters.modelesMoteur || []}
              onChange={(vals) =>
                setFilters({ ...filters, modelesMoteur: vals })
              }
            />
            {/* Slider puissance moteur */}
            <div className="filter-block" style={{ minWidth: "240px" }}>
              <label>Puissance moteur (Nm)</label>
              <div style={{ padding: "0 10px" }}>
                <Slider
                  range
                  min={0}
                  max={200}
                  step={5}
                  value={[
                    filters.puissanceMoteurMin ?? 0,
                    filters.puissanceMoteurMax ?? 200,
                  ]}
                  onChange={(values) =>
                    setFilters({
                      ...filters,
                      puissanceMoteurMin: values[0],
                      puissanceMoteurMax: values[1],
                    })
                  }
                  trackStyle={[{ backgroundColor: "#2ca76a" }]}
                  handleStyle={[
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                  ]}
                />
                <div className="slider-values">
                  <span>{filters.puissanceMoteurMin ?? 0} Nm</span>
                  <span>{filters.puissanceMoteurMax ?? 200} Nm</span>
                </div>
              </div>
            </div>

            <MultiSelect
              key="Marque batterie"
              label="Marque batterie"
              options={getOptionsFor("Marque batterie")}
              values={filters.marqueBatterie || []}
              onChange={(vals) =>
                setFilters({ ...filters, marqueBatterie: vals })
              }
            />
            <MultiSelect
              key="Modèle batterie"
              label="Modèle batterie"
              options={getOptionsFor("Modèle batterie")}
              values={filters.modelesBatterie || []}
              onChange={(vals) =>
                setFilters({ ...filters, modelesBatterie: vals })
              }
            />
            {/* Slider batterie */}
            <div className="filter-block" style={{ minWidth: "240px" }}>
              <label>Capacité batterie (Wh)</label>
              <div style={{ padding: "0 10px" }}>
                <Slider
                  range
                  min={0}
                  max={1250}
                  step={50}
                  value={[
                    filters.puissanceBatterieMin ?? 0,
                    filters.puissanceBatterieMax ?? 1250,
                  ]}
                  onChange={(values) =>
                    setFilters({
                      ...filters,
                      puissanceBatterieMin: values[0],
                      puissanceBatterieMax: values[1],
                    })
                  }
                  trackStyle={[{ backgroundColor: "#2ca76a" }]}
                  handleStyle={[
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                  ]}
                />
                <div className="slider-values">
                  <span>{filters.puissanceBatterieMin ?? 0} Wh</span>
                  <span>{filters.puissanceBatterieMax ?? 1250} Wh</span>
                </div>
              </div>
            </div>

            {/* Slider km */}
            <div className="filter-block" style={{ minWidth: "240px" }}>
              <label>Kilométrage max</label>
              <div style={{ padding: "0 10px" }}>
                <Slider
                  min={0}
                  max={40000}
                  step={50}
                  value={filters.kilometrageMax ?? 40000}
                  onChange={(val) =>
                    setFilters({ ...filters, kilometrageMax: val })
                  }
                  trackStyle={[{ backgroundColor: "#2ca76a" }]}
                  handleStyle={[
                    { borderColor: "#2ca76a", backgroundColor: "#fff" },
                  ]}
                />
                <div className="slider-values">
                  {filters.kilometrageMax ?? 40000} km
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Cadre & Suspension === */}
        <div className="advanced-group group-cadre">
          <h3>Cadre & Suspension</h3>
          <div className="advanced-grid">
            <MultiSelect
              key="Matériau cadre"
              label="Matériau cadre"
              options={getOptionsFor("Matériau cadre")}
              values={filters.materiauxCadre || []}
              onChange={(vals) =>
                setFilters({ ...filters, materiauxCadre: vals })
              }
            />
            <MultiSelect
              key="Marque fourche"
              label="Marque fourche"
              options={getOptionsFor("Marque fourche")}
              values={filters.marqueFourche || []}
              onChange={(vals) =>
                setFilters({ ...filters, marqueFourche: vals })
              }
            />
            <MultiSelect
              key="Modèle fourche"
              label="Modèle fourche"
              options={getOptionsFor("Modèle fourche")}
              values={filters.modeleFourche || []}
              onChange={(vals) =>
                setFilters({ ...filters, modeleFourche: vals })
              }
            />
            
            

            {/* Débattement fourche */}
            {numericFields["Débattement fourche"] && (
              <div className="filter-block" style={{ minWidth: "240px" }}>
                <label>Débattement fourche (mm)</label>
                <div style={{ padding: "0 10px" }}>
                  <Slider
                    range
                    min={numericFields["Débattement fourche"].min}
                    max={numericFields["Débattement fourche"].max}
                    step={1}
                    value={[
                      filters.debattementFourcheMin ??
                        numericFields["Débattement fourche"].min,
                      filters.debattementFourcheMax ??
                        numericFields["Débattement fourche"].max,
                    ]}
                    onChange={(values) =>
                      setFilters({
                        ...filters,
                        debattementFourcheMin: values[0],
                        debattementFourcheMax: values[1],
                      })
                    }
                    trackStyle={[{ backgroundColor: "#2ca76a" }]}
                    handleStyle={[
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    ]}
                  />
                  <div className="slider-values">
                    <span>
                      {filters.debattementFourcheMin ??
                        numericFields["Débattement fourche"].min}
                    </span>
                    <span>
                      {filters.debattementFourcheMax ??
                        numericFields["Débattement fourche"].max}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <MultiSelect
              key="Amortisseur"
              label="Amortisseur"
              options={getOptionsFor("Amortisseur")}
              values={filters.amortisseurs || []}
              onChange={(vals) =>
                setFilters({ ...filters, amortisseurs: vals })
              }
            />

            {/* Débattement amortisseur */}
            {numericFields["Débattement amortisseur"] && (
              <div className="filter-block" style={{ minWidth: "240px" }}>
                <label>Débattement amortisseur (mm)</label>
                <div style={{ padding: "0 10px" }}>
                  <Slider
                    range
                    min={numericFields["Débattement amortisseur"].min}
                    max={numericFields["Débattement amortisseur"].max}
                    step={1}
                    value={[
                      filters.debattementAmortisseurMin ??
                        numericFields["Débattement amortisseur"].min,
                      filters.debattementAmortisseurMax ??
                        numericFields["Débattement amortisseur"].max,
                    ]}
                    onChange={(values) =>
                      setFilters({
                        ...filters,
                        debattementAmortisseurMin: values[0],
                        debattementAmortisseurMax: values[1],
                      })
                    }
                    trackStyle={[{ backgroundColor: "#2ca76a" }]}
                    handleStyle={[
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                      { borderColor: "#2ca76a", backgroundColor: "#fff" },
                    ]}
                  />
                  <div className="slider-values">
                    <span>
                      {filters.debattementAmortisseurMin ??
                        numericFields["Débattement amortisseur"].min}
                    </span>
                    <span>
                      {filters.debattementAmortisseurMax ??
                        numericFields["Débattement amortisseur"].max}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === Roues & Pneus === */}
        <div className="advanced-group group-roues">
          <h3>Roues & Pneus</h3>
          <div className="advanced-grid">
            <MultiSelect
              key="Type de pneus"
              label="Type de pneus"
              options={getOptionsFor("Type de pneus")}
              values={filters.typesPneus || []}
              onChange={(vals) =>
                setFilters({ ...filters, typesPneus: vals })
              }
            />
            <MultiSelect
              key="Taille des roues"
              label="Taille des roues"
              options={getOptionsFor("Taille des roues")}
              values={filters.tailleRoues || []}
              onChange={(vals) =>
                setFilters({ ...filters, tailleRoues: vals })
              }
            />
            <MultiSelect
              key="Matériau roue avant"
              label="Matériau roue avant"
              options={getOptionsFor("Matériau roue avant")}
              values={filters.materiauRoueAvant || []}
              onChange={(vals) =>
                setFilters({ ...filters, materiauRoueAvant: vals })
              }
            />
            <MultiSelect
              key="Matériau roue arrière"
              label="Matériau roue arrière"
              options={getOptionsFor("Matériau roue arrière")}
              values={filters.materiauRoueArriere || []}
              onChange={(vals) =>
                setFilters({ ...filters, materiauRoueArriere: vals })
              }
            />
          </div>
        </div>

        {/* === Freinage & Poste de pilotage === */}
        <div className="advanced-group group-freinage">
          <h3>Freinage & Poste de pilotage</h3>
          <div className="advanced-grid">
            <MultiSelect
              key="Type de freins"
              label="Type de freins"
              options={getOptionsFor("Type de freins")}
              values={filters.typesFreins || []}
              onChange={(vals) =>
                setFilters({ ...filters, typesFreins: vals })
              }
            />
            <MultiSelect
              key="Type tige de selle"
              label="Type tige de selle"
              options={getOptionsFor("Type tige de selle")}
              values={filters.typesTigeSelle || []}
              onChange={(vals) =>
                setFilters({ ...filters, typesTigeSelle: vals })
              }
            />
          </div>
        </div>
      </div>

      {/* Footer fixe */}
<div className="drawer-footer">
  <button className="cancel-btn" onClick={() => setShowAdvancedFilters(false)}>
    Fermer
  </button>
  <button className="add-alert-btn" onClick={() => setFilters(defaultFilters)}>
    Réinitialiser tous les filtres
  </button>
  <button
  className="save-alert-btn"
  onClick={() => setShowSaveAlert(true)}
>
  Sauvegarder une alerte
</button>

</div>
    </div>
  </>
)}

{showSaveAlert && (
  <>
    <div className="overlay" onClick={() => setShowSaveAlert(false)} />
    <div className="modal-preview">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2>Nouvelle alerte</h2>
        <button className="close-btn" onClick={() => setShowSaveAlert(false)}>✖</button>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const payload = {
            title: fd.get("title"),
            client_name: fd.get("client_name") || null,
            client_phone: fd.get("client_phone") || null,
            client_email: fd.get("client_email") || null,
            date_field: fd.get("date_field"),          // 'Published At' ou 'Updated At'
            since: fd.get("since"),                    // ex '2025-01-01'
          };

          // On prépare les filtres à sauver (copie exacte de l’état actuel)
          const filtersToSave = { ...filters };
          if (payload.date_field === "Published At") {
            filtersToSave.publishedAfter = payload.since;
            filtersToSave.updatedAfter = undefined;
          } else {
            filtersToSave.updatedAfter = payload.since;
            filtersToSave.publishedAfter = undefined;
          }

          const { error } = await supabase.from("alerts").insert([{
            user_id: session.user.id,
            title: payload.title,
            client_name: payload.client_name,
            client_phone: payload.client_phone,
            client_email: payload.client_email,
            date_field: payload.date_field,
            since: payload.since,
            filters: filtersToSave
          }]);

          if (error) {
            console.error(error);
            // ici affiche un petit toast/inline error si tu veux
            return;
          }
          setShowSaveAlert(false);
          fetchAlerts();  // ← ajoute cette ligne
        }}
        className="form-vertical"
      >
        <label>Nom de l’alerte</label>
        <input name="title" placeholder="Ex: Pierre – VTT Trail" required />

        

        <div className="row-2">
          <div>
            <label>Champ date</label>
            <select name="date_field" defaultValue="Published At">
              <option>Published At</option>
              <option>Updated At</option>
            </select>
          </div>
          <div>
            <label>Depuis le</label>
            <input name="since" type="date" required />
          </div>
        </div>

        <div className="actions" style={{marginTop:12}}>
          <button type="button" onClick={() => setShowSaveAlert(false)}>Annuler</button>
          <button className="save-btn" type="submit">Enregistrer</button>
        </div>
      </form>
    </div>
  </>
)}

{alertsOpen && (
  <>
    <div className="overlay" onClick={() => setAlertsOpen(false)} />
    <div className="modal-preview" style={{maxWidth:900, width:"90%"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2>Mes alertes</h2>
        <button className="close-btn" onClick={() => setAlertsOpen(false)}>✖</button>
      </div>

      <table className="compare-table dynamic" style={{marginTop:10}}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Client</th>
            <th>Depuis le</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => {
            const results = applyAllFilters(velos, a.filters || {});  // réutilise ton pipeline
            return (
              <tr key={a.id}>
                <td style={{fontWeight:600}}>{a.title}</td>
                <td>
                  {a.client_name || "—"}<br/>
                  <small>{a.client_phone || ""} {a.client_email ? ` • ${a.client_email}` : ""}</small>
                </td>
                <td>{new Date(a.since).toLocaleDateString("fr-FR")}</td>
                <td>{a.is_active ? "Oui" : "Non"}</td>
                <td>
  <div style={{ display: "flex", gap: 8 }}>
    <button onClick={() => handleShowAlert(a)}>
      Afficher {results.length} vélo(s){alertsUnseenMap[a.id] ? ` · +${alertsUnseenMap[a.id]}` : ""}
    </button>
    <button
      onClick={async () => {
        const { error } = await supabase.from('alerts').delete().eq('id', a.id);
        if (!error) setAlerts(alerts.filter(x => x.id !== a.id));
      }}
    >
      Supprimer
    </button>
  </div>
</td>

              </tr>
            );
          })}
          {alerts.length === 0 && (
            <tr><td colSpan={6} style={{textAlign:"center"}}>Aucune alerte</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </>
)}


{isFeedbackOpen && (
  <>
    <div className="overlay" onClick={() => setIsFeedbackOpen(false)}></div>
    <div className="feedback-modal">
      <button className="close-btn" onClick={() => setIsFeedbackOpen(false)}>×</button>
      <h2>Votre retour</h2>

      <div className="feedback-form">
        <label>Catégorie</label>
        <select
          value={feedbackCategory}
          onChange={(e) => setFeedbackCategory(e.target.value)}
        >
          <option value="bug">🐞 Signaler un bug</option>
          <option value="amelioration">💡 Suggérer une amélioration</option>
        </select>

        <label>Message</label>
        <textarea
          rows="5"
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.target.value)}
          placeholder="Décrivez votre bug ou suggestion…"
        />

        <div className="feedback-actions">
          <button onClick={() => setIsFeedbackOpen(false)}>Annuler</button>
          <button className="save-btn" onClick={submitFeedback}>Envoyer</button>
        </div>
      </div>
    </div>
  </>
)} 
  </div>
  );
}
 
  
export default App;