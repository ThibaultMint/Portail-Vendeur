// Déplace tous les imports en haut du fichier (ESLint import/first)
import React, { useState, useEffect, useMemo, useCallback, useRef, startTransition, useDeferredValue } from "react";
import ParkingModal from "./ParkingModal";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import InventoryList from "./InventoryList";
import KPIDashboard from "./KPIDashboard";
import PriceToolModal from "./PriceToolModal";
import { 
  FaTrash, FaEnvelope, FaSyncAlt, FaBalanceScale, FaHeart, FaUser, FaUserCircle, 
  FaSms, FaPercent, FaLink, FaCheckSquare, FaFileExport 
} from "react-icons/fa";
import logoMint from "./logo mint.png";
import "./App.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { createPortal } from "react-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from "recharts";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { pointerWithin } from "@dnd-kit/core";
import { rectSortingStrategy } from "@dnd-kit/sortable";

// ====== "vide" helpers ======
const EMPTY_TOKEN = "__EMPTY__";
const EMPTY_LABEL = "— Vide —";
const isEmptyLike = (val) => {
  const s = String(val ?? "").trim();
  return !s || s.toUpperCase() === "N/A";
};

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
  "Roues & Pneus": [
    "Type de pneus",
    "Pneu avant",
    "Pneu arrière",
    "Taille des roues",
    "Roue avant",
    "Matériau roue avant",
    "Roue arrière",
    "Matériau roue arrière",
  ],
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
  "Année": { min: 2018, max: 2026, step: 1, unit: "" },
  "Poids du vélo": { min: 0, max: 40, step: 1, unit: "kg" },
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
  "Pneu avant": "pneusAvant",
  "Pneu arrière": "pneusArriere",
  "Roue avant": "rouesAvant",
  "Matériau roue avant": "materiauRoueAvant",
  "Roue arrière": "rouesArriere",
  "Matériau roue arrière": "materiauRoueArriere",
  "Modèle fourche": "modelesFourche",
  "Frein avant": "freinsAvant",
  "Frein arrière": "freinsArriere",
  "Levier de freins": "leviersFreins",
  "Type tige de selle": "typesTigeSelle",
  "Modèle moteur": "modelesMoteur",
};

// Formatte les prix en "k"
const formatPrice = (value) => {
  if (value >= 1000) return (value / 1000).toFixed(1).replace(".0", "") + "k €";
  return value + " €";
};

// Constantes pour le mode pricing
const BUYERS = [
  "",
  "Thibault",
  "François",
  "Pierre",
  "Tom",
  "Victor",
  "Hugo",
  "Gregory",
  "Autre",
];

const SELLER_TYPES = [
  "",
  "Vélociste",
  "Particulier",
  "Partenaire",
  "Fabricant",
  "Autre",
];

/** Liste à cocher déroulante réutilisable */
function MultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder = "Choisir…",
  includeEmpty = true,
  emptyLabel = EMPTY_LABEL,
}) {
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
          {includeEmpty && (
            <label className="multi-select-item" key="__empty__">
              <input
                type="checkbox"
                checked={values.includes(EMPTY_TOKEN)}
                onChange={() => toggle(EMPTY_TOKEN)}
              />
              <span>{emptyLabel}</span>
            </label>
          )}

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
const median = (arr) => {
  const a = (arr || []).filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

const bucketizeWeighted = (values, weights, bins) => {
  const out = bins.map((b) => ({ name: b.label, units: 0 }));
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const w = weights[i];
    if (!Number.isFinite(v) || !Number.isFinite(w) || w <= 0) continue;
    const idx = bins.findIndex((b) => v >= b.min && v < b.max);
    if (idx >= 0) out[idx].units += w;
  }
  return out;
};

const fmtEur = (n) => (Number.isFinite(n) ? `${Math.round(n).toLocaleString("fr-FR")} €` : "—");

// Total d'un dataset sur une clé (ex: units)
const sumKey = (arr, key) => (arr || []).reduce((s, x) => s + (Number(x?.[key]) || 0), 0);

// % arrondi
const pctOf = (value, total) => {
  const v = Number(value) || 0;
  const t = Number(total) || 0;
  return t > 0 ? Math.round((v / t) * 100) : 0;
};

// Couleur par barre (plus c'est haut, plus c'est foncé)
const barFillByValue = (value, min, max) => {
  const v = Number(value) || 0;
  const lo = Number(min) || 0;
  const hi = Number(max) || 1;
  const t = hi > lo ? (v - lo) / (hi - lo) : 0.5;
  const clamped = Math.max(0, Math.min(1, t));
  const k = 0.25 + 0.70 * clamped;
  const r = Math.round(37 * k);
  const g = Math.round(99 * k);
  const b = Math.round(235 * k);
  return `rgb(${r}, ${g}, ${b})`;
};

// Helper multi-select réutilisable (global)
const applyMulti = (list, field, selected) => {
  if (!selected || selected.length === 0) return list;

  const wantEmpty = selected.includes(EMPTY_TOKEN);
  const realValues = new Set(
    selected
      .filter((v) => v !== EMPTY_TOKEN)
      .map((s) => cleanText(s))
  );

  return list.filter((row) => {
    const raw = row?.[field];
    const empty = isEmptyLike(raw);

    if (wantEmpty && empty) return true;

    if (realValues.size > 0) {
      const val = cleanText(raw);
      if (!val) return false;
      return realValues.has(val);
    }

    return wantEmpty && empty;
  });
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

// Retire accents + normalise
const normalizeKey = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "");

// Retire accents + normalise
const stripDiacritics = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const getVariantSerialsMap = (row) => {
  const map = {};
  if (!row || typeof row !== "object") return map;

  for (const [key, val] of Object.entries(row)) {
    // normalisation : minuscule, retire accents, supprime espaces/._-
    const cleaned = stripDiacritics(String(key).toLowerCase()).replace(/[\s._-]+/g, "");

    // ✅ accepte :
    // "Numéro de série variant 1" -> "numerodeserievariant1"
    // "Numéros de série variant 1" -> "numerosdeserievariant1"
    // et tolère "var" / "variant"
    const m = cleaned.match(/^numeros?deserievar(?:iant)?(\d+)$/);
    if (!m) continue;

    const idx = Number(m[1]);
    const raw = String(val ?? "").trim();
    if (!raw) continue;

    const serials = raw
      .split(/[|,;·]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (serials.length) map[idx] = serials;
  }

  return map;
};
const getFieldLoose = (row, wantedKey) => {
  if (!row || typeof row !== "object") return "";

  const target = stripDiacritics(String(wantedKey))
    .toLowerCase()
    .replace(/[\s._-]+/g, "");

  for (const k of Object.keys(row)) {
    const kk = stripDiacritics(String(k))
      .toLowerCase()
      .replace(/[\s._-]+/g, "");

    if (kk === target) return row[k];
  }
  return "";
};

// =============================
// 🔎 Helpers recherche (accents + mots dans le désordre + num de série)
// =============================

// Normalise un texte : minuscules, sans accents, ponctuation -> espaces
const normalizeSearchText = (s) =>
  stripDiacritics(String(s ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Découpe en tokens (mots) et enlève les tokens trop courts (sauf chiffres / MPE…)
const tokenizeSearch = (query) => {
  const raw = normalizeSearchText(query);
  const tokens = raw.split(/\s+/).filter(Boolean);

  return tokens.filter((t) => {
    if (t.startsWith("mpe")) return true;     // ex: MPE123...
    if (/^\d+$/.test(t)) return true;         // ex: 255684
    return t.length >= 2;                     // évite "a", "e" qui match tout
  });
};

// Récupère TOUS les numéros de série présents sur un vélo (variants + fallback)
const getAllSerialsFromRow = (row) => {
  const out = [];

  // variants "Numéro de série variant X"
  const serialsMap = getVariantSerialsMap(row); // {1:[...],2:[...]}
  for (const k of Object.keys(serialsMap || {})) {
    const arr = serialsMap[k] || [];
    for (const sn of arr) {
      const cleaned = String(sn ?? "").trim();
      if (cleaned) out.push(cleaned);
    }
  }

  // fallback éventuel (si un jour tu as une colonne simple)
  const raw =
    row?.["Numéro de série"] ||
    row?.["Numero de serie"] ||
    row?.["Serial Number"] ||
    row?.["serial_number"];

  if (raw) {
    const parts = String(raw)
      .split(/[|,;·]/)
      .map((s) => s.trim())
      .filter(Boolean);
    out.push(...parts);
  }

  // unique
  return [...new Set(out)];
};

// Construit un “gros texte” searchable (titre + champs + num de série)
const buildSearchHaystack = (v) => {
  const title = v?.Title ?? "";
  const marque = v?.["Marque"] ?? v?.Marque ?? "";
  const modele = v?.["Modèle"] ?? v?.Modele ?? "";
  const cat = v?.["Catégorie"] ?? "";
  const serials = getAllSerialsFromRow(v).join(" ");

  return normalizeSearchText([title, marque, modele, cat, serials].join(" "));
};

const isVariantInStock = (stockMap, idx) => {
  // S’il n’y a AUCUNE info de stock, on n’exclut rien.
  if (!stockMap || Object.keys(stockMap).length === 0) return true;
  const s = stockMap[idx];
  // Exclure uniquement si on sait que c’est 0
  return !(Number.isFinite(s) && s <= 0);
};
// ✅ Stock total d'un vélo (même logique que le 📦 des fiches)
const getRowTotalStock = (row) => {
  const stockMap = getVariantStockMap(row);
  const hasVariants = Object.keys(stockMap).length > 0;

  if (hasVariants) {
    return Object.values(stockMap).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  // fallback colonne globale
  return Number(row?.["Total Inventory Qty"]) || 0;
};

// ✅ Somme des stocks sur une liste de vélos (en ignorant ceux à 0)
const sumTotalStock = (rows) => {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, row) => {
    const s = getRowTotalStock(row);
    return acc + (s > 0 ? s : 0);
  }, 0);
};


// ✅ Compte le nombre de vélos uniques dispo = nb de numéros de série uniques
// qui appartiennent à au moins 1 variant avec stock > 0 (ou stock inconnu => on garde).
const countUniqueInStockSerials = (rows) => {
  const set = new Set();
  if (!Array.isArray(rows)) return 0;

  for (const row of rows) {
    const serialsMap = getVariantSerialsMap(row); // { 1: ["SN1","SN2"], 2: [...] }
    const stockMap = getVariantStockMap(row);     // { 1: 2, 2: 0, ... }

    const variantIdxs = Object.keys(serialsMap).map(Number);

    // Si on a des variants (cas normal)
    if (variantIdxs.length > 0) {
      for (const idx of variantIdxs) {
        // inclut si stock inconnu, exclut uniquement si stock=0 (selon ta logique)
        if (!isVariantInStock(stockMap, idx)) continue;

        const sns = serialsMap[idx] || [];
        for (const sn of sns) {
          const cleaned = String(sn ?? "").trim();
          if (cleaned) set.add(cleaned);
        }
      }
    } else {
      // Fallback si jamais tu as une colonne "Numéro de série" simple (au cas où)
      const raw =
        row?.["Numéro de série"] ||
        row?.["Numero de serie"] ||
        row?.["Serial Number"] ||
        row?.["serial_number"];

      if (raw) {
        const parts = String(raw)
          .split(/[|,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        for (const sn of parts) set.add(sn);
      }
    }
  }

  return set.size;
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

  // Debug temporaire
  if (parts.length === 0 && Object.keys(rangesMap).length > 0) {
    console.log("⚠️ Ranges trouvées mais aucune en stock:", row?.["Title"], { rangesMap, stockMap, allIdxs });
  }

  return parts.length ? parts.join(" / ") : null;
};
// ====== Helpers numéros de série par variante ======
const isPartnerSerial = (sn) =>
  String(sn ?? "").trim().toUpperCase().startsWith("MPE");

// Retourne une répartition UNITÉS (pondérée stock) : partenaire / sur place / inconnu
const getRowLocationSplitUnits = (row) => {
  const stockMap = getVariantStockMap(row);
  const serialsMap = getVariantSerialsMap(row);

  let partner = 0;
  let onsite = 0;
  let unknown = 0;

  const variantIdxs = Array.from(
    new Set([...Object.keys(stockMap), ...Object.keys(serialsMap)].map(Number))
  ).sort((a, b) => a - b);

  // Si aucune info de variantes, on retombe sur Total Inventory Qty (mais sans serial => inconnu)
  if (variantIdxs.length === 0) {
    const s = Number(row?.["Total Inventory Qty"]) || 0;
    return { partner: 0, onsite: 0, unknown: s > 0 ? s : 0 };
  }

  for (const idx of variantIdxs) {
    const qty = Number(stockMap?.[idx] ?? 0) || 0;
    if (qty <= 0) continue;

    const serials = (serialsMap?.[idx] || [])
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    if (serials.length === 0) {
      unknown += qty;
      continue;
    }

    const partnerCount = serials.filter(isPartnerSerial).length;
    const onsiteCount = serials.length - partnerCount;

    // Cas idéal : on a au moins autant de serials que d'unités en stock
    if (serials.length >= qty) {
      // on alloue au plus qty (si trop de serials listés)
      // ex: qty=2, serials=5 => on prend juste 2, en priorité au "réel" => on répartit proportionnellement
      const takePartner = Math.round((partnerCount / serials.length) * qty);
      const takeOnsite = qty - takePartner;
      partner += takePartner;
      onsite += takeOnsite;
    } else {
      // Cas fréquent : stock > nb serials renseignés => une partie "inconnue"
      partner += Math.min(partnerCount, qty);
      onsite += Math.min(onsiteCount, Math.max(0, qty - Math.min(partnerCount, qty)));

      const known = Math.min(serials.length, qty);
      unknown += Math.max(0, qty - known);
    }
  }

  return { partner, onsite, unknown };
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
// Bloc "Pourquoi il va vous plaire" pour l'email (petit, centré, safe Pipedrive)
const renderWhyEmail = (raw) => {
  const txt = (raw ?? "").toString().trim();
  if (!txt) return "";
  const sanitized = txt
    .replace(/<\/?[^>]+(>|$)/g, "")   // enlève HTML
    .replace(/\s+/g, " ")             // espaces propres
    .slice(0, 600);                   // sécurité

  return [
    '<div style="text-align:center;margin:6px 0 2px 0;">',
      '<span style="font-size:12px;line-height:1.4;color:#111827;"><b>Pourquoi il va vous plaire</b></span>',
    '</div>',
    '<div style="text-align:center;margin:0 0 8px 0;">',
      '<span style="font-size:12px;line-height:1.45;color:#374151;display:inline-block;max-width:360px;">',
        sanitized,
      '</span>',
    '</div>'
  ].join('');
};


// ===== Tooltip stock par variantes (compat + N° de série) =====

// petit nettoyage
const _clean = (s) => (s == null ? "" : String(s).trim());

// retire accents
const _stripDiacritics = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// --- labels {index -> "S" | "M" | "56"...} depuis "Taille cadre variant N"
const _getVariantLabelsMap = (row) => {
  const labels = {};
  if (!row || typeof row !== "object") return labels;

  for (const [key, val] of Object.entries(row)) {
    const k = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    const m =
      k.match(/^taillecadrevar(?:iant|iante)?(\d+)$/) ||
      k.match(/^taillecadrevar(\d+)$/);
    if (!m) continue;
    const idx = Number(m[1]);
    const label = _clean(val);
    if (label) labels[idx] = label;
  }
  return labels;
};

// --- stock {index -> qty} depuis "Stock variant N"
// (garde 9.0 -> 9 ; 9,0 -> 9 ; ignore 0/null)
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
    const k = String(key).toLowerCase().replace(/[\s._-]+/g, "");
    const m = k.match(/^stock(?:variant|var)?(\d+)$/);
    if (!m) continue;

    const idx = Number(m[1]);
    const qty = toInt(val);
    if (qty > 0) map[idx] = qty; // ignore 0 / null
  }
  return map;
};



// ===== Sortie texte (compat) : "S : 2 en stock\nM : 5 en stock"
const formatVariantStockInline = (row) => {
  if (!row || typeof row !== "object") return "";

  const labels = _getVariantLabelsMap(row);
  const stocks = _buildVariantStockMap(row);

  const idxs = Object.keys(stocks)
    .map(Number)
    .filter((i) => stocks[i] > 0)
    .sort((a, b) => a - b);

  const NBSP = "\u00A0";
  const lines = idxs.map((i) => {
    const label = labels[i] || `Var${i}`;
    const qty = stocks[i];
    return `${label}${NBSP}:${NBSP}${qty}${NBSP}en stock`;
  });

  return lines.join("\n");
};

// ===== Sortie HTML enrichie (avec N° de série sous chaque ligne)
const formatVariantStockHTML = (row) => {
  if (!row || typeof row !== "object") return null;

  const labels = _getVariantLabelsMap(row);
  const stocks = _buildVariantStockMap(row);
const serials = getVariantSerialsMap(row);

  const idxs = Object.keys(stocks)
    .map(Number)
    .filter((i) => stocks[i] > 0)
    .sort((a, b) => a - b);

  if (idxs.length === 0) return null;

  const blocks = idxs.map((i) => {
    const label = labels[i] || `Var ${i}`;
    const qty = stocks[i];
    const ser = serials[i] || [];

    const serialLine = ser.length
      ? `<div style="font-size:11px; opacity:.9; margin-top:2px;">N° série&nbsp;: ${ser.join(" &middot; ")}</div>`
      : "";

    return `
      <div style="margin:0 0 6px 0;">
        <div><strong>${label}</strong> : ${qty} en stock</div>
        ${serialLine}
      </div>
    `;
  });

  return `
    <div class="stock-tooltip-inner" style="text-align:left; font-size:12px; line-height:1.35;">
      ${blocks.join("")}
    </div>
  `;
};
// Affiche le kilométrage sans décimale et avec " km" collé
const formatKm = (val) => {
  const n = parseNumericValue(val); // tu l’as déjà
  if (n == null) return "N/A";
  const rounded = Math.round(n); // supprime .0/.3 etc.
  return `${rounded.toLocaleString("fr-FR")} km`;
};

const TIERS = ["A", "B", "C", "D"];
const DEFAULT_BUCKETS = ["UNASSIGNED", ...TIERS];


// ...existing code...
// (Déplace la déclaration du state et la fonction getCatMarFromRow dans le composant principal, là où sont les autres useState)
function normBrand(s) {
  if (!s) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire accents
    .replace(/[^a-zA-Z0-9]/g, "") // retire tout sauf lettres/chiffres
    .toLowerCase()
    .trim();
}

function normAll(s) {
  // Pour catégorie, type, marque
  return normBrand(s);
}

const makeTierKey = (category, bikeType, brand) =>
  `${normAll(category)}||${normAll(bikeType)}||${normAll(brand)}`;

// getCatMarFromRow doit être défini dans le composant principal pour accéder à brandTiersIndex
// Déclare simplement la signature ici, l'implémentation sera dans le composant

function uniq(arr) {
  return Array.from(new Set(arr));
}

function Pill({ brand }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 999,
        background: "#fff",
        fontSize: 13,
        cursor: "grab",
        userSelect: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {brand}
    </div>
  );
}

function SortableBrand({ id }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Pill brand={id} />
    </div>
  );
}

function Column({ title, subtitle, items, bucketKey, pctValue = 0, onPctChange }) {
  return (
    <div
      style={{
        width: "80%",
        maxWidth: 260,          // ✅ LA : encadrement moins large
        margin: "0 auto",       // ✅ centre la carte
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fafafa",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12, color: "#6b7280", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </div>
        ) : null}
        
        {/* Input % pour le tier */}
        {onPctChange && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={Math.round(pctValue * 100)}
              onChange={(e) => onPctChange(Number(e.target.value || 0) / 100)}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 6,
                border: "1px solid #d1d5db",
                padding: "0 6px",
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>%</span>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 6,
          minHeight: 180,
          padding: 8,
          borderRadius: 8,
          background: "#fff",
          border: "1px dashed #e5e7eb",
          minWidth: 0,          // ✅ idem : évite de pousser la carte
        }}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((brand) => (
              <SortableBrand key={`${bucketKey}:${brand}`} id={brand} />
            ))}
          </div>
        </SortableContext>

        {items.length === 0 ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>Dépose ici</div>
        ) : null}
      </div>
    </div>
  );
}

function BrandTierBoard({ tierPct = {}, onTierPctChange, selectedCategoryType }) {
  const TIERS = ["A", "B", "C", "D"];
  const BANK = "BANK";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const [buckets, setBuckets] = useState(() => ({
    [BANK]: [],
    A: [],
    B: [],
    C: [],
    D: [],
  }));

  // Parser selectedCategoryType pour extraire category et type
  // Format attendu: "VTT - Électrique"
  const bikeCategory = useMemo(() => {
    if (!selectedCategoryType) return null;
    const parts = selectedCategoryType.split(" - ");
    return parts[0] || null;
  }, [selectedCategoryType]);

  const bikeType = useMemo(() => {
    if (!selectedCategoryType) return null;
    const parts = selectedCategoryType.split(" - ");
    return parts[1] || null;
  }, [selectedCategoryType]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const normBrand = (s) => String(s ?? "").trim();
  const uniq = (arr) => Array.from(new Set((arr || []).map((x) => normBrand(x)).filter(Boolean)));

  const filteredBank = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buckets[BANK] || [];
    return (buckets[BANK] || []).filter((b) => b.toLowerCase().includes(q));
  }, [buckets, search]);

  function findBucketOfBrand(brand) {
    for (const k of [BANK, ...TIERS]) {
      if ((buckets[k] || []).includes(brand)) return k;
    }
    return null;
  }

  async function fetchData() {
    if (!bikeCategory || !bikeType) {
      // Ne pas charger si la catégorie n'est pas sélectionnée
      setBuckets({
        [BANK]: [],
        A: [],
        B: [],
        C: [],
        D: [],
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) Marques du stock pour la catégorie choisie
      const stockQuery = supabase
        .from("velosmint")
        .select('Marque, "Catégorie", "Type de vélo"')
        .eq("Catégorie", bikeCategory)
        .eq("Type de vélo", bikeType);

      const { data: stockRows, error: e1 } = await stockQuery;
      if (e1) throw e1;

      const brandsFromStock = uniq((stockRows || []).map((r) => normBrand(r.Marque)));

      // 2) Marques ajoutées à la main (catalog)
      const { data: catRows, error: eCat } = await supabase.from("brand_catalog").select("brand");
      if (eCat) throw eCat;

      const brandsFromCatalog = uniq((catRows || []).map((r) => normBrand(r.brand)));

      // Base = stock + catalog
      const baseBrands = uniq([...brandsFromStock, ...brandsFromCatalog]).sort((a, b) => a.localeCompare(b, "fr"));

      // 3) Règles existantes (brand_tiers) pour cette catégorie
      const { data: rules, error: e2 } = await supabase
        .from("brand_tiers")
        .select("brand,tier")
        .eq("bike_category", bikeCategory);

      if (e2) throw e2;

      const tierMap = new Map(); // brand -> tier
      (rules || []).forEach((r) => {
        const b = normBrand(r.brand);
        const t = String(r.tier || "").trim().toUpperCase();
        if (b && TIERS.includes(t)) tierMap.set(b, t);
      });

      const next = { [BANK]: [], A: [], B: [], C: [], D: [] };
      for (const b of baseBrands) {
        const t = tierMap.get(b);
        if (t && TIERS.includes(t)) next[t].push(b);
        else next[BANK].push(b);
      }

      // tri pour UX
      next[BANK].sort((a, b) => a.localeCompare(b, "fr"));
      next.A.sort((a, b) => a.localeCompare(b, "fr"));
      next.B.sort((a, b) => a.localeCompare(b, "fr"));
      next.C.sort((a, b) => a.localeCompare(b, "fr"));
      next.D.sort((a, b) => a.localeCompare(b, "fr"));

      setBuckets(next);
    } catch (err) {
      setError(err?.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bikeCategory && bikeType) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bikeCategory, bikeType]);

  async function persistTierChange(brand, toBucket) {
    setSaving(true);
    setError("");

    try {
      // La contrainte unique est sur (bike_category, brand) - sans bike_type
      if (toBucket === BANK) {
        // Déclasser = supprimer la règle
        const { error: delErr } = await supabase
          .from("brand_tiers")
          .delete()
          .eq("bike_category", bikeCategory)
          .eq("brand", brand);

        if (delErr) {
          console.error("❌ Erreur suppression brand_tiers:", delErr);
          throw delErr;
        }
      } else {
        // Déplacer vers un tier = upsert avec la bonne contrainte
        const payload = {
          bike_category: bikeCategory,
          brand,
          tier: toBucket,
          updated_at: new Date().toISOString(),
        };

        const { error: upErr } = await supabase
          .from("brand_tiers")
          .upsert(payload, { onConflict: "bike_category,brand" });

        if (upErr) {
          console.error("❌ Erreur upsert brand_tiers:", upErr);
          throw upErr;
        }
      }

      console.log(`✅ Marque "${brand}" déplacée vers ${toBucket}`);
    } catch (err) {
      console.error("❌ persistTierChange error:", err);
      setError(err?.message || "Erreur sauvegarde");
      await fetchData(); // resync en cas d'erreur
    } finally {
      setSaving(false);
    }
  }

  async function addBrandManual() {
    const b = normBrand(newBrand);
    if (!b) return;

    setSaving(true);
    setError("");

    try {
      // persiste dans le catalog (si existe déjà => ok)
      const { error: insErr } = await supabase.from("brand_catalog").upsert({ brand: b }, { onConflict: "brand" });
      if (insErr) throw insErr;

      // ajoute dans la banque en UI si absent
      setBuckets((prev) => {
        const exists = [BANK, ...TIERS].some((k) => (prev[k] || []).includes(b));
        if (exists) return prev;

        const next = { ...prev };
        next[BANK] = uniq([...(next[BANK] || []), b]).sort((x, y) => x.localeCompare(y, "fr"));
        return next;
      });

      setNewBrand("");
    } catch (err) {
      setError(err?.message || "Erreur ajout marque");
    } finally {
      setSaving(false);
    }
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const brand = active.id;
    const toBucket = over.id;
    const fromBucket = findBucketOfBrand(brand);

    if (!toBucket || !fromBucket || toBucket === fromBucket) return;
    if (![BANK, ...TIERS].includes(toBucket)) return;

    // optimistic UI
    setBuckets((prev) => {
      const next = { ...prev };
      next[fromBucket] = (next[fromBucket] || []).filter((x) => x !== brand);
      next[toBucket] = uniq([...(next[toBucket] || []), brand]).sort((a, b) => a.localeCompare(b, "fr"));
      return next;
    });

    await persistTierChange(brand, toBucket);
  }

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Catégorisation Marques</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Choisis une marque et classe en A/B/C/D afin de mettre à jour les paramètres du parking virtuel.
          </div>
        </div>
      </div>

      {error ? <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13 }}>❌ {error}</div> : null}
      {saving ? <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>Sauvegarde…</div> : null}

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
  {/* Haut : Tiers A/B/C/D */}
<div
  style={{
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    justifyItems: "center", // ✅ clé : centre les cartes dans chaque colonne
    alignItems: "start",
  }}
>
  {TIERS.map((t) => (
    <DroppableColumn
      key={t}
      droppableId={t}
      title={`Tier ${t}`}
      subtitle={`${(buckets[t] || []).length} marque(s)`}
      items={buckets[t] || []}
      bucketKey={t}
      maxWidth={260}
      pctValue={tierPct?.[t] || 0}
      onPctChange={(newPct) => onTierPctChange?.(t, newPct)}
    />
  ))}
</div>

  {/* Bas : Banque (plein largeur) */}
  <div style={{ marginTop: 10 }}>
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fafafa",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div style={{ fontWeight: 900 }}>Banque de marques (Non classées)</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{(buckets[BANK] || []).length} marque(s)</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une marque…"
          style={{
            flex: 1,
            minWidth: 220,
            height: 36,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            padding: "0 10px",
            background: "#fff",
          }}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Ajouter une marque…"
            style={{
              width: 240,
              height: 36,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              padding: "0 10px",
              background: "#fff",
            }}
          />
          <button
            type="button"
            onClick={addBrandManual}
            disabled={saving || !newBrand.trim()}
            style={{
              height: 36,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              padding: "0 12px",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Ajouter
          </button>
        </div>
      </div>

      <DroppableBank droppableId={BANK} items={filteredBank} bucketKey={BANK} />

      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Pour “déclasser” une marque, glisse-la depuis A/B/C/D vers la banque. Si nécessaire, ajoute une marque en
        MAJUSCULES et sans espace.
      </div>
    </div>
  </div>
</DndContext>
    </div>
  );
}

/** Banque droppable (liste à la suite) */
function DroppableBank({ droppableId, items, bucketKey }) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 180,
        borderRadius: 12,
        background: "#fff",
        border: isOver ? "2px solid #111827" : "1px dashed #e5e7eb",
        padding: 8,
        overflow: "auto",
      }}
    >
      {/* ✅ stratégie grille */}
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {/* ✅ affichage “pills” à la suite */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
          {items.map((brand) => (
            <SortableBrand key={`${bucketKey}:${brand}`} id={brand} />
          ))}
        </div>
      </SortableContext>

      {items.length === 0 ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
          Aucune marque (ou filtre actif)
        </div>
      ) : null}
    </div>
  );
}


// --- Droppable wrapper minimal (carte centrée + largeur max)
function DroppableColumn({ droppableId, title, subtitle, items, bucketKey, maxWidth = 260, pctValue, onPctChange }) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: "100%",        // prend la largeur de la cellule si besoin
        maxWidth,             // ✅ limite la largeur de la CARTE
        minWidth: 0,
        borderRadius: 16,
        outline: isOver ? "2px solid #111827" : "none",
        outlineOffset: 2,
      }}
    >
      <Column title={title} subtitle={subtitle} items={items} bucketKey={bucketKey} pctValue={pctValue} onPctChange={onPctChange} />
    </div>
  );
}




/* =============================
   App
============================= */
function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔐 Session initiale:", session);
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state change:", event, session);
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Login onLogin={setSession} />;

  return <MainApp session={session} setSession={setSession} />;
}


function MainApp({ session, setSession }) {
  // session is passed as prop from App wrapper
  const currentUser = session?.user?.email || "Anonyme";

  // ===== OPTIMISATION PERFORMANCE =====
  // Détecte si l'onglet est visible pour éviter les calculs lourds en arrière-plan
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Données
  const [velos, setVelos] = useState([]);
  const [inventoryVelos, setInventoryVelos] = useState([]); // Vélos achetés non MEL
  const [stockMode, setStockMode] = useState("vente"); // "vente" | "inventory" | "tous"

  // Sélection / UI
  const [selected, setSelected] = useState({});
  const [selectedVelo, setSelectedVelo] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // ===== MODE PRICING =====
const [pricingMode, setPricingMode] = useState(false);
const [pricingRow, setPricingRow] = useState(null);
const [pricingLoading, setPricingLoading] = useState(false);
const [pricingSaving, setPricingSaving] = useState(false);
const [pricingError, setPricingError] = useState(null);
const [pricingByUrl, setPricingByUrl] = useState({}); // { [mint_url]: row }
const [pricingListLoading, setPricingListLoading] = useState(false);


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


const [lastUpdate, setLastUpdate] = useState(null);

const timeAgoFr = (date) => {
  if (!date) return "";
  const now = Date.now();
  const diffSec = Math.floor((now - new Date(date).getTime()) / 1000);
  if (diffSec < 10) return "à l’instant";
  if (diffSec < 60) return `il y a ${diffSec} s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 30) return `il y a ${diffJ} j`;
  return new Date(date).toLocaleDateString("fr-FR");
};


// Utilise la colonne "Updated At" de velosmint (ou "Published At" si besoin)
const fetchLastUpdate = async () => {
  try {
    const { data, error } = await supabase
      .from("velosmint")
      .select('"Updated At"')        // garde les guillemets si la colonne a un espace
      .order("Updated At", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.["Updated At"]) {
      const t = Date.parse(data["Updated At"]);
      if (!Number.isNaN(t)) setLastUpdate(new Date(t));
    }
  } catch (e) {
    console.error("fetchLastUpdate error:", e);
  }
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

    anneeMin: 2018,
    anneeMax: 2026,
    poidsMin: 0,
    poidsMax: 40,
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
  derailleursAvant: [],
  derailleursArriere: [],
  chaines: [],
  vitessesMax: [],
  autonomies: [],
  cyclesBatterie: [],
  
    

    // Texte libres
    advanced: {},

    // === FILTRES PRICING ===
    pricingBuyers: [],           // Liste acheteurs
    pricingSellerTypes: [],      // Types de vendeur
    pricingMarginMin: -2000, // Marge minimum (€)
    pricingMarginMax: 2500, // Marge maximum (€)
    pricingDateAchatMin: undefined, // Date achat minimum (ISO string)
    pricingDateAchatMax: undefined, // Date achat maximum (ISO string)
    pricingBestUsedUrlEmpty: false, // Vélos dont best_used_url est vide
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  
  // ===== OPTIMISATION: filtre différé pour éviter freeze UI =====
  const deferredFilters = useDeferredValue(filters);
  
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

  // ====== SMS (état + helpers) ======
const [showSmsModal, setShowSmsModal] = useState(false);
const [smsText, setSmsText] = useState("");

// Prénom du vendeur depuis la session
function getPrenomVendeur() {
  const full = session?.user?.user_metadata?.full_name?.trim();
  const fromEmail = session?.user?.email?.split("@")[0];
  const base = (full || fromEmail || "Votre conseiller").trim();
  return base.split(/\s+/)[0]; // premier mot = prénom
}

// Prix court "1 999€"
function formatPrixCourt(val) {
  let n = typeof val === "string" ? Number(val.replace(/[^\d.-]/g, "")) : val;
  if (!Number.isFinite(n)) return "N/A";
  return `${n.toLocaleString("fr-FR")}€`;
}

// Construit un SMS avec uniquement les suggestions (sans intro/outro, sans limite)
function buildSmsFromSelection() {
  const selection = velos.filter((v) => selected[v.URL]);

  let body = "";

  for (const v of selection) {
    const titre = v.Title || "Vélo";
    const annee = v.Année ? ` ${v.Année}` : "";
    const prix = formatPrixCourt(v["Prix réduit"]);
    const url = v.URL ? ` ${v.URL}` : "";

    body += `- ${titre}${annee} — ${prix}${url}\n\n`;
  }

  // Nettoyage final (évite 2 retours ligne en trop à la fin)
  return body.trim();
}


// =======================
// ✅ Parking Virtuel (helpers)
// =======================

const clamp01 = (x) => {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
};

// ===== Helpers Parking Virtuel =====
const normalizeStr = (s) =>
  String(s || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

const isElectricRow = (row) => {
  const raw = row?.["Type de vélo"] ?? row?.["Type de velo"] ?? row?.["type_de_velo"] ?? "";
  const t = normalizeStr(raw);

  // Cas les plus fréquents : "Electrique" / "Électrique" / "VAE" / "AE"
  if (t === "ELECTRIQUE" || t === "ÉLECTRIQUE") return true;
  if (t.includes("Électrique") || t.includes("Électrique")) return true;
  if (t.includes("VAE")) return true;
  if (t === "AE") return true;

  // Si tu as des valeurs style "Musculaire" => false
  return false;
};


const getCategoryFromRow = (row) => {
  const cat = row?.["Catégorie"] ?? row?.["Categorie"] ?? "";
  const type = row?.["Type de vélo"] ?? row?.["Type de velo"] ?? "";
  
  if (!cat || !type) return "";
  
  // Format: "Catégorie - Type"
  return `${cat} - ${type}`;
};

const getCatMarFromRow = (row) => {
  const category = norm(row?.["Catégorie"] ?? row?.["Categorie"] ?? "");
  const bikeType = norm(row?.["Type de vélo"] ?? row?.["Type de velo"] ?? row?.["Type velo"] ?? ""); // "Electrique" | "Musculaire"
  const brand = norm(row?.["Marque"] ?? "");

  if (!category || !bikeType || !brand) return "";

  // 1) règle spécifique (Catégorie + Type + Marque)
  const k1 = makeTierKey(category, bikeType, brand);
  const t1 = brandTiersIndex.get(k1);
  if (t1) return t1;

  // 2) fallback si tu utilises "Tous" côté brand_tiers (optionnel)
  const k2 = makeTierKey(category, "Tous", brand);
  const t2 = brandTiersIndex.get(k2);
  if (t2) return t2;

  // 🐛 Debug
  if (category && bikeType && brand) {
    console.log(`❌ Pas de tier pour: ${k1}`);
  }

  return "";
};


const getSizeFromRow = (row) =>
  String(row?.["Taille"] ?? row?.["Taille cadre"] ?? row?.["size"] ?? "").trim();

const parsePriceNumber = (v) => {
  if (v == null) return NaN;
  if (typeof v === "number") return v;
  const s = String(v)
    .replace(/\s/g, "")
    .replace("€", "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

const getPriceFromRow = (row) => {
  const v = row?.["Prix réduit"];

  if (v == null) return NaN;
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;

  const s = String(v)
    .replace(/\s/g, "")
    .replace("€", "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

const getPriceBand = (price, bands = null) => {
  if (!Number.isFinite(price)) return "";

  // SI PAS DE TRANCHES ENREGISTRÉES, RETOURNER VIDE
  if (!bands || bands.length === 0) return "";

  // Trouver la tranche qui correspond au prix
  for (const band of bands) {
    const minOk = price >= band.min;
    const maxOk = band.max === null || band.max === undefined || price < band.max;
    if (minOk && maxOk) {
      return band.label;
    }
  }

  return "";
};

const computeDistribution = (rows, getKeyFn) => {
  const out = {};
  let totalUnits = 0;

  for (const r of rows || []) {
    const units = Number(getRowTotalStock(r) || 0);
    if (!Number.isFinite(units) || units <= 0) continue;

    const key = String(getKeyFn(r) || "").trim();
    if (!key) continue;

    totalUnits += units;
    out[key] = (out[key] || 0) + units;
  }

  return { out, totalUnits };
};

const norm = (v) => String(v ?? "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const makeTierKey = (category, bikeType, brand) =>
  `${norm(category)}||${norm(bikeType)}||${norm(brand)}`.toLowerCase();

const loadBrandTiersIndex = async () => {
  setBrandTiersLoading(true);
  setBrandTiersError("");
  try {
    const { data, error } = await supabase
      .from("brand_tiers")
      .select("bike_category,bike_type,brand,tier");

    if (error) throw error;

    console.log(`📦 brand_tiers chargées: ${(data || []).length} lignes`);

    const m = new Map();
    (data || []).forEach((r) => {
      const k = makeTierKey(r.bike_category, r.bike_type, r.brand);
      const t = norm(r.tier).toUpperCase();
      if (k && ["A", "B", "C", "D"].includes(t)) {
        m.set(k, t);
        console.log(`  ✅ ${k} → ${t}`);
      }
    });

    console.log(`✅ brandTiersIndex créée avec ${m.size} entrées`);
    setBrandTiersIndex(m);
  } catch (e) {
    console.error("❌ Erreur chargement brand_tiers:", e);
    setBrandTiersError(e?.message || "Erreur chargement brand_tiers");
    setBrandTiersIndex(new Map());
  } finally {
    setBrandTiersLoading(false);
  }
};


const buildGapRows = (actualMap, actualTotal, targetPctMap, objectiveTotal) => {
  const keys = Array.from(
    new Set([...Object.keys(targetPctMap || {}), ...Object.keys(actualMap || {})])
  );

  const rows = keys.map((k) => {
    const actualUnits = Number(actualMap?.[k] || 0);
    const actualPct = actualTotal > 0 ? actualUnits / actualTotal : 0;

    const targetPct = clamp01(targetPctMap?.[k] ?? 0);
    const targetUnits = Math.round(targetPct * Number(objectiveTotal || 0));

    const gapUnits = actualUnits - targetUnits; // + = trop, - = manque
    const gapPct = actualPct - targetPct;

    return {
      key: k,
      actualUnits,
      actualPct,
      targetUnits,
      targetPct,
      gapUnits,
      gapPct,
    };
  });

  // tri: plus gros écart en unités
  rows.sort((a, b) => Math.abs(b.gapUnits) - Math.abs(a.gapUnits));
  return rows;
};

const sizeToBucket = (raw) => {
  if (raw == null) return "";

  const s = String(raw).trim().toUpperCase();
  if (!s) return "";

  // Déjà une lettre ?
  if (["XXS", "XS", "S", "M", "L", "XL", "XXL"].includes(s)) {
    if (s === "XXS") return "XS";
    if (s === "XXL") return "XL";
    return s;
  }

  // Taille numérique (ex: 54, 61)
  const n = Number(String(raw).replace(",", ".").replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n)) {
    if (n < 49) return "XS";
    if (n < 52) return "S";
    if (n < 54) return "M";
    if (n < 56) return "L";
    return "XL";
  }

  // Formats type "54 cm" "Size 54"
  const m = s.match(/(\d{2})/);
  if (m) {
    const nn = Number(m[1]);
    if (Number.isFinite(nn)) {
      if (nn < 49) return "XS";
      if (nn < 52) return "S";
      if (nn < 54) return "M";
      if (nn < 56) return "L";
      return "XL";
    }
  }

  return "";
};

const getVariantSizeBucketsFromRow = (row) => {
  const buckets = [];

  for (const [k, v] of Object.entries(row || {})) {
    const key = String(k || "").toLowerCase();
    if (key.startsWith("taille cadre variant")) {
      const b = sizeToBucket(v);
      if (b) buckets.push(b);
    }
  }

  // unique + ordre stable
  return Array.from(new Set(buckets));
};

// ===== Parking Virtuel : Cross-filter (niveau 1) =====
const [parkingSelection, setParkingSelection] = useState({
  category: null,
  priceBand: null,
  catMar: null,
  size: null,
});

const normStr = (v) => String(v ?? "").trim().toLowerCase();

const toggleParkingFilter = (key, value) => {
  setParkingSelection((prev) => {
    const same = normStr(prev[key]) === normStr(value);
    const newVal = same ? null : value;
    
    // ✅ Cascade: si on change category ou size, réinitialiser les suivants
    if (key === 'category') {
      return { category: newVal, size: null, priceBand: null, catMar: null };
    }
    if (key === 'size') {
      return { ...prev, size: newVal, priceBand: null, catMar: null };
    }
    if (key === 'priceBand') {
      return { ...prev, priceBand: newVal, catMar: null };
    }
    
    return { ...prev, [key]: newVal };
  });
};

const clearParkingFilters = () => {
  setParkingSelection({ category: null, priceBand: null, catMar: null, size: null });
};

const applyParkingSelection = (rows, sel, bands = null) => {
  const s = sel || {};
  return (rows || []).filter((r) => {
    if (s.category && normStr(getCategoryFromRow(r)) !== normStr(s.category)) return false;

    if (s.priceBand) {
      const b = getPriceBand(getPriceFromRow(r), bands);
      if (normStr(b) !== normStr(s.priceBand)) return false;
    }

    if (s.catMar) {
      const cm = normStr(getCatMarFromRow(r));
      if (cm !== normStr(s.catMar)) return false;
    }

    if (s.size) {
      const buckets = (getVariantSizeBucketsFromRow(r) || []).map((x) => String(x).trim().toUpperCase());
      const wanted = String(s.size).trim().toUpperCase();
      if (!buckets.includes(wanted)) return false;
    }

    return true;
  });
};

function getSizeStocksFromRow(r) {
  // ✅ Cas 1 : tu as déjà un champ objet/JSON (si tu en as un dans ton modèle)
  // ex: r.size_stocks = { XS: 1, S: 0, M: 2, L: 1 }
  const maybeObj =
    r?.size_stocks ||
    r?.sizeStocks ||
    r?.["Stocks par taille"] ||
    r?.["stocks_par_taille"];

  if (maybeObj && typeof maybeObj === "object" && !Array.isArray(maybeObj)) {
    const out = {};
    for (const [k, v] of Object.entries(maybeObj)) {
      const size = String(k || "").trim().toUpperCase();
      const units = Number(v || 0);
      if (!size) continue;
      if (!Number.isFinite(units) || units <= 0) continue;
      out[size] = (out[size] || 0) + units;
    }
    return out;
  }

  // ✅ Cas 2 : colonnes “stock_xs / stock_s / …” (on tente plusieurs variantes)
  const sizeKeys = [
    ["XS", ["stock_xs", "Stock_XS", "Stock XS", "XS_stock", "stockXS"]],
    ["S", ["stock_s", "Stock_S", "Stock S", "S_stock", "stockS"]],
    ["M", ["stock_m", "Stock_M", "Stock M", "M_stock", "stockM"]],
    ["L", ["stock_l", "Stock_L", "Stock L", "L_stock", "stockL"]],
    ["XL", ["stock_xl", "Stock_XL", "Stock XL", "XL_stock", "stockXL"]],
  ];

  const out = {};
  for (const [size, keys] of sizeKeys) {
    for (const k of keys) {
      if (r && Object.prototype.hasOwnProperty.call(r, k)) {
        const units = Number(r[k] || 0);
        if (Number.isFinite(units) && units > 0) out[size] = (out[size] || 0) + units;
      }
    }
  }
  if (Object.keys(out).length > 0) return out;

  // ❌ Pas de détail variant -> null (on fera un fallback)
  return null;
}

function buildBrandRecapByTier(rows) {
  const tiers = ["A", "B", "C", "D"];
  const map = { A: new Set(), B: new Set(), C: new Set(), D: new Set() };

  console.log(`🔍 buildBrandRecapByTier appelée avec ${(rows || []).length} lignes`);

  for (const r of rows || []) {
    const brand = String(r?.["Marque"] ?? "").trim();
    if (!brand) continue;

    const t = String(getCatMarFromRow(r) || "").trim().toUpperCase();

    // ✅ On ne garde QUE A/B/C/D. Sinon on ignore.
    if (!tiers.includes(t)) continue;

    map[t].add(brand);
  }

  const toSorted = (set) => Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));

  const result = {
    A: toSorted(map.A),
    B: toSorted(map.B),
    C: toSorted(map.C),
    D: toSorted(map.D),
  };
  
  console.log(`✅ brandRecap résultat:`, result);
  return result;
}




// =======================
// ✅ BULK PROMO (helpers)
// =======================

const promo_getSelectedVelos = () => {
  const urls = Object.entries(selected).filter(([, v]) => v).map(([url]) => url);
  const setUrls = new Set(urls);
  return filteredAndSortedVelos.filter((v) => setUrls.has(v?.URL));
};

// ⚠️ Adapte ici si ton champ date est différent
const promo_getPublishedAt = (v) => {
  return (
    v?.published_at ||
    v?.PublishedAt ||
    v?.["Published At"] ||
    v?.created_at ||
    v?.CreatedAt ||
    v?.["Created At"] ||
    null
  );
};

const promo_ruleMatches = (rule, v) => {
  if (!rule?.enabled) return false;

  if (rule.type === "age_days") {
    const d = promo_getPublishedAt(v);
    const days = daysSince(d); // ✅ on réutilise TA fonction existante
    if (!Number.isFinite(days)) return false;

    if (rule.op === "between") return days >= Number(rule.v1) && days <= Number(rule.v2);
    if (rule.op === ">=") return days >= Number(rule.v1);
    if (rule.op === "<=") return days <= Number(rule.v1);
    return false;
  }

  if (rule.type === "price") {
    const priceRaw = v?.Price ?? v?.price ?? v?.["Prix"] ?? v?.["Price"];
    const price = parseNumericValue(priceRaw);
    if (!Number.isFinite(price)) return false;

    if (rule.op === ">=") return price >= Number(rule.v1);
    if (rule.op === "<=") return price <= Number(rule.v1);
    if (rule.op === "between") return price >= Number(rule.v1) && price <= Number(rule.v2);
    return false;
  }

  return false;
};

const promo_computePromoForVelo = (v, rules, strategy, defaultAmount) => {
  const matching = (rules || []).filter((r) => promo_ruleMatches(r, v));
  if (matching.length === 0) return Number(defaultAmount) || 0;

  if (strategy === "max") {
    return Math.max(...matching.map((r) => Number(r.amount) || 0));
  }

  // "first": première règle dans la liste
  return Number(matching[0].amount) || 0;
};

const promo_addRule = () => {
  setPromoRules((prev) => [
    ...prev,
    {
      id: crypto.randomUUID?.() || String(Date.now()),
      enabled: true,
      type: "age_days",
      op: "between",
      v1: 15,
      v2: 30,
      amount: 100,
    },
  ]);
};

const promo_removeRule = (id) => setPromoRules((prev) => prev.filter((r) => r.id !== id));

const promo_updateRule = (id, patch) =>
  setPromoRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

const promo_openModal = () => {
  setPromoError("");
  setPromoModalOpen(true);
};

// 🔥 APPLY : upsert mode_pricing.mint_promo_amount par mint_url
const promo_applyToSupabase = async () => {
  setPromoError("");

  const velosSel = promo_getSelectedVelos();
  if (velosSel.length === 0) {
    setPromoError("Aucun vélo sélectionné.");
    return;
  }

  const updates = velosSel
    .filter((v) => v?.URL)
    .map((v) => ({
      mint_url: v.URL,
      mint_promo_amount: promo_computePromoForVelo(v, promoRules, promoStrategy, promoDefaultAmount),
    }))
    .map((u) => ({
      ...u,
      mint_promo_amount:
        Number.isFinite(u.mint_promo_amount) && u.mint_promo_amount >= 0 ? u.mint_promo_amount : 0,
    }));

  try {
    setPromoSaving(true);

    // ✅ table correcte: mode_pricing
    const { error } = await supabase
      .from("mode_pricing")
      .upsert(updates, { onConflict: "mint_url" });

    if (error) throw error;

    // refresh cache locale utilisée par tes cards (si tu l'utilises)
    setPricingByUrl((prev) => {
      const next = { ...(prev || {}) };
      for (const u of updates) {
        next[u.mint_url] = { ...(next[u.mint_url] || {}), mint_promo_amount: u.mint_promo_amount };
      }
      return next;
    });

    setPromoModalOpen(false);
  } catch (e) {
    setPromoError(e?.message || "Erreur lors de l’application de la promo.");
  } finally {
    setPromoSaving(false);
  }
};

// 🔧 MODIFY : modifier les promos existantes (+/- montant)
const promo_modifyExisting = async () => {
  setPromoError("");

  const velosSel = promo_getSelectedVelos();
  if (velosSel.length === 0) {
    setPromoError("Aucun vélo sélectionné.");
    return;
  }

  // Filtrer selon le choix "all" ou "withpromo"
  const targetVelos = velosSel.filter((v) => {
    if (promoModifyTarget === "all") return true;
    
    // "withpromo" = vélos ayant déjà une promo (mint_promo_amount > 0)
    const currentPromo = v?.URL && pricingByUrl?.[v.URL]?.mint_promo_amount;
    return currentPromo != null && Number(currentPromo) > 0;
  });

  if (targetVelos.length === 0) {
    setPromoError(`Aucun vélo ${promoModifyTarget === "withpromo" ? "avec promo" : ""} trouvé.`);
    return;
  }

  const updates = targetVelos
    .filter((v) => v?.URL)
    .map((v) => {
      const currentPromo = v?.URL && pricingByUrl?.[v.URL]?.mint_promo_amount 
        ? Number(pricingByUrl[v.URL].mint_promo_amount) 
        : 0;
      
      const newPromo = Math.max(0, currentPromo + Number(promoModifyAmount || 0));
      
      return {
        mint_url: v.URL,
        mint_promo_amount: newPromo,
      };
    });

  try {
    setPromoSaving(true);

    const { error } = await supabase
      .from("mode_pricing")
      .upsert(updates, { onConflict: "mint_url" });

    if (error) throw error;

    // refresh cache locale
    setPricingByUrl((prev) => {
      const next = { ...(prev || {}) };
      for (const u of updates) {
        next[u.mint_url] = { ...(next[u.mint_url] || {}), mint_promo_amount: u.mint_promo_amount };
      }
      return next;
    });

    setPromoError(`✅ ${updates.length} promo(s) modifiée(s) avec succès !`);
    
    // Reset après succès
    setTimeout(() => {
      setPromoError("");
    }, 3000);
    
  } catch (e) {
    setPromoError(e?.message || "Erreur lors de la modification de la promo.");
  } finally {
    setPromoSaving(false);
  }
};

// ===== EXPORT MODAL =====
const [exportModalOpen, setExportModalOpen] = useState(false);
const [exportBase, setExportBase] = useState("url"); // "url" | "serial" | "variant_id"

const openExportModal = () => setExportModalOpen(true);
const closeExportModal = () => setExportModalOpen(false);

// CSV helper (échappe ; " \n)
const csvEscape = (value) => {
  const s = String(value ?? "");
  // on force les guillemets si ; ou " ou retour ligne
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map(csvEscape).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Exporte (étape 1 seulement: choix base + colonnes fixes)
const exportDbNow = () => {
  const rows = [];

  velos.forEach((v) => {
    // promo depuis pricingByUrl
    const promoAmount =
      v?.URL && pricingByUrl?.[v.URL]?.mint_promo_amount != null
        ? pricingByUrl[v.URL].mint_promo_amount
        : "";

    const prixReduit = v?.["Prix réduit"] ?? "";

    // ===== CAS VARIANT ID : 1 ligne par variant =====
    if (exportBase === "variant_id") {
      Object.entries(v || {})
        .filter(([key, val]) => /variant(e)?\s*id/i.test(key) && val)
        .forEach(([key, variantId]) => {
          // récupère le numéro X
          const match = key.match(/(\d+)/);
          if (!match) return;
          const idx = match[1];

          // cherche la colonne stock correspondante
          const stockKey =
            Object.keys(v).find(
              (k) =>
                new RegExp(`stock.*${idx}`, "i").test(k)
            ) || null;

          const stock = stockKey ? Number(v[stockKey]) : 0;
          if (!stock || stock <= 0) return; // ❌ pas en stock → ignoré

          rows.push([
            String(variantId).trim(),
            prixReduit,
            promoAmount,
          ]);
        });

      return;
    }

    // ===== AUTRES BASES (URL / SERIAL) → 1 ligne =====
    let baseVal = "";
    if (exportBase === "url") baseVal = v?.URL || "";
    if (exportBase === "serial") {
      const serials = getAllSerialsFromRow(v);
      baseVal = serials.length ? serials.join(" | ") : "";
    }

    rows.push([baseVal, prixReduit, promoAmount]);
  });

  const header = [
    exportBase === "variant_id"
      ? "Variant ID"
      : exportBase === "serial"
      ? "Numéro de série"
      : "URL",
    "Prix réduit",
    "mint_promo_amount",
  ];

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadCsv(`export_bdd_${exportBase}_${stamp}.csv`, [
    header,
    ...rows,
  ]);

  closeExportModal();
};



// (exemple d’ouverture de la modale SMS)
// setSmsText(buildSmsFromSelection()); setShowSmsModal(true);

  const [statsOpen, setStatsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryCount, setInventoryCount] = useState(0);

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
  const prevSortConfigRef = useRef({ key: null, direction: "asc" });

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

// ===== Bulk promo modal =====
const [promoModalOpen, setPromoModalOpen] = useState(false);
const [promoSaving, setPromoSaving] = useState(false);
const [promoError, setPromoError] = useState("");

// règles (ordre = priorité)
const [promoRules, setPromoRules] = useState([
  // exemple: âge 15-30j => -100€
  { id: crypto.randomUUID?.() || String(Date.now()), enabled: true, type: "age_days", op: "between", v1: 15, v2: 30, amount: 100 },
  // exemple: âge >= 30j => -200€
  { id: crypto.randomUUID?.() || String(Date.now() + 1), enabled: true, type: "age_days", op: ">=", v1: 30, v2: null, amount: 200 },
]);

// comportement si plusieurs règles matchent
const [promoStrategy, setPromoStrategy] = useState("first"); // "first" | "max"
const [promoDefaultAmount, setPromoDefaultAmount] = useState(0); // si aucune règle ne match

// ✅ Modification promo en cours
const [promoModifyAmount, setPromoModifyAmount] = useState(0); // montant à ajouter/soustraire
const [promoModifyTarget, setPromoModifyTarget] = useState("all"); // "all" | "withpromo"


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

// Interpolation linéaire
const lerp = (a, b, t) => a + (b - a) * t;

// Convertit HEX -> {r,g,b}
const hexToRgb = (hex) => {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

// Convertit {r,g,b} -> HEX
const rgbToHex = ({ r, g, b }) => {
  const to2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
};

// Dégradé multi-étapes: stops = [{t:0,color:"#..."}, {t:0.5,...}, {t:1,...}]
const gradientColor = (t, stops) => {
  const tt = clamp01(t);
  const s = [...stops].sort((a, b) => a.t - b.t);
  let i = 0;
  while (i < s.length - 1 && tt > s[i + 1].t) i++;
  const a = s[i];
  const b = s[Math.min(i + 1, s.length - 1)];
  const localT = a.t === b.t ? 0 : (tt - a.t) / (b.t - a.t);

  const A = hexToRgb(a.color);
  const B = hexToRgb(b.color);
  return rgbToHex({
    r: lerp(A.r, B.r, localT),
    g: lerp(A.g, B.g, localT),
    b: lerp(A.b, B.b, localT),
  });
};

// Days since a date string (retourne NaN si invalide)
const daysSince = (dateString) => {
  const ms = parseDateFlexible(dateString);
  if (Number.isNaN(ms)) return NaN;
  const diff = Date.now() - ms;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getMarginColor = (benef) => {
  if (benef == null || Number.isNaN(Number(benef))) return "#6b7280"; // gris

  const b = Number(benef);

  // < 0 => rouge (et plus c'est négatif, plus c'est rouge sombre)
  if (b < 0) {
    // de 0 à -500 => t 0..1
    const t = clamp01(Math.abs(b) / 500);
    return gradientColor(t, [
      { t: 0, color: "#ef4444" }, // rouge
      { t: 1, color: "#7f1d1d" }, // rouge sombre
    ]);
  }

  // 0..500 => bof -> ça va (jaune -> orange)
  if (b <= 500) {
    const t = clamp01(b / 500);
    return gradientColor(t, [
      { t: 0, color: "#facc15" }, // jaune
      { t: 1, color: "#f97316" }, // orange
    ]);
  }

  // >500 => orange -> vert (plus c'est haut, plus c'est vert)
  // 500..1000 => t 0..1 (au-delà reste vert)
  const t = clamp01((b - 500) / 500);
  return gradientColor(t, [
    { t: 0, color: "#22c55e" }, // vert
    { t: 1, color: "#15803d" }, // vert plus profond
  ]);
};

// Couleur basée sur le taux de marge (%)
const getMarginColorByPct = (pct) => {
  if (pct == null || Number.isNaN(Number(pct))) return "#6b7280"; // gris

  const p = Number(pct);

  // < 0% => rouge
  if (p < 0) {
    const t = clamp01(Math.abs(p) / 20); // -20% = rouge sombre max
    return gradientColor(t, [
      { t: 0, color: "#ef4444" }, // rouge
      { t: 1, color: "#7f1d1d" }, // rouge sombre
    ]);
  }

  // 0..15% => jaune -> orange (marge faible)
  if (p <= 15) {
    const t = clamp01(p / 15);
    return gradientColor(t, [
      { t: 0, color: "#facc15" }, // jaune
      { t: 1, color: "#f97316" }, // orange
    ]);
  }

  // >15% => vert (bonne marge)
  // 15..30% => vert de plus en plus profond
  const t = clamp01((p - 15) / 15);
  return gradientColor(t, [
    { t: 0, color: "#22c55e" }, // vert
    { t: 1, color: "#15803d" }, // vert profond
  ]);
};

const getAgeColor = (days) => {
  if (!Number.isFinite(days)) return "#6b7280";

  // 0 jour => vert, 60+ jours => rouge
  const t = clamp01(days / 60);
  return gradientColor(t, [
    { t: 0, color: "#22c55e" }, // vert
    { t: 0.5, color: "#f97316" }, // orange
    { t: 1, color: "#ef4444" }, // rouge
  ]);
};
const getPricingRecencyColor = (daysSincePricing) => {
  if (!Number.isFinite(daysSincePricing)) return "#6b7280";

  // <=10 => vert
  if (daysSincePricing <= 10) {
    const t = clamp01(daysSincePricing / 10); // léger dégradé vert
    return gradientColor(t, [
      { t: 0, color: "#15803d" },
      { t: 1, color: "#22c55e" },
    ]);
  }

  // 10..15 => orange (dégradé)
  if (daysSincePricing <= 15) {
    const t = clamp01((daysSincePricing - 10) / 5);
    return gradientColor(t, [
      { t: 0, color: "#f97316" }, // orange
      { t: 1, color: "#fb923c" }, // orange clair
    ]);
  }

  // >15 => rouge (plus c'est vieux, plus c'est sombre)
  const t = clamp01((daysSincePricing - 15) / 15); // 15..30 => t 0..1
  return gradientColor(t, [
    { t: 0, color: "#ef4444" },
    { t: 1, color: "#7f1d1d" },
  ]);
};

// Qui est l'utilisateur courant (vendeur) ?
const currentUserName =
  session?.user?.user_metadata?.full_name ||
  session?.user?.email ||
  "Vendeur inconnu";

// ===== PARKING VIRTUEL (modal) =====
const [parkingOpen, setParkingOpen] = useState(false);
const [parkingTab, setParkingTab] = useState("vue"); // "vue" | "params"
const [parkingCategory, setParkingCategory] = useState(null); // catégorie sélectionnée pour les objectifs
const [parkingType, setParkingType] = useState(null); // type sélectionné pour les objectifs

// Index des tiers de marque (clé = `${cat}||${type}||${brand}`)
// ...existing code...

// Fonction pour retrouver le tier d'un vélo selon la marque/catégorie/type (utilise l'index dynamique)
// ...existing code...

// Synchronisation de la catégorie du formulaire de la modale (vue) avec le state global
const syncParkingCategoryFromModal = (formCategory) => {
  if (formCategory && formCategory !== parkingCategory) {
    setParkingCategory(formCategory);
  }
};

// ===== OUTIL PRIX (modal) =====
const [priceToolOpen, setPriceToolOpen] = useState(false);
const [priceToolForm, setPriceToolForm] = useState({
  brand: "",
  model: "",
  year: new Date().getFullYear().toString(),
  size: "",
  category: "",
  estimatedPrice: "",
  skipTransportCost: false,
});
const [priceToolCompetitorLinks, setPriceToolCompetitorLinks] = useState([]);
const [priceToolShowCompetitors, setPriceToolShowCompetitors] = useState(false);

// Charger les combinaisons uniques (Catégorie, Type de vélo) depuis velosmint
const parkingCategoryTypeOptions = useMemo(() => {
  const combos = velos
    .map(v => {
      const cat = v["Catégorie"];
      const type = v["Type de vélo"];
      if (!cat || !type) return null;
      return {
        category: cat,
        type: type,
        label: `${cat} - ${type}`
      };
    })
    .filter(Boolean);

  // Dédupliquer les combinaisons
  const uniqueCombos = Array.from(
    new Map(
      combos.map(combo => [combo.label, combo])
    ).values()
  );

  return uniqueCombos.sort((a, b) => a.label.localeCompare(b.label, "fr"));
}, [velos]);

// Pour compatibilité avec les selects (à garder pour les filtres de la vue)
const parkingCategories = useMemo(() => {
  return parkingCategoryTypeOptions.map(opt => opt.label);
}, [parkingCategoryTypeOptions]);

const parkingTypes = useMemo(() => {
  const types = parkingCategoryTypeOptions.map(opt => opt.type).filter(Boolean);
  return [...new Set(types)].sort((a, b) => a.localeCompare(b, "fr"));
}, [parkingCategoryTypeOptions]);

const [parkingTierPct, setParkingTierPct] = useState({
  "A": 0.60,
  "B": 0.30,
  "C": 0.10,
  "D": 0.00,
});

const [parkingRules, setParkingRules] = useState({
  objectiveTotal: 600,
  categoryPct: {},
  pricePct: {},
  sizePct: {},
});

// Détails complets des tranches de prix pour pouvoir les éditer
const [priceBands, setPriceBands] = useState([]); // Tranches actuelles (pour l'édition)
const [allPriceBandsByCategory, setAllPriceBandsByCategory] = useState({}); // Toutes les tranches de toutes les catégories
const [priceBandsLoading, setPriceBandsLoading] = useState(true); // Loading state pour le cache

// Charger les objectifs de catégorie depuis Supabase au chargement
useEffect(() => {
  async function loadCategoryPct() {
    if (parkingCategoryTypeOptions.length === 0) {
      setParkingRules(prev => ({ ...prev, categoryPct: {} }));
      return;
    }
    // Lire depuis la table pv_category_targets
    const { data, error } = await supabase
      .from("pv_category_targets")
      .select("category, target_pct");
    let categoryPct = {};
    if (!error && data && data.length > 0) {
      data.forEach(row => {
        categoryPct[row.category] = (row.target_pct ?? 0) / 100;
      });
    }
    // S'assurer que toutes les catégories sont présentes
    parkingCategoryTypeOptions.forEach(opt => {
      if (!(opt.label in categoryPct)) {
        categoryPct[opt.label] = 1 / parkingCategoryTypeOptions.length;
      }
    });
    setParkingRules(prev => ({ ...prev, categoryPct }));
  }
  loadCategoryPct();
}, [parkingCategoryTypeOptions]);



// Synchroniser tous les taux dans parkingRules dès que la catégorie ou les tranches changent
const [rulesReady, setRulesReady] = useState(false);
useEffect(() => {
  // On ne bloque que si aucune catégorie ou aucune tranche n'est dispo ou en cours de chargement
  if (!parkingCategory || priceBandsLoading) {
    setRulesReady(false);
    return;
  }
  const bands = allPriceBandsByCategory[parkingCategory] || [];
  if (!parkingRules.categoryPct[parkingCategory] || bands.length === 0) {
    setRulesReady(false);
    return;
  }
  const pricePct = {};
  bands.forEach(band => {
    pricePct[band.label] = band.share_pct || 0;
  });
  setParkingRules(prev => ({
    ...prev,
    pricePct: { ...pricePct }
  }));
  setRulesReady(true);
}, [parkingCategory, allPriceBandsByCategory, parkingRules.categoryPct, priceBandsLoading]);

// Charger les prix depuis pv_price_bands - scopé par parkingCategory
useEffect(() => {
  async function loadPriceBands() {
    if (!parkingCategory) {
      setPriceBands([]);
      setParkingRules(prev => ({ ...prev, pricePct: {} }));
      return;
    }

    // Chercher dans le cache allPriceBandsByCategory
    const key = parkingCategory;
    if (allPriceBandsByCategory && allPriceBandsByCategory[key]) {
      const cachedBands = allPriceBandsByCategory[key];
      console.log(`✅ Tranches chargées du cache pour ${parkingCategory}:`, cachedBands);
      setPriceBands(cachedBands);

      // Mettre à jour les pourcentages (déjà en décimal depuis le cache)
      const pricePct = {};
      cachedBands.forEach(band => {
        pricePct[band.label] = band.share_pct || 0; // Déjà en décimal (0.25 pour 25%)
      });
      setParkingRules(prev => ({ ...prev, pricePct }));
      return;
    }

    // Si pas dans le cache, charger depuis Supabase
    const parts = parkingCategory.split(" - ");
    const category = parts[0];
    const type = parts[1];

    const { data, error } = await supabase
      .from("pv_price_bands")
      .select("id, label, min, max, share_pct, sort, bike_category, bike_type")
      .eq("bike_category", category)
      .eq("bike_type", type)
      .order("sort");

    if (!error && data && data.length > 0) {
      // Convertir share_pct de la DB (25 = 25%) vers le format décimal local (0.25)
      const normalizedBands = data.map(band => ({
        ...band,
        share_pct: (band.share_pct || 0) / 100, // Convertir 25 → 0.25
      }));
      setPriceBands(normalizedBands);

      const pricePct = {};
      normalizedBands.forEach(band => {
        pricePct[band.label] = band.share_pct; // Déjà en décimal
      });
      setParkingRules(prev => ({ ...prev, pricePct }));
    } else {
      // Aucune donnée : tranches vides
      setPriceBands([]);
      setParkingRules(prev => ({ ...prev, pricePct: {} }));
      console.log("⚠️ Aucune tranche trouvée pour cette catégorie");
    }
  }
  loadPriceBands();
}, [parkingCategory, allPriceBandsByCategory]);

// Charger les tranches de prix pour TOUTES les catégories
useEffect(() => {
  async function loadAllPriceBands() {
    console.log("🔄 DÉBUT du chargement des tranches de prix...");
    setPriceBandsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pv_price_bands")
        .select("id, label, min, max, share_pct, sort, bike_category, bike_type");

      console.log("📡 Réponse Supabase - Error:", error, "Data length:", data?.length);

      if (error) {
        console.error("❌ Erreur Supabase:", error);
        setAllPriceBandsByCategory({});
      } else if (data && data.length > 0) {
        console.log("📊 Données brutes reçues:", data);

        // Stocker toutes les tranches par catégorie/type
        // IMPORTANT: Normaliser share_pct de la DB (25 = 25%) vers le format décimal (0.25)
        const bandsByCategory = {};
        data.forEach(band => {
          const key = `${band.bike_category} - ${band.bike_type}`; // Format: "VTT - Électrique"
          console.log(`  → Band: ${band.label}, Category: ${band.bike_category}, Type: ${band.bike_type}, Key: ${key}`);
          if (!bandsByCategory[key]) {
            bandsByCategory[key] = [];
          }
          // Normaliser share_pct vers décimal pour l'utilisation interne
          bandsByCategory[key].push({
            ...band,
            share_pct: (band.share_pct || 0) / 100, // Convertir 25 → 0.25
          });
        });
        console.log("✅ Tranches de prix organisées par catégorie:", bandsByCategory);
        setAllPriceBandsByCategory(bandsByCategory);
      } else {
        console.log("⚠️ Aucune tranche de prix trouvée (data vide ou nulle)");
        setAllPriceBandsByCategory({});
      }
    } catch (err) {
      console.error("❌ Erreur catch dans loadAllPriceBands:", err);
      setAllPriceBandsByCategory({});
    } finally {
      console.log("✅ FIN du chargement - setPriceBandsLoading(false)");
      setPriceBandsLoading(false);
    }
  }

  loadAllPriceBands();
}, [parkingCategoryTypeOptions]); // Recharge quand les options changent

// Initialiser parkingCategory avec la première catégorie qui a des tranches
useEffect(() => {
  if (parkingCategory === null && allPriceBandsByCategory && Object.keys(allPriceBandsByCategory).length > 0) {
    const firstCategoryWithData = Object.keys(allPriceBandsByCategory)[0];
    setParkingCategory(firstCategoryWithData);
    console.log("✅ parkingCategory initialisé avec la première catégorie avec données:", firstCategoryWithData);
  }
}, [allPriceBandsByCategory, parkingCategory]);

// Charger les objectifs de taille depuis Supabase au chargement
useEffect(() => {
  async function loadSizePct() {
    // Toujours avoir les 5 tailles standards
    const STANDARD_SIZES = ["XS", "S", "M", "L", "XL"];
    // Chercher si on a des tailles dans le stock
    const tailles = velos
      .flatMap(v => {
        const sizeLetters = [];
        for (let i = 1; i <= 4; i++) {
          const sizeCol = `Taille cadre variant ${i}`;
          const sizeValue = v[sizeCol];
          if (sizeValue && sizeValue !== "N/A") {
            const letter = mapFrameSizeToLetter(sizeValue);
            if (letter) sizeLetters.push(letter);
          }
        }
        return sizeLetters;
      })
      .filter(Boolean);
    const uniqueTailles = [...new Set(tailles)].length > 0 
      ? [...new Set(tailles)].sort((a, b) => {
          return STANDARD_SIZES.indexOf(a) - STANDARD_SIZES.indexOf(b);
        })
      : STANDARD_SIZES;
    // Lire depuis la table pv_size_targets
    const { data, error } = await supabase
      .from("pv_size_targets")
      .select("size, target_pct");
    if (!error && data && data.length > 0) {
      const sizePct = {};
      data.forEach(row => {
        sizePct[row.size] = (row.target_pct ?? 0) / 100;
      });
      // S'assurer que toutes les tailles sont présentes
      uniqueTailles.forEach(taille => {
        if (!(taille in sizePct)) {
          sizePct[taille] = 1 / uniqueTailles.length;
        }
      });
      setParkingRules(prev => ({ ...prev, sizePct }));
    } else {
      // Si pas de données, initialiser par défaut
      const defaultPct = 1 / uniqueTailles.length;
      const sizePct = {};
      uniqueTailles.forEach(taille => {
        sizePct[taille] = defaultPct;
      });
      setParkingRules(prev => ({ ...prev, sizePct }));
    }
  }
  loadSizePct();
}, [velos]);

// Mapping des tailles numériques ou texte vers lettres standardisées (XS, S, M, L, XL)
const mapFrameSizeToLetter = (sizeValue) => {
  if (!sizeValue) return null;
  
  // Si c'est du texte, mapper XXS/XXL
  const str = String(sizeValue).trim().toUpperCase();
  if (str === "XXS") return "XS";
  if (str === "XXL") return "XL";
  if (["XS", "S", "M", "L", "XL"].includes(str)) return str;
  
  // Si c'est numérique
  const size = Number(sizeValue);
  if (isNaN(size)) return null;
  
  if (size <= 48) return "XS";
  if (size <= 52) return "S";
  if (size <= 56) return "M";
  if (size <= 60) return "L";
  return "XL";
};
const parkingScopeId = (cat, type) => `${cat || "ALL"}__${type || "ALL"}`;

// Charge les réglages depuis pv_settings pour le scope courant
useEffect(() => {
  const loadParkingSettings = async () => {
    // 1. Charger les paramètres GLOBAUX (category_pct, size_pct, objective_total)
    const { data: globalData } = await supabase
      .from("pv_settings")
      .select("id, objective_total, category_pct, size_pct")
      .eq("id", "global")
      .maybeSingle();

    if (globalData) {
      setParkingRules((p) => ({
        ...p,
        objectiveTotal: globalData.objective_total ?? p.objectiveTotal,
        categoryPct: globalData.category_pct ?? p.categoryPct,
        // Ne charger size_pct que s'il n'est pas vide dans la DB ET qu'on n'a pas déjà des tailles
        sizePct: (globalData.size_pct && Object.keys(globalData.size_pct).length > 0) 
          ? globalData.size_pct 
          : p.sizePct,
      }));
    }

    // 2. Charger les paramètres SCOPÉS par catégorie (price_pct, cat_mar_pct)
    const scope = parkingScopeId(parkingCategory, parkingType);
    const { data: scopedData, error } = await supabase
      .from("pv_settings")
      .select("id, price_pct, cat_mar_pct")
      .eq("id", scope)
      .maybeSingle();

    if (!error && scopedData) {
      setParkingRules((p) => ({
        ...p,
        pricePct: scopedData.price_pct ?? p.pricePct,
      }));
      setParkingTierPct(scopedData.cat_mar_pct ?? parkingTierPct);
    }
  };

  loadParkingSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [parkingCategory, parkingType]);

// Persiste les réglages parking dans pv_settings
const saveParkingSettings = useCallback(
  async (updates) => {
    try {
      // Sauvegarder les catégories
      if (updates.categoryPct) {
        const rows = Object.entries(updates.categoryPct).map(([category, pct]) => ({
          category,
          target_pct: Math.round(pct * 100), // Convertir 0.4 → 40
          updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from("pv_category_targets")
          .upsert(rows, { onConflict: "category" });
        
        if (error) console.error("❌ Erreur catégories:", error);
        else console.log("✅ Catégories sauvegardées:", rows);
      }
      
      // Sauvegarder les tailles
      if (updates.sizePct) {
        const rows = Object.entries(updates.sizePct).map(([size, pct]) => ({
          size,
          target_pct: Math.round(pct * 100),
          updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from("pv_size_targets")
          .upsert(rows, { onConflict: "size" });
        
        if (error) console.error("❌ Erreur tailles:", error);
        else console.log("✅ Tailles sauvegardées:", rows);
      }
      
      // Objectif total (table simple avec une seule ligne)
      if (updates.objectiveTotal !== undefined) {
        const { error } = await supabase
          .from("pv_settings")
          .upsert({ 
            id: "main", 
            objective_total: Number(updates.objectiveTotal),
            updated_at: new Date().toISOString()
          }, { onConflict: "id" });
        
        if (error) console.error("❌ Erreur objectif:", error);
        else console.log("✅ Objectif sauvegardé:", updates.objectiveTotal);
      }
    } catch (err) {
      console.error("❌ Exception sauvegarde:", err);
    }
  },
  []
);

const handleTierPctChange = useCallback(
  (tier, pct) => {
    setParkingTierPct((prev) => {
      const next = { ...prev, [tier]: pct };
      saveParkingSettings({ tierPct: next });
      return next;
    });
  },
  [saveParkingSettings]
);

// Sauvegarder une tranche de prix dans pv_price_bands
// Fonction pour valider les chevauchements de tranches de prix
const validatePriceBandOverlap = (bands) => {
  const sorted = [...bands].sort((a, b) => a.min - b.min);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // Si le max du courant existe et max >= min du suivant, c'est un chevauchement
    if (current.max !== null && current.max !== undefined) {
      if (current.max > next.min) {
        return {
          valid: false,
          error: `Chevauchement détecté: ${current.min}€-${current.max}€ chevauche ${next.min}€-${next.max ? next.max + '€' : '+'}`,
        };
      }
    }
  }

  return { valid: true };
};

// Sauvegarder TOUTES les tranches de prix pour la catégorie sélectionnée
const saveAllPriceBands = useCallback(async () => {
  try {
    if (!parkingCategory || !priceBands || priceBands.length === 0) {
      alert("Sélectionnez une catégorie et ajoutez des tranches");
      return;
    }

    // Extraire category et type de parkingCategory (format: "VTT - Électrique")
    const parts = parkingCategory.split(" - ");
    const category = parts[0] || "";
    const type = parts[1] || "";

    console.log(`🗑️ Suppression des anciennes tranches pour ${category} - ${type}`);

    // 1. Supprimer TOUTES les anciennes tranches pour cette catégorie/type
    const { error: deleteError } = await supabase
      .from("pv_price_bands")
      .delete()
      .eq("bike_category", category)
      .eq("bike_type", type);

    if (deleteError) {
      console.error("❌ Erreur suppression:", deleteError);
      throw deleteError;
    }
    console.log("✅ Anciennes tranches supprimées");

    // 2. Insérer les nouvelles tranches
    const payloads = priceBands.map((band, idx) => ({
      label: band.label,
      min: band.min,
      max: band.max,
      share_pct: Math.round((band.share_pct || 0) * 100), // Convertir 0.25 → 25
      sort: idx + 1,
      bike_category: category,
      bike_type: type,
    }));

    console.log("💾 Insertion des nouvelles tranches:", payloads);

    const { data, error: insertError } = await supabase
      .from("pv_price_bands")
      .insert(payloads)
      .select("id");

    if (insertError) {
      console.error("❌ Erreur insertion:", insertError);
      throw insertError;
    }

    console.log("✅ Nouvelles tranches sauvegardées:", data);

    // 3. Mettre à jour les IDs locaux
    if (data) {
      const newBands = priceBands.map((band, idx) => ({
        ...band,
        id: data[idx]?.id || band.id,
      }));
      setPriceBands(newBands);
    }

    alert("✅ Tranches de prix sauvegardées!");

  } catch (err) {
    console.error("❌ Erreur sauvegarde:", err);
    alert("❌ Erreur lors de la sauvegarde");
  }
}, [parkingCategory, priceBands]);


const [brandTiersIndex, setBrandTiersIndex] = useState(new Map()); 
// key = `${category}||${type}||${brand}` -> tier (A/B/C/D)
const [brandTiersLoading, setBrandTiersLoading] = useState(false);
const [brandTiersError, setBrandTiersError] = useState("");


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

const PRICING_TABLE = "mode_pricing";

const fetchPricingForUrls = async (urls = []) => {
  const clean = (urls || []).filter(Boolean);
  if (clean.length === 0) return;

  setPricingListLoading(true);
  try {
    // Supabase a une limite de taille → on batch par 200
    const batchSize = 200;
    const nextMap = {};

    for (let i = 0; i < clean.length; i += batchSize) {
      const chunk = clean.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from(PRICING_TABLE)
        .select("mint_url, brand_category, commercial_margin_eur, updated_at, price_updated_at")
        .in("mint_url", chunk);

      if (error) {
        console.error("❌ fetchPricingForUrls error:", error);
        continue;
      }

      (data || []).forEach((row) => {
        nextMap[row.mint_url] = row;
      });
    }

    // merge avec l’existant (au cas où)
    setPricingByUrl((prev) => ({ ...prev, ...nextMap }));
  } finally {
    setPricingListLoading(false);
  }
};
// ============================
// MODE PRICING – helpers fiche
// ============================
const pricingLoadedRef = useRef(false); // Cache pour éviter les rechargements

useEffect(() => {
  // Ne charge le pricing que si on est en mode pricing et qu'on ne l'a pas déjà chargé
  if (!pricingMode || pricingLoadedRef.current) return;
  
  const loadAllPricing = async () => {
    const { data, error } = await supabase
      .from("mode_pricing")
      .select("*"); // toutes colonnes

    if (!error && data) {
      const map = {};
      data.forEach((r) => (map[r.mint_url] = r));
      setPricingByUrl(map);
      pricingLoadedRef.current = true; // Marque comme chargé
    }
  };

  loadAllPricing();
}, [pricingMode]);

// 🔗 Récupère le premier Variant ID dispo (pour lien ERP)
const getFirstVariantId = (row) => {
  if (!row || typeof row !== "object") return null;

  const entries = Object.entries(row)
    .filter(([key, val]) => /variant\s*id/i.test(key) && val)
    .sort(([a], [b]) => {
      const na = Number(a.match(/\d+/)?.[0] || 0);
      const nb = Number(b.match(/\d+/)?.[0] || 0);
      return na - nb;
    });

  if (!entries.length) return null;
  return String(entries[0][1]).trim();
};


const openPricingSearchTabs = (v) => {
  if (!v) return;

  const brand = (v?.Marque || v?.["Marque"] || "").toString().trim();
  const modelRaw =
    (v?.["Modèle"] || v?.["Modele"] || v?.Modele || v?.Title || "").toString().trim();
  const year = (v?.["Année"] || v?.["Annee"] || v?.Annee || "").toString().trim();
  const category = (v?.["Catégorie"] || "").toString().toLowerCase();

  // ✅ Nettoyer le modèle : enlever les patterns comme "750Wh", "500Wh", etc.
  const model = modelRaw.replace(/\d+Wh/gi, "").trim();

  const queryNoYear = [brand, model].filter(Boolean).join(" ").trim();
  const queryWithYear = [brand, model, year].filter(Boolean).join(" ").trim();

  const qNoYear = encodeURIComponent(queryNoYear);
  const qWithYear = encodeURIComponent(queryWithYear);

  const typeVeloRaw = getFieldLoose(v, "Type de vélo"); // match même si accents/espaces diffèrent
const typeVelo = stripDiacritics(String(typeVeloRaw)).toLowerCase().trim();

// ✅ Se baser uniquement sur "33Électrique" dans le type de vélo
const isEbikeFinal = typeVelo.includes("electrique");



  const googleUrl = `https://www.google.com/search?q=${qWithYear}`;
  const y = year || "0";
  const buycycleUrl = `https://buycycle.com/fr-fr/shop/min-year/${encodeURIComponent(y)}/search/${qNoYear}/sort-by/lowest-price`;
  const leboncoinUrl = `https://www.leboncoin.fr/recherche?category=55&text=${qNoYear}&sort=price&order=asc`;
  const upwayUrl = `https://upway.fr/search?q=${qWithYear}`;
  const tuvalumUrl = `https://tuvalum.fr/search?sort_by=price-ascending&grid=default&q=${qWithYear}`;
  const zycloraUrl = `https://zyclora.fr/#210c/fullscreen/m=or&q=${qWithYear}`;
  const rebikeUrl = `https://rebike.fr/search?q=${qWithYear}`;

  const links = [
    { label: "🔍 Google", url: googleUrl, color: "#4285F4" },
    { label: "🚴 Buycycle", url: buycycleUrl, color: "#00A651" },
    { label: "🛒 Leboncoin", url: leboncoinUrl, color: "#FF6E14" },
    { label: "📦 Tuvalum", url: tuvalumUrl, color: "#7C3AED" },
    { label: "🔄 Zyclora", url: zycloraUrl, color: "#0EA5E9" },
    { label: "♻️ Rebike", url: rebikeUrl, color: "#10B981" },
  ];
  if (isEbikeFinal) links.push({ label: "⚡ Upway", url: upwayUrl, color: "#F59E0B" });

  // ✅ Créer une belle page intermédiaire avec tous les liens
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recherches Concurrence - ${escapeHtml(queryWithYear)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 28px;
          color: #1f2937;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          text-align: center;
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 30px;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-weight: 500;
        }
        .badge {
          display: inline-block;
          background: #fbbf24;
          color: #78350f;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          margin-left: 8px;
        }
        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .link-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 18px 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .link-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          border-color: currentColor;
        }
        .link-btn:active {
          transform: translateY(0);
        }
        .footer {
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .tip {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          border-radius: 8px;
          color: #1e40af;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔍 Recherches Concurrence</h1>
        <div class="subtitle">
          ${escapeHtml(queryWithYear)}
          ${isEbikeFinal ? '<span class="badge">⚡ ÉLECTRIQUE</span>' : ''}
        </div>
        
        <div class="links-grid">
          ${links.map(link => `
            <a href="${link.url}" target="_blank" class="link-btn" style="background: ${link.color};">
              ${link.label}
            </a>
          `).join('')}
        </div>

        <div class="tip">
          💡 <strong>Astuce :</strong> Faites glisser cet onglet hors de la fenêtre pour créer une nouvelle fenêtre dédiée à vos recherches !
        </div>
        
        <div class="footer">
          Mint Bikes - Comparaison de prix concurrents
        </div>
      </div>
    </body>
    </html>
  `;

  // Ouvrir dans un nouvel onglet simple (sans features)
  const newTab = window.open('about:blank', '_blank');
  
  if (!newTab) {
    alert("Pop-up bloquée : autorise les pop-ups pour localhost:3000 puis réessaie.");
    return;
  }

  newTab.document.write(html);
  newTab.document.close();
};

const escapeHtml = (str) =>
  String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


const ensurePricingRow = async (mintUrl) => {
  if (!mintUrl) return null;

  // Déjà en cache → on l’utilise
  if (pricingByUrl[mintUrl]) {
    return pricingByUrl[mintUrl];
  }

  // Sinon on tente un fetch unitaire
  const { data, error } = await supabase
    .from("mode_pricing")
    .select("*")
    .eq("mint_url", mintUrl)
    .maybeSingle();

  if (!error && data) {
    setPricingByUrl((prev) => ({ ...prev, [mintUrl]: data }));
    return data;
  }

  // Toujours rien → on crée la ligne
  const { data: inserted, error: insertError } = await supabase
    .from("mode_pricing")
    .insert({ mint_url: mintUrl })
    .select("*")
    .single();

  if (insertError) {
    console.error("❌ ensurePricingRow:", insertError);
    return null;
  }

  setPricingByUrl((prev) => ({ ...prev, [mintUrl]: inserted }));
  return inserted;
};

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

const computePricing = (row, velo = null) => {
  if (!row) return row;

  // ✅ Prix de vente = prix réel du site Mint
  const sale = parseNumericValue(velo?.["Prix réduit"]);

  const buy =
    parseNumericValue(row.negotiated_buy_price) ??
    parseNumericValue(row.optimized_buy_price);

  const parts =
    parseNumericValue(row.parts_cost_actual) ??
    parseNumericValue(row.parts_cost_estimated);

  const includeTransport = row.include_transport === true;

  let commercialEur = null;
  let commercialPct = null;

  // Marge commerciale = Prix de vente - Prix d'achat HT
  if (sale != null && buy != null) {
    commercialEur = sale - buy;
    commercialPct = sale !== 0 ? (commercialEur / sale) * 100 : null;
  }

  let grossEur = null;
  let grossPct = null;

  // TVA sur marge (régime de la marge) et marge sur coûts variables
  let tvaSurMarge = null;
  let fraisTransport = null;
  let partsSafe = null;

  if (sale != null && buy != null) {
    // TVA sur marge = margeCommerciale - margeCommerciale/1.2
    tvaSurMarge = commercialEur - commercialEur / 1.2;
    partsSafe = parts ?? 0;
    fraisTransport = includeTransport ? FRAIS_TRANSPORT : 0;

    // Marge sur coûts variables = Marge commerciale - Pièces - Marquage - Emballage - Transport - TVA sur marge
    grossEur = commercialEur - partsSafe - FRAIS_MARQUAGE - FRAIS_EMBALLAGE - fraisTransport - tvaSurMarge;
    grossPct = sale !== 0 ? (grossEur / sale) * 100 : null;
  }

  const round2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

  return {
    ...row,
    // Valeurs utilisées pour l'affichage du détail
    _sale: round2(sale),
    _buy: round2(buy),
    _parts: round2(partsSafe),
    _frais_marquage: FRAIS_MARQUAGE,
    _frais_emballage: FRAIS_EMBALLAGE,
    _frais_transport: round2(fraisTransport),
    _tva_sur_marge: round2(tvaSurMarge),
    // Marges calculées
    commercial_margin_eur: round2(commercialEur),
    commercial_margin_pct: round2(commercialPct),
    gross_margin_eur: round2(grossEur),
    gross_margin_pct: round2(grossPct),
  };
};

// Constantes pour les frais fixes
const FRAIS_MARQUAGE = 2;      // €, pour tous les vélos
const FRAIS_EMBALLAGE = 21;    // €, pour tous les vélos
const FRAIS_TRANSPORT = 84.5;  // €, si include_transport est coché

const computeCardBenefit = (velo, pricingRow) => {
  const sale = parseNumericValue(velo?.["Prix réduit"]);
  const buy =
    parseNumericValue(pricingRow?.negotiated_buy_price) ??
    parseNumericValue(pricingRow?.optimized_buy_price);

  const parts =
    parseNumericValue(pricingRow?.parts_cost_actual) ??
    parseNumericValue(pricingRow?.parts_cost_estimated);

  const includeTransport = pricingRow?.include_transport === true;

  if (sale == null || buy == null) return null;

  // Marge commerciale = Prix de vente - Prix d'achat HT
  const margeCommerciale = sale - buy;

  // TVA sur marge (régime de la marge) = margeCommerciale - margeCommerciale/1.2
  const tvaSurMarge = margeCommerciale - margeCommerciale / 1.2;

  // Marge sur coûts variables = Marge commerciale - Pièces TTC - Marquage - Emballage - Transport - TVA sur marge
  let margeSurCoutsVariables = margeCommerciale - (parts ?? 0) - FRAIS_MARQUAGE - FRAIS_EMBALLAGE - tvaSurMarge;
  if (includeTransport) {
    margeSurCoutsVariables -= FRAIS_TRANSPORT;
  }

  const eur = Math.round(margeSurCoutsVariables * 100) / 100;
  const pct = sale !== 0 ? Math.round((margeSurCoutsVariables / sale) * 1000) / 10 : null;

  return { eur, pct };
};

const getSaleBreakdownFromModePricing = (velo, pricingRow) => {
  const sale = parseNumericValue(velo?.["Prix réduit"]); // prix de vente Mint

  const buy =
    parseNumericValue(pricingRow?.negotiated_buy_price) ??
    parseNumericValue(pricingRow?.optimized_buy_price);

  const parts =
    parseNumericValue(pricingRow?.parts_cost_actual) ??
    parseNumericValue(pricingRow?.parts_cost_estimated);

  const logistics = parseNumericValue(pricingRow?.logistics_cost);

  if (!Number.isFinite(sale) || sale <= 0) return null;

  const buySafe = Number.isFinite(buy) ? buy : 0;
  const partsSafe = Number.isFinite(parts) ? parts : 0;
  const logisticsSafe = Number.isFinite(logistics) ? logistics : 0;

  const costs = buySafe + partsSafe + logisticsSafe;
  const margin = sale - costs;

  return {
    sale,
    buy: buySafe,
    parts: partsSafe,
    logistics: logisticsSafe,
    margin, // peut être négative
  };
};


// ===== SAVE PRICING: avec bouton manuel pour price_updated_at =====
const savePricingRow = async (row, updatePriceTimestamp = false) => {
  if (!row?.mint_url) return;

  setPricingSaving(true);
  try {
    // Filtrer les champs virtuels (préfixés par _) qui ne sont pas en base
    const payload = Object.fromEntries(
      Object.entries(row).filter(([key]) => !key.startsWith("_"))
    );

    // ✅ Si on modifie best_used_url → màj price_updated_at
    if (updatePriceTimestamp) {
      payload.price_updated_at = new Date().toISOString();
    }

    // On met toujours à jour updated_at pour les autres modifs
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("mode_pricing")
      .upsert(payload, { onConflict: "mint_url" })
      .select("*")
      .single();

    if (error) {
      console.error("❌ savePricingRow:", error);
      setPricingError(error.message);
      return;
    }

    setPricingByUrl((prev) => ({ ...prev, [data.mint_url]: data }));
    setPricingRow(data); // <- important: reflète ce qui est en base
  } finally {
    setPricingSaving(false);
  }
};

// ===== AUTO-UPSERT: pour promo/acheteur/autres champs =====
const autoUpsertPricingField = async (mintUrl, field, value) => {
  if (!mintUrl) return;

  try {
    const payload = {
      mint_url: mintUrl,
      [field]: value,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("mode_pricing")
      .upsert(payload, { onConflict: "mint_url" })
      .select("*")
      .single();

    if (error) {
      console.error(`❌ autoUpsertPricingField (${field}):`, error);
      return;
    }

    // Mise à jour du cache local
    setPricingByUrl((prev) => ({ ...prev, [data.mint_url]: data }));
    
    // Si c'est le vélo actuellement sélectionné, màj aussi pricingRow
    if (selectedVelo?.URL === mintUrl) {
      setPricingRow(data);
    }
  } catch (e) {
    console.error(`❌ autoUpsertPricingField exception (${field}):`, e);
  }
};

useEffect(() => {
  if (pricingMode) {
    // on sauvegarde le tri actuel pour le restaurer ensuite
    prevSortConfigRef.current = sortConfig;

    // on bascule sur "date du dernier scraping" par défaut
    setSortConfig({ key: "Updated At", direction: "desc" });
  } else {
    // on restaure le tri d'avant
    setSortConfig(prevSortConfigRef.current || { key: null, direction: "asc" });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pricingMode]);


useEffect(() => {
  const run = async () => {
    if (!pricingMode) {
      setPricingRow(null);
      setPricingError(null);
      return;
    }
    if (!selectedVelo?.URL) {
      setPricingRow(null);
      return;
    }

    setPricingLoading(true);
    setPricingError(null);

    try {
      const row = await ensurePricingRow(selectedVelo.URL);
      setPricingRow(row ? computePricing(row, selectedVelo) : null);
    } catch (e) {
      setPricingError(String(e?.message || e));
      setPricingRow(null);
    } finally {
      setPricingLoading(false);
    }
  };

  run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pricingMode, selectedVelo?.URL]);

/* -------- Règles ouverture modale Parking -------- */
useEffect(() => {
  if (!parkingOpen) return;
  loadBrandTiersIndex();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [parkingOpen]);


// 👉 Recharger les notes quand on ouvre un vélo
useEffect(() => {
  if (selectedVelo?.URL) {
    fetchNotes(selectedVelo.URL).then(() => {
      setDraftNote(notes[currentUserName] || "");
    });  
  }
}, [selectedVelo?.URL]);



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
    
    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .neq("status", "publie"); // Seulement les vélos non publiés
      if (error) {
        console.error("Erreur chargement inventory:", error);
        setInventoryVelos([]);
        return;
      }
      setInventoryVelos(data || []);
    };
    
    fetchVelos();
    fetchInventory();
    fetchLastUpdate();
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
  const tokens = tokenizeSearch(f.title);

  if (tokens.length) {
    items = items.filter((v) => {
      const hay = buildSearchHaystack(v);
      return tokens.every((t) => hay.includes(t));
    });
  }
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
  // ⚠️ Seulement filtrer si des catégories sont explicitement sélectionnées
  if (f.categories && f.categories.length > 0) {
    items = applyMulti(items, "Catégorie", f.categories);
  }
  if (f.typesVelo && f.typesVelo.length > 0) {
    items = applyMulti(items, "Type de vélo", f.typesVelo);
  }
  // Autres multi-selects (comportement standard - filtre seulement si rempli)
  items = applyMulti(items, "Taille du cadre", f.taillesCadre);
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

  // === 6) FILTRES PRICING ===
  // Filtre par acheteur (multi-select)
  if (f.pricingBuyers && f.pricingBuyers.length > 0) {
    items = items.filter((v) => {
      const mintUrl = v?.URL;
      if (!mintUrl) return false;
      const pRow = pricingByUrl[mintUrl];
      if (!pRow) return false;
      return f.pricingBuyers.includes(pRow.buyer || "");
    });
  }

  // Filtre par type de vendeur (multi-select)
  if (f.pricingSellerTypes && f.pricingSellerTypes.length > 0) {
    items = items.filter((v) => {
      const mintUrl = v?.URL;
      if (!mintUrl) return false;
      const pRow = pricingByUrl[mintUrl];
      if (!pRow) return false;
      return f.pricingSellerTypes.includes(pRow.seller_type || "");
    });
  }

  // Filtre par montant de marge (utilise la même fonction que les cartes)
  if (f.pricingMarginMin !== undefined || f.pricingMarginMax !== undefined) {
    items = items.filter((v) => {
      const mintUrl = v?.URL;
      if (!mintUrl) return true;
      const pRow = pricingByUrl[mintUrl];
      if (!pRow) return true;
      
      // Utilise la même fonction que l'affichage des cartes
      const marge = computeCardBenefit(v, pRow)?.eur;
      if (marge === null || marge === undefined) return true;

      if (f.pricingMarginMin !== undefined && marge < f.pricingMarginMin) return false;
      if (f.pricingMarginMax !== undefined && marge > f.pricingMarginMax) return false;
      return true;
    });
  }

  // Filtre par date d'achat (intervalle)
  if (f.pricingDateAchatMin || f.pricingDateAchatMax) {
    items = items.filter((v) => {
      const mintUrl = v?.URL;
      if (!mintUrl) return true;
      const pRow = pricingByUrl[mintUrl];
      if (!pRow || !pRow.purchase_date) return true;
      
      const purchaseDate = new Date(pRow.purchase_date).getTime();
      if (isNaN(purchaseDate)) return true;
      
      if (f.pricingDateAchatMin) {
        const minDate = new Date(f.pricingDateAchatMin).getTime();
        if (purchaseDate < minDate) return false;
      }
      if (f.pricingDateAchatMax) {
        const maxDate = new Date(f.pricingDateAchatMax).getTime();
        if (purchaseDate > maxDate) return false;
      }
      return true;
    });
  }

  // Filtre best_used_url vide
  if (f.pricingBestUsedUrlEmpty) {
    items = items.filter((v) => {
      const mintUrl = v?.URL;
      if (!mintUrl) return false;
      const pRow = pricingByUrl[mintUrl];
      if (!pRow) return false;
      return !pRow.best_used_url || pRow.best_used_url.trim() === "";
    });
  }

  return items;
};

  /* -------- Filtrer + Trier (PIPELINE UNIQUE) -------- */
  const filteredAndSortedVelos = useMemo(() => {
  let items = applyAllFilters(velos, deferredFilters); // ← utilise les filtres différés
  

  // Tri (on garde ta logique)
  if (sortConfig.key) {
    const key = sortConfig.key;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    items.sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
// ----- Champs virtuels Pricing -----
if (key === "PRICING_BRAND_CATEGORY") {
  aVal = pricingByUrl?.[a?.URL]?.brand_category ?? null;
  bVal = pricingByUrl?.[b?.URL]?.brand_category ?? null;
}

if (key === "PRICING_BENEFICE") {
  const pa = pricingByUrl?.[a?.URL];
  const pb = pricingByUrl?.[b?.URL];
  aVal = computeCardBenefit(a, pa)?.eur;
  bVal = computeCardBenefit(b, pb)?.eur;
}

if (key === "PRICING_BENEFICE_PCT") {
  const pa = pricingByUrl?.[a?.URL];
  const pb = pricingByUrl?.[b?.URL];
  aVal = computeCardBenefit(a, pa)?.pct;
  bVal = computeCardBenefit(b, pb)?.pct;
}

if (key === "PRICING_BUY_PRICE") {
  const pa = pricingByUrl?.[a?.URL];
  const pb = pricingByUrl?.[b?.URL];
  // prix d'achat = négocié si dispo, sinon optimisé
  aVal = pa?.negotiated_buy_price ?? pa?.optimized_buy_price ?? null;
  bVal = pb?.negotiated_buy_price ?? pb?.optimized_buy_price ?? null;
}

if (key === "PRICING_UPDATED_AT") {
  aVal = pricingByUrl?.[a?.URL]?.price_updated_at ?? null;
  bVal = pricingByUrl?.[b?.URL]?.price_updated_at ?? null;

  const at = parseDateFlexible(aVal);
  const bt = parseDateFlexible(bVal);

  if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
  if (Number.isNaN(at)) return 1 * dir;
  if (Number.isNaN(bt)) return -1 * dir;
  return (at - bt) * dir;
}


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
}, [velos, deferredFilters, sortConfig]);

// =========================
// 📊 Liste combinée selon stockMode
// =========================
const combinedVelosForStats = useMemo(() => {
  if (stockMode === "vente") {
    return filteredAndSortedVelos;
  } else if (stockMode === "inventory") {
    // Convertir inventory au format velosmint
    return inventoryVelos.map(inv => ({
      "Catégorie": inv.type_velo,
      "Type de vélo": inv.is_vae ? "Électrique" : "Musculaire",
      "Marque": inv.marque,
      "Modèle": inv.modele,
      "Prix réduit": inv.prix_occasion_marche,
      "Stock variant 1": 1,
      "_isInventory": true,
      "_original": inv
    }));
  } else {
    // Mode "tous" : combiner filteredAndSortedVelos + inventory
    const inventoryAsVelos = inventoryVelos.map(inv => ({
      "Catégorie": inv.type_velo,
      "Type de vélo": inv.is_vae ? "Électrique" : "Musculaire",
      "Marque": inv.marque,
      "Modèle": inv.modele,
      "Prix réduit": inv.prix_occasion_marche,
      "Stock variant 1": 1,
      "_isInventory": true,
      "_original": inv
    }));
    return [...filteredAndSortedVelos, ...inventoryAsVelos];
  }
}, [filteredAndSortedVelos, inventoryVelos, stockMode]);

const pricingDisplayedStockUnits = useMemo(() => {
  return sumTotalStock(filteredAndSortedVelos);
}, [filteredAndSortedVelos]);

const pricingTotalStockUnits = useMemo(() => {
  return sumTotalStock(velos);
}, [velos]);

const statsData = useMemo(() => {
  // Ne calcule les stats que si l'onglet est visible
  if (!isTabVisible) return null;
  
  // Les stats détaillées ne fonctionnent que pour les vélos en vente
  // car ils ont pricing, Published At, etc.
  const list = filteredAndSortedVelos || [];
// =====================
// ✅ NOUVELLES MÉTRIQUES (base = unités 📦)
// =====================
let stockValueEur = 0;            // Valeur stock € = (prix de vente Mint) * unités
let benefitTotalEur = 0;          // Somme bénéfices pondérés unités (pour "moy marge totale")
let benefitTotalUnits = 0;        // Unités avec bénéfice calculable
// ✅ KPIs promo (pondérés unités)
let promoUnits = 0;
let promoTotalEur = 0;
let promoMaxEur = 0;

const listingAges = [];           // jours depuis Published At (VelosMint)
const listingAgeUnits = [];       // pondération unités

const stockAges = [];             // jours depuis purchase_date (mode_pricing)
const stockAgeUnits = [];         // pondération unités

// Mix typologie (unités)
const typologyUnits = {};         // { "VTT": 12, "VTT AE": 8, ... }

// Elec/Muscu (unités)
let elecUnits = 0;
let muscuUnits = 0;
let unknownPowerUnits = 0;

  // On construit des tableaux parallèles : prix[], bénéfice[], daysPricing[], et weightUnits[]
  const prices = [];
  const priceUnits = [];

  const benefits = [];
  const benefitUnits = [];

  const pricingAges = [];
  const pricingAgeUnits = [];
  const weightedAvg = (values, weights) => {
  let s = 0;
  let w = 0;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    const wt = weights[i];
    if (!Number.isFinite(val) || !Number.isFinite(wt) || wt <= 0) continue;
    s += val * wt;
    w += wt;
  }
  return w > 0 ? s / w : null;
};

// Normalise tes catégories vers la liste demandée
const normalizeTypology = (catRaw, typeVeloRaw) => {
  const cat = String(catRaw ?? "").toUpperCase();
  const typeVelo = String(typeVeloRaw ?? "").toUpperCase(); // "ELECTRIQUE" / "MUSCULAIRE"

  const isElec = typeVelo.includes("ELECT");

  // Tu peux ajuster si tes libellés diffèrent
  if (cat.includes("VILLE")) return "VILLE";
  if (cat.includes("VTT")) return isElec ? "VTT AE" : "VTT";
  if (cat.includes("GRAVEL") || cat.includes("GRVL")) return isElec ? "GRVL AE" : "GRVL";
  if (cat.includes("ROUTE") || cat.includes("RT") || cat.includes("VR")) return isElec ? "VR AE" : "VR";

  return "Autre";
};

  for (const v of list) {
    const units = getRowTotalStock(v); // ✅ pondération = stock du vélo
    if (!Number.isFinite(units) || units <= 0) continue;
    const pr = pricingByUrl?.[v?.URL];

    // ✅ Valeur stock € = prix réduit Mint * unités
const salePrice = parseNumericValue(v?.["Prix réduit"]);
if (Number.isFinite(salePrice)) {
  stockValueEur += salePrice * units;
}

// ✅ Durée mise en ligne (Published At dans VelosMint)
const dListing = daysSince(v?.["Published At"]);
if (Number.isFinite(dListing)) {
  listingAges.push(dListing);
  listingAgeUnits.push(units);
}

// ✅ Moy marge totale (bénéfice moyen par unité)
const bUnit = computeCardBenefit(v, pr)?.eur;
if (Number.isFinite(bUnit)) {
  benefitTotalEur += bUnit * units;
  benefitTotalUnits += units;
}

// ✅ Mix typologie (unités)
const typ = normalizeTypology(v?.["Catégorie"], v?.["Type de vélo"]);
typologyUnits[typ] = (typologyUnits[typ] ?? 0) + units;

// ✅ Elec / Muscu (unités) via "Type de vélo" (VelosMint)
const power = String(v?.["Type de vélo"] ?? "").toUpperCase();
if (power.includes("ELECT")) elecUnits += units;
else if (power.includes("MUSC")) muscuUnits += units;
else unknownPowerUnits += units;

    const price = parseNumericValue(v?.["Prix réduit"]);
    if (Number.isFinite(price)) {
      prices.push(price);
      priceUnits.push(units);
    }

    const p = pricingByUrl?.[v?.URL];
    const b = computeCardBenefit(v, p)?.eur;
    if (Number.isFinite(b)) {
      benefits.push(b);
      benefitUnits.push(units);
    }

    const d = daysSince(p?.updated_at);
    if (Number.isFinite(d)) {
      pricingAges.push(d);
      pricingAgeUnits.push(units);
    }
  }

  // BINS
  const priceBins = [
    { label: "< 1k", min: 0, max: 1000 },
    { label: "1k–1.5k", min: 1000, max: 1500 },
    { label: "1.5k–2k", min: 1500, max: 2000 },
    { label: "2k–2.5k", min: 2000, max: 2500 },
    { label: "2.5k–3k", min: 2500, max: 3000 },
    { label: "3k+", min: 3000, max: Infinity },
  ];

  const benefitBins = [
  { label: "< -500", min: -999999, max: -500 },

  { label: "-500 – -300", min: -500, max: -300 },
  { label: "-300 – -100", min: -300, max: -100 },
  { label: "-100 – 0", min: -100, max: 0 },

  { label: "0 – 200", min: 0, max: 200 },
  { label: "200 – 400", min: 200, max: 400 },
  { label: "400 – 600", min: 400, max: 600 },
  { label: "600 – 800", min: 600, max: 800 },
  { label: "800 – 1000", min: 800, max: 1000 },
  { label: "1000 – 1200", min: 1000, max: 1200 },
  { label: "1200 – 1400", min: 1200, max: 1400 },
  { label: "1400 – 1500", min: 1400, max: 1500 },

  { label: "≥ 1500", min: 1500, max: Infinity },
];


  // =====================
// ✅ BINS DURÉES (jours)
// =====================
const ageBins = [
  { label: "≤21j", min: 0, max: 21 },
  { label: "22–42j", min: 21, max: 42 },
  { label: "43–63j", min: 42, max: 63 },
  { label: "64–84j", min: 63, max: 84 },
  { label: ">84j", min: 84, max: Infinity },
];

const listingAgeDist = bucketizeWeighted(listingAges, listingAgeUnits, ageBins);

// =====================
// ✅ MIX TYPOLOGIE / ELEC-MUSCU (unités)
// =====================
// Recalculer pour le mode sélectionné
let finalTypologyUnits = typologyUnits;
let finalElecUnits = elecUnits;
let finalMuscuUnits = muscuUnits;
let finalUnknownPowerUnits = unknownPowerUnits;

if (stockMode !== "vente") {
  // Recalculer avec combinedVelosForStats
  finalTypologyUnits = {};
  finalElecUnits = 0;
  finalMuscuUnits = 0;
  finalUnknownPowerUnits = 0;
  
  for (const v of combinedVelosForStats) {
    const units = getRowTotalStock(v);
    if (!Number.isFinite(units) || units <= 0) continue;
    
    const typ = normalizeTypology(v?.["Catégorie"], v?.["Type de vélo"]);
    finalTypologyUnits[typ] = (finalTypologyUnits[typ] ?? 0) + units;
    
    const power = String(v?.["Type de vélo"] ?? "").toUpperCase();
    if (power.includes("ELECT")) finalElecUnits += units;
    else if (power.includes("MUSC")) finalMuscuUnits += units;
    else finalUnknownPowerUnits += units;
  }
}

const mixTypology = Object.entries(finalTypologyUnits)
  .map(([name, units]) => ({ name, units }))
  .filter((x) => x.units > 0);

const elecMuscu = [
  { name: "Électrique", units: finalElecUnits },
  { name: "Musculaire", units: finalMuscuUnits },
  { name: "Inconnu", units: finalUnknownPowerUnits },
].filter((x) => x.units > 0);

// =====================
// ✅ KPIs moyens (pondérés unités)
// =====================
// KPI base = unités
const totalUnits = sumTotalStock(list);

const avgListingDays = weightedAvg(listingAges, listingAgeUnits);


const avgBenefitPerUnit = benefitTotalUnits > 0 ? (benefitTotalEur / benefitTotalUnits) : null;

  // HISTOS (en unités)
  const priceHisto = bucketizeWeighted(prices, priceUnits, priceBins);
  const benefitHisto = bucketizeWeighted(benefits, benefitUnits, benefitBins);


  // % marge négative (pondéré unités) :
  // base = unités des vélos où on a un bénéfice calculable
  const totalUnitsWithBenefit = benefitUnits.reduce((s, u) => s + u, 0);
  const negUnits = benefits.reduce((acc, b, i) => acc + (b < 0 ? benefitUnits[i] : 0), 0);
  const negPctUnits = totalUnitsWithBenefit > 0 ? Math.round((negUnits / totalUnitsWithBenefit) * 100) : 0;

  // % à repricer >15j (pondéré unités)
  const totalUnitsWithPricingDate = pricingAgeUnits.reduce((s, u) => s + u, 0);
  const repricingUnits = pricingAges.reduce((acc, d, i) => acc + (d > 15 ? pricingAgeUnits[i] : 0), 0);
  const repricingPctUnits = totalUnitsWithPricingDate > 0 ? Math.round((repricingUnits / totalUnitsWithPricingDate) * 100) : 0;

  // “médiane bénéfice” pondérée unités = plus complexe.
  // V1 simple : on garde la médiane simple (par vélo). (Si tu veux, je te fais la weighted median après.)
  const medBenefit = median(benefits);
  let partnerUnits = 0;
let onsiteUnits = 0;
let unknownUnits = 0;


for (const v of list) {
  const split = getRowLocationSplitUnits(v); // {partner, onsite, unknown}
  partnerUnits += split.partner;
  onsiteUnits += split.onsite;
  unknownUnits += split.unknown;
}

let saleTot = 0;
let buyTot = 0;
let partsTot = 0;
let logisticsTot = 0;
let marginTot = 0;

const marginAgeScatter = []; // points scatter (1 point = 1 annonce)

// list = ta liste filtrée (celle qui sert déjà à tes stats)
for (const v of list) {
  const units = getRowTotalStock(v); // 📦 unités dispo
  if (!Number.isFinite(units) || units <= 0) continue;

  // mode_pricing est indexé par mint_url (chez toi = v.URL)
  const pr = pricingByUrl?.[v?.URL];
// ✅ Promo = basé sur velosmint."Montant promo" (format: "-350 €")
const promoRaw = v?.["Montant promo"];
const promoValue = promoRaw ? parseNumericValue(promoRaw) : 0;
const promo = Math.abs(promoValue) || 0;
if (Number.isFinite(promo) && promo > 0) {
  promoUnits += units;
  promoTotalEur += promo * units;
  promoMaxEur = Math.max(promoMaxEur, promo);
}

  const b = getSaleBreakdownFromModePricing(v, pr);
  if (!b) continue;
  
  // ✅ Scatter: X = jours depuis mise en ligne (Published At), Y = marge €/unité
  const publishedAt = v?.["Published At"];
  const dListing = daysSince(publishedAt);
  const mUnit = b.margin; // marge €/unité

  if (Number.isFinite(dListing) && dListing >= 0 && Number.isFinite(mUnit)) {
    const point = {
      age: dListing,
      benefit: mUnit,
      units,
      brand: v?.["Marque"] || "Inconnue",
      model: v?.["Modèle"] || "",
      year: v?.["Année"] || "",
      title: v?.Title || v?.["Title"] || "",
      url: v?.URL || "",
      price: b.sale,
      promo: Number(pr?.mint_promo_amount ?? 0),
    };
    
    // Debug: afficher quelques points
    if (marginAgeScatter.length < 5) {
      console.log("📍 Scatter point:", {
        publishedAt,
        age: dListing,
        benefit: mUnit,
        brand: point.brand,
        model: point.model,
        url: point.url
      });
    }
    
    marginAgeScatter.push(point);
  }

  saleTot += b.sale * units;
  buyTot += b.buy * units;
  partsTot += b.parts * units;
  logisticsTot += b.logistics * units;
  marginTot += b.margin * units;
}
// ✅ KPI promo (à faire après avoir rempli promoUnits)
const promoPctUnits = totalUnits > 0 ? Math.round((promoUnits / totalUnits) * 100) : 0;
const promoAvgEur = promoUnits > 0 ? (promoTotalEur / promoUnits) : 0;


// Camembert ne supporte pas les valeurs négatives.
// Donc si la marge est négative, on met une part "Dépassement coûts"
const overCostTot = Math.max(0, -marginTot);
const marginNonNegTot = Math.max(0, marginTot);

const saleBreakdownPie = saleTot > 0 ? [
  { name: "Prix d'achat", value: buyTot },
  { name: "Pièces", value: partsTot },
  { name: "Logistique", value: logisticsTot },
  ...(overCostTot > 0 ? [{ name: "Dépassement coûts", value: overCostTot }] : []),
  ...(marginNonNegTot > 0 ? [{ name: "Marge", value: marginNonNegTot }] : []),
] : [];

// Calculer locationPie selon le mode
let locationPie = [];
if (stockMode === "vente") {
  locationPie = [
    { name: "Fleeta (MPE)", units: partnerUnits },
    { name: "Mint Bikes", units: onsiteUnits },
    { name: "Inconnu", units: unknownUnits },
  ].filter((x) => x.units > 0);
} else if (stockMode === "inventory" || stockMode === "tous") {
  // Pour inventory : compter les serial_number qui commencent par "MPE"
  let inventoryPartnerUnits = 0;
  let inventoryOnsiteUnits = 0;
  
  for (const v of combinedVelosForStats) {
    if (v._isInventory && v._original) {
      const serial = String(v._original.serial_number || "").trim().toUpperCase();
      if (serial.startsWith("MPE")) {
        inventoryPartnerUnits += 1;
      } else if (serial) {
        inventoryOnsiteUnits += 1;
      }
    } else if (stockMode === "tous") {
      // Pour mode "tous", ajouter aussi les vélos en vente
      const split = getRowLocationSplitUnits(v);
      inventoryPartnerUnits += split.partner;
      inventoryOnsiteUnits += split.onsite;
    }
  }
  
  locationPie = [
    { name: "Fleeta (MPE)", units: inventoryPartnerUnits },
    { name: "Mint Bikes", units: inventoryOnsiteUnits },
  ].filter((x) => x.units > 0);
}

// NOUVEAU : Marge moyenne par marque
const brandBenefitMap = {};
for (const v of list) {
  const units = getRowTotalStock(v);
  if (!units || units <= 0) continue;
  
  const benefit = computeCardBenefit(v)?.eur;
  if (!Number.isFinite(benefit)) continue;
  
  const brand = String(v?.Marque || "Inconnu").trim();
  if (!brandBenefitMap[brand]) {
    brandBenefitMap[brand] = { totalBenefit: 0, totalUnits: 0 };
  }
  brandBenefitMap[brand].totalBenefit += benefit * units;
  brandBenefitMap[brand].totalUnits += units;
}

const brandBenefit = Object.entries(brandBenefitMap)
  .map(([brand, data]) => ({
    brand,
    avgBenefit: data.totalUnits > 0 ? data.totalBenefit / data.totalUnits : 0,
    units: data.totalUnits,
  }))
  .sort((a, b) => b.avgBenefit - a.avgBenefit);

// NOUVEAU : Prix moyen par catégorie
const categoryPriceMap = {};
const listForCategoryPrice = stockMode === "vente" ? list : combinedVelosForStats;
for (const v of listForCategoryPrice) {
  const units = getRowTotalStock(v);
  if (!units || units <= 0) continue;
  
  const price = parseNumericValue(v?.["Prix réduit"]);
  if (!Number.isFinite(price)) continue;
  
  const category = String(v?.Catégorie || "Autre").trim();
  if (!categoryPriceMap[category]) {
    categoryPriceMap[category] = { totalPrice: 0, totalUnits: 0 };
  }
  categoryPriceMap[category].totalPrice += price * units;
  categoryPriceMap[category].totalUnits += units;
}

const categoryPrice = Object.entries(categoryPriceMap)
  .map(([category, data]) => ({
    category,
    avgPrice: data.totalUnits > 0 ? data.totalPrice / data.totalUnits : 0,
    units: data.totalUnits,
  }))
  .sort((a, b) => b.avgPrice - a.avgPrice);


  const statsResult = {
  priceHisto,
  benefitHisto,
  locationPie, // Calculé dynamiquement selon stockMode
  kpi: {
    totalUnits: stockMode === "vente" ? totalUnits : sumTotalStock(combinedVelosForStats),
    negPctUnits: stockMode === "vente" ? negPctUnits : 0,
    medBenefit: stockMode === "vente" ? medBenefit : null,
    repricingPctUnits: stockMode === "vente" ? repricingPctUnits : 0,
    nRows: stockMode === "vente" ? list.length : combinedVelosForStats.length,
    partnerUnits: stockMode === "vente" ? partnerUnits : 0,
    onsiteUnits: stockMode === "vente" ? onsiteUnits : 0,
    unknownUnits: stockMode === "vente" ? unknownUnits : 0,
    promoPctUnits: stockMode === "vente" ? promoPctUnits : 0,
    promoUnits: stockMode === "vente" ? promoUnits : 0,
    promoTotalEur: stockMode === "vente" ? promoTotalEur : 0,
    promoAvgEur: stockMode === "vente" ? promoAvgEur : 0,
    promoMaxEur: stockMode === "vente" ? promoMaxEur : 0,
  },
  saleBreakdownPie: stockMode === "vente" ? saleBreakdownPie : [],
saleTotals: stockMode === "vente" ? { saleTot, buyTot, partsTot, logisticsTot, marginTot } : { saleTot: 0, buyTot: 0, partsTot: 0, logisticsTot: 0, marginTot: 0 },
stockValueEur: stockMode === "vente" ? stockValueEur : (() => {
  // Calculer stockValue pour inventory/tous : somme des prix_occasion_marche (prix de vente estimé)
  let total = 0;
  for (const v of combinedVelosForStats) {
    if (v._isInventory && v._original) {
      // Pour inventory : utiliser prix_occasion_marche (prix de vente estimé)
      const prixVente = Number(v._original.prix_occasion_marche) || 0;
      total += prixVente; // Chaque ligne = 1 unité
    } else {
      // Pour vélos en vente (mode "tous")
      const units = getRowTotalStock(v);
      const price = parseNumericValue(v?.["Prix réduit"]);
      if (Number.isFinite(price) && Number.isFinite(units)) {
        total += price * units;
      }
    }
  }
  return total;
})(),
stockValueBuyEur: stockMode === "vente" ? buyTot : (() => {
  // Calculer valeur au prix d'achat pour inventory/tous
  let total = 0;
  for (const v of combinedVelosForStats) {
    if (v._isInventory && v._original) {
      // Pour inventory : utiliser prix_achat_negocie (prix d'achat)
      const prixAchat = Number(v._original.prix_achat_negocie) || 0;
      total += prixAchat; // Chaque ligne = 1 unité
    } else {
      // Pour vélos en vente : utiliser buyTot si disponible via pricing
      const units = getRowTotalStock(v);
      const pr = pricingByUrl?.[v?.URL];
      const b = getSaleBreakdownFromModePricing(v, pr);
      if (b && Number.isFinite(b.buy) && Number.isFinite(units)) {
        total += b.buy * units;
      }
    }
  }
  return total;
})(),
  avgListingDays: stockMode === "vente" ? avgListingDays : null,
  avgBenefitPerUnit: stockMode === "vente" ? avgBenefitPerUnit : (() => {
    // Pour inventory : marge = prix_occasion_marche - prix_achat_negocie - frais_pieces_estimes
    if (stockMode === "inventory" || stockMode === "tous") {
      let totalBenefit = 0;
      let totalUnits = 0;
      for (const v of combinedVelosForStats) {
        if (v._isInventory) {
          const inv = v._original;
          const prixVente = Number(inv.prix_occasion_marche) || 0;
          const prixAchat = Number(inv.prix_achat_negocie) || 0;
          const fraisPieces = Number(inv.frais_pieces_estimes) || 0;
          const marge = prixVente - prixAchat - fraisPieces;
          totalBenefit += marge;
          totalUnits += 1;
        }
      }
      return totalUnits > 0 ? totalBenefit / totalUnits : null;
    }
    return null;
  })(),

  listingAgeDist: stockMode === "vente" ? listingAgeDist : [],
  mixTypology,
  elecMuscu,
  marginAgeScatter: stockMode === "vente" ? marginAgeScatter : [],
  brandBenefit: stockMode === "vente" ? brandBenefit : [],
  categoryPrice,
  scatterBenefitAge: stockMode === "vente" ? marginAgeScatter : [],
};

console.log("📊 Stats Debug:", {
  priceHisto: statsResult.priceHisto?.length,
  benefitHisto: statsResult.benefitHisto?.length,
  listingAgeDist: statsResult.listingAgeDist?.length,
  mixTypology: statsResult.mixTypology?.length,
  elecMuscu: statsResult.elecMuscu?.length,
  locationPie: statsResult.locationPie?.length,
  marginAgeScatter: statsResult.marginAgeScatter?.length,
  brandBenefit: statsResult.brandBenefit?.length,
  categoryPrice: statsResult.categoryPrice?.length,
});

return statsResult;
}, [filteredAndSortedVelos, pricingByUrl, isTabVisible, stockMode, combinedVelosForStats]);

  /* -------- Utilitaires sélection -------- */
  const toggleSelect = (url) => setSelected((prev) => ({ ...prev, [url]: !prev[url] }));
  const resetSelection = () => setSelected({});
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const selectAllDisplayed = () => {
  setSelected((prev) => {
    const next = { ...prev };
    for (const v of filteredAndSortedVelos) {
      if (v?.URL) next[v.URL] = true;
    }
    return next;
  });
};

// placeholders (tu complèteras après)
const bulkCreatePromo = () => {
  promo_openModal();
};

const openParkingVirtuelTool = () => {
  alert("🅿️ Outil Parking Virtuel — à brancher (v1 bientôt)");
};

const openPriceTool = () => {
  setPriceToolOpen(true);
  setPriceToolForm({
    brand: "",
    model: "",
    year: new Date().getFullYear().toString(),
    size: "",
    category: "",
    estimatedPrice: "",
  });
  setPriceToolCompetitorLinks([]);
  setPriceToolShowCompetitors(false);
};

// ✅ Générer les liens de recherche concurrence pour Outil Prix
const generatePriceToolCompetitorLinks = () => {
  const { brand, model, year } = priceToolForm;
  if (!brand || !model || !year) return [];

  const query = `${brand} ${model} ${year}`;
  const queryNoYear = `${brand} ${model}`;
  const qWithYear = encodeURIComponent(query);
  const qNoYear = encodeURIComponent(queryNoYear);

  // Déterminer si électrique (basé sur la catégorie ou un indicateur)
  const isElectric = priceToolForm.category?.toLowerCase().includes("électrique");

  const googleUrl = `https://www.google.com/search?q=${qWithYear}`;
  const buycycleUrl = `https://buycycle.com/fr-fr/shop/min-year/${encodeURIComponent(year)}/search/${qNoYear}/sort-by/lowest-price`;
  const leboncoinUrl = `https://www.leboncoin.fr/recherche?category=55&text=${qNoYear}&sort=price&order=asc`;
  const upwayUrl = `https://upway.fr/search?q=${qWithYear}`;
  const tuvalumUrl = `https://tuvalum.fr/search?sort_by=price-ascending&grid=default&q=${qWithYear}`;
  const zycloraUrl = `https://zyclora.fr/#210c/fullscreen/m=or&q=${qWithYear}`;
  const rebikeUrl = `https://rebike.fr/search?q=${qWithYear}`;

  const links = [
    { label: "🔍 Google", url: googleUrl, color: "#4285F4" },
    { label: "🚴 Buycycle", url: buycycleUrl, color: "#00A651" },
    { label: "🛒 Leboncoin", url: leboncoinUrl, color: "#FF6E14" },
    { label: "📦 Tuvalum", url: tuvalumUrl, color: "#7C3AED" },
    { label: "🔄 Zyclora", url: zycloraUrl, color: "#0EA5E9" },
    { label: "♻️ Rebike", url: rebikeUrl, color: "#10B981" },
  ];

  if (isElectric) {
    links.push({ label: "⚡ Upway", url: upwayUrl, color: "#F59E0B" });
  }

  return links;
};

// ✅ Déclencher la recherche de concurrence
const handlePriceToolSearchCompetitors = () => {
  const links = generatePriceToolCompetitorLinks();
  setPriceToolCompetitorLinks(links);
  setPriceToolShowCompetitors(true);
};


const bulkLinkBikes = () => {
  alert("🟠 Lier les vélos : à brancher ensuite");
};

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
      const kmFmt = formatKm(v.Kilométrage);

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
          ' &nbsp;•&nbsp; <span><b>Taille:</b> ', (formatFrameSizes(v) || 'N/A'), '</span>',
          ' &nbsp;•&nbsp; <span><b>Kilométrage:</b> ', kmFmt, '</span>',
        '</div>',
        // ← ICI on insère le bloc "Pourquoi il va vous plaire"
        (renderWhyEmail(v["Points forts"]) || ''),
        // Prix (barré + % rouge) — compatible Pipedrive
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
    <>
      <style>{`
        .tier-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .tier-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .tier-velos-tooltip {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          z-index: 1000;
          min-width: 320px;
        }
        
        .tier-card-hover:hover .tier-velos-tooltip {
          display: block;
        }
      `}</style>
      
      {!rulesReady ? (
        <div style={{padding:40, fontWeight:700, fontSize:18, color:'#1e293b'}}>Chargement des objectifs…</div>
      ) : (
        <>
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
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    {/* ===== SWITCH MODE = TITRE ===== */}
<div
  role="tablist"
  aria-label="Sélecteur de mode"
  style={{
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid rgba(0,0,0,0.14)",
    borderRadius: 999,
    overflow: "hidden",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
  }}
>
  {/* CONSEILLER */}
  <button
    type="button"
    onClick={() => {
      setPricingMode(false);
      setSelected({});
    }}
    title="Mode conseiller"
    style={{
      padding: "10px 20px",
      border: "none",
      cursor: "pointer",
      background: !pricingMode ? "var(--mint-green)" : "transparent",
      color: "#111827",
      fontSize: 18,              // 👈 taille titre
      fontWeight: !pricingMode ? 900 : 600,
      letterSpacing: "-0.01em",
      opacity: !pricingMode ? 1 : 0.55,
      transition: "all .18s ease",
      transform: !pricingMode ? "translateY(-1px)" : "translateY(0)",
      boxShadow: !pricingMode ? "0 10px 18px rgba(44,167,106,0.25)" : "none",
      lineHeight: 1.1,
    }}
  >
    Portail Conseiller
  </button>

  {/* PRICING */}
  <button
    type="button"
    onClick={() => {
      setPricingMode(true);
      setSelected({});
    }}
    title="Mode pricing"
    style={{
      padding: "10px 20px",
      border: "none",
      cursor: "pointer",
      background: pricingMode ? "var(--mint-green)" : "transparent",
      color: "#111827",
      fontSize: 18,              // 👈 même taille titre
      fontWeight: pricingMode ? 900 : 600,
      letterSpacing: "-0.01em",
      opacity: pricingMode ? 1 : 0.55,
      transition: "all .18s ease",
      transform: pricingMode ? "translateY(-1px)" : "translateY(0)",
      boxShadow: pricingMode ? "0 10px 18px rgba(44,167,106,0.25)" : "none",
      lineHeight: 1.1,
    }}
  >
    Portail Pricing
  </button>
</div>


    {/* ===== LAST UPDATE ===== */}
    {lastUpdate && (
      <span
        className="last-update"
        style={{
          fontSize: 12,
          color: "#6b7280",
          whiteSpace: "nowrap",
        }}
      >
        mis à jour {timeAgoFr(lastUpdate)}
      </span>
    )}
  </div>
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
        placeholder="Titre / marque / modèle / n° de série…"
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

    {/* Reset sélection (toujours visible) */}
    <button
      onClick={resetSelection}
      className="icon-btn"
      title="Réinitialiser la sélection"
      disabled={selectedCount === 0}
    >
      <FaSyncAlt />
    </button>

    {/* ===== MODE NORMAL ===== */}
    {!pricingMode && (
      <>
        <button
          onClick={() => setShowPreview(true)}
          className="icon-btn"
          title="Prévisualiser le mail"
          disabled={selectedCount === 0}
        >
          <FaEnvelope />
        </button>

        <button
          onClick={() => {
            const txt = buildSmsFromSelection();
            if (!txt || Object.values(selected).every((v) => !v)) {
              alert("⚠️ Sélectionne au moins 1 vélo pour préparer le SMS !");
              return;
            }
            setSmsText(txt);
            setShowSmsModal(true);
          }}
          className="icon-btn"
          title="Prévisualiser le SMS"
          disabled={selectedCount === 0}
        >
          <FaSms />
        </button>

        <button
          onClick={() => setShowCompare(true)}
          className="icon-btn"
          title="Comparer"
          disabled={selectedCount < 2}
        >
          <FaBalanceScale />
        </button>
      </>
    )}

    {/* ===== MODE PRICING ===== */}
{pricingMode && (
  <>
    <button
      onClick={selectAllDisplayed}
      className="icon-btn"
      title="Sélectionner tous les vélos affichés"
      disabled={filteredAndSortedVelos.length === 0}
    >
      <FaCheckSquare />
    </button>

    <button
      onClick={bulkCreatePromo}
      className="icon-btn"
      title="Outil promo"
      disabled={selectedCount === 0}
    >
      <FaPercent />
    </button>

    {/* 🅿️ Parking Virtuel */}
    <button
  onClick={() => {
    setParkingTab("vue");
    setParkingOpen(true);
  }}
  className="icon-btn"
  title="Parking Virtuel"
  style={{
    background: "#3b82f6",
    border: "1px solid #3b82f6",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
  }}
>
  P
</button>

    {/* 💲 Outil Prix */}
    <button
      onClick={openPriceTool}
      className="icon-btn price-tool-btn"
      title="Outil Prix"
      style={{
        background: "#fff",
        border: "1px solid #22c55e",
        color: "#22c55e",
        fontWeight: 700,
        fontSize: 16,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#22c55e";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.color = "#22c55e";
      }}
    >
      $
    </button>

    <button
      onClick={openExportModal}
      className="icon-btn"
      title="Outil export"
    >
      <FaFileExport />
    </button>
  </>
)}
  </div>

  {/* Compteur au centre */}
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}
>
  {/* Compteur */}
  <div
    className="velo-counter"
    onClick={() => setStatsOpen(true)}
    style={{
      cursor: "pointer",
      userSelect: "none",
      padding: "6px 10px",
      borderRadius: 10,
    }}
    title="Ouvrir les statistiques"
  >
    <span className="velo-count">
      {pricingMode ? pricingDisplayedStockUnits : filteredAndSortedVelos.length}
    </span>

    <span className="velo-separator"> / </span>

    <span className="velo-total">
      {pricingMode ? pricingTotalStockUnits : velos.length}
    </span>

    <span className="velo-label">
      {pricingMode ? "  Unités" : "  Vélos"}
    </span>
  </div>

  {/* Icône stats */}
  {pricingMode && (
  <button
    onClick={() => setStatsOpen(true)}
    title="Statistiques du stock actuel"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.15)",
      background: "#ffffff",
      color: "#111827",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      transition: "all .15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "var(--mint-green)";
      e.currentTarget.style.color = "#ffffff";
      e.currentTarget.style.borderColor = "var(--mint-green)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#ffffff";
      e.currentTarget.style.color = "#111827";
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
    }}
  >
    <span style={{ fontSize: 15 }}>📊</span>
    KPI's Parking
  </button>
)}

  {/* Bouton Inventaire (mode conseiller uniquement) */}
  {!pricingMode && (
  <button
    onClick={() => setInventoryOpen(true)}
    title="Consulter l'inventaire des achats"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.15)",
      background: "#ffffff",
      color: "#111827",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      transition: "all .15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "var(--mint-green)";
      e.currentTarget.style.color = "#ffffff";
      e.currentTarget.style.borderColor = "var(--mint-green)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#ffffff";
      e.currentTarget.style.color = "#111827";
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
    }}
  >
    <span style={{ fontSize: 15 }}>📦</span>
    À venir <span style={{ fontSize: 14, opacity: 0.7 }}>+{inventoryCount}</span>
  </button>
)}
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

{!pricingMode ? (
  <>
    <option value="Title">Titre</option>
    <option value="Année">Année</option>
    <option value="Prix réduit">Prix</option>
    <option value="Published At">Date de publication</option>
  </>
) : (
  <>
    <option value="PRICING_UPDATED_AT">Date du dernier pricing</option>
    <option value="PRICING_BENEFICE_PCT">Marge (%)</option>
    <option value="PRICING_BENEFICE">Marge (€)</option>
    <option value="Published At">Date de publication</option>
    <option value="PRICING_BUY_PRICE">Prix d&apos;achat</option>
    <option value="Prix réduit">Prix</option>
  </>
)}

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

  {/* ✅ BADGE PROMO (basé sur velosmint."Montant promo") */}
{(() => {
  const promoRaw = v?.["Montant promo"];
  if (!promoRaw) return null;

  // Le format peut être "-350€" - on prend la valeur absolue
  const promoValue = parseNumericValue(promoRaw);
  const promo = Math.abs(promoValue);
  if (!Number.isFinite(promo) || promo <= 0) return null;

  return (
    <div
      className="promo-badge"
      title={`Promo en cours : -${promo.toLocaleString("fr-FR")} €`}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 3,
        padding: "6px 8px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 900,
        background: "#ef4444",
        color: "#fff",
        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
        lineHeight: 1,
      }}
    >
      -{promo.toLocaleString("fr-FR")}€
    </div>
  );
})()}

{/* ✅ BADGE LOT / MULTI-UNITÉS (centré, mode pricing uniquement) */}
{pricingMode && (() => {
  const units = getRowTotalStock(v);
  if (!Number.isFinite(units) || units <= 1) return null;

  return (
    <div
      title={`${units} unités en stock`}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3,
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: "rgba(17,24,39,0.92)",
        color: "#fff",
        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
        lineHeight: 1,
        pointerEvents: "none", // évite toute interférence clic
      }}
    >
      x{units}
    </div>
  );
})()}


  {!pricingMode ? (
  <div
    className={`wishlist-icon ${selected[v.URL] ? "selected" : ""}`}
    onClick={(e) => {
      e.stopPropagation();
      toggleSelect(v.URL);
    }}
    title="Ajouter à la sélection"
  >
    <FaHeart />
  </div>
) : (
  <div
    className={`wishlist-icon ${selected[v.URL] ? "selected" : ""}`}
    onClick={(e) => {
      e.stopPropagation();
      toggleSelect(v.URL);
    }}
    title="Sélectionner pour promo"
  >
    <FaPercent />
  </div>
)}
</div>
                  <div className="title">
                    <strong>{v.Title}</strong>
                  </div>
                  {renderPriceBox(v)}
                  {(() => {
  const p = pricingByUrl?.[v.URL]; // row pricing si dispo
  
  return (
    <div
      className="infos-secondaires"
      style={pricingMode ? { display: "flex", justifyContent: "space-between", gap: 10 } : {}}
    >
      {/* GAUCHE : infos compactes */}
      <div style={pricingMode ? { flex: 1, minWidth: 0 } : {}}>
        <div>
          <strong>Année:</strong> {v.Année || "N/A"}
        </div>
        <div>
          <strong>Tailles :</strong> {formatSizeVariants(v)}
        </div>
        {v["Type de vélo"] === "Électrique" && (
          <div>
            <strong>Km:</strong> {formatKm(v.Kilométrage)}
          </div>
        )}
      </div>

      {/* DROITE : infos pricing (uniquement en mode pricing) */}
{pricingMode && (
  <div
    style={{
      width: 155,
      paddingLeft: 10,
      borderLeft: "1px solid rgba(0,0,0,0.08)",
      fontSize: 12,
      lineHeight: 1.35,
    }}
  >
    {(() => {
      const ben = computeCardBenefit(v, p);
      const daysOnline = getDaysSincePublication(v["Published At"]);
      const pricingDays = daysSince(p?.price_updated_at);

      return (
        <>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.1,
              color: getMarginColorByPct(ben?.pct),
            }}
          >
            {ben?.pct != null ? `${Number(ben.pct).toLocaleString("fr-FR")} %` : "—"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 2 }}>
            {ben?.eur != null ? `${Number(ben.eur).toLocaleString("fr-FR")} €` : ""}
          </div>
          <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 10 }}>
            Marge s/ coûts var.
          </div>

          <div style={{ marginTop: 6, opacity: 0.75 }}>
            En ligne :{" "}
            <span
              style={{
                fontWeight: 800,
                color: getAgeColor(daysOnline),
              }}
            >
              {Number.isFinite(daysOnline) ? `${daysOnline} j` : "—"}
            </span>
          </div>

          <div style={{ marginTop: 6, opacity: 0.75 }}>
            Dernier pricing :{" "}
            <span
              style={{
                fontWeight: 800,
                color: getPricingRecencyColor(pricingDays),
              }}
            >
              {Number.isFinite(pricingDays) ? `${pricingDays} j` : "—"}
            </span>
          </div>
        </>
      );
    })()}
  </div>
)}


    </div>
  );
})()}

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
                    <td>{formatKm(v.Kilométrage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedVelo && (
          <div className="velo-details">
            {/* Header sticky avec titre et bouton fermer */}
            <div className="velo-details-header">
              <h2>{selectedVelo.Title}</h2>
              <button className="close-btn" onClick={() => setSelectedVelo(null)}>
                X
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, margin: "8px 0 14px 0" }}>
</div>


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
  {(() => {
  // total = somme par variantes si dispo, sinon fallback colonne globale
  const stocksMap = _buildVariantStockMap(selectedVelo);
  const totalStock =
    Object.keys(stocksMap).length > 0
      ? Object.values(stocksMap).reduce((a, b) => a + (b || 0), 0)
      : (Number(selectedVelo["Total Inventory Qty"]) || 0);

  // HTML du tooltip (avec N° de série si dispo)
  const stockTooltipHTML = formatVariantStockHTML(selectedVelo);

  return (
    <div className="highlight has-tooltip">
      <span role="img" aria-label="stock">📦</span>
      {totalStock}

      {stockTooltipHTML && (
        <div
          className="tooltip-bubble"
          // affiche le HTML enrichi: "S : 2 en stock" + “N° série : …”
          dangerouslySetInnerHTML={{ __html: stockTooltipHTML }}
        />
      )}
    </div>
  );
})()}


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
            {/* 👇 Barre d’actions (répartie) : Intérêt | ERP | Notes */}
{selectedVelo?.URL && (
  <div
    className={`velo-extras distributed-row ${pricingMode ? "cols-3" : "cols-2"}`}
  >
    {/* ===== ERP (pricing uniquement) & SHOPIFY (tous modes) ===== */}
    {(() => {
        const serials = getAllSerialsFromRow(selectedVelo);
        const bikeNumber = serials?.[0] ? String(serials[0]).trim() : "";
        
        // ID Shopify depuis la colonne ID (Shopify Product ID)
        const shopifyProductId = selectedVelo?.ID 
          || selectedVelo?.id 
          || selectedVelo?.shopify_product_id 
          || selectedVelo?.["Shopify Product ID"] 
          || "";
        
        if (!bikeNumber && !shopifyProductId) return null;

        const erpUrl = bikeNumber 
          ? `https://erpmint.com/dashboard/products/${encodeURIComponent(bikeNumber)}`
          : null;
          
        const shopifyUrl = shopifyProductId
          ? `https://admin.shopify.com/store/velokaz/products/${encodeURIComponent(shopifyProductId)}`
          : null;

        return (
          <>
            {pricingMode && erpUrl && (
              <button
                type="button"
                className="extra-pill clickable"
                title={`Voir la fiche achat ERP (N° ${bikeNumber})`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(erpUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <span className="extra-icon">👁️</span>
                <span className="extra-text">ERP</span>
              </button>
            )}
            
            {shopifyUrl && (
              <button
                type="button"
                className="extra-pill clickable"
                title={`Voir le produit sur Shopify (ID: ${shopifyProductId})`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(shopifyUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <span className="extra-icon">🛒</span>
                <span className="extra-text">Shopify</span>
              </button>
            )}
          </>
        );
      })()}

    {/* ===== NOTES ===== */}
    <button
      type="button"
      className="extra-pill clickable"
      title="Ouvrir les notes"
      onClick={(e) => {
        e.stopPropagation();
        setIsNotesOpen(true);
      }}
    >
      <span className="extra-icon">📝</span>
      <span className="extra-text">
        {noteCount > 0 ? `Notes (${noteCount})` : "Notes"}
      </span>
    </button>
  </div>
)}



{/* Fenêtre flottante (modal notes) */}
{isNotesOpen && (
  <>
    <div className="overlay" onClick={() => setIsNotesOpen(false)}></div>
    <div className="notes-modal">
      <button className="close-btn" onClick={() => setIsNotesOpen(false)}>
        ×
      </button>
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
{pricingMode && (
  <div
    style={{
      marginTop: 14,
      padding: 12,
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      background: "var(--bg-card, #fff)",
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    {/* HEADER */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <h3 style={{ margin: 0 }}>Pricing</h3>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => openPricingSearchTabs(selectedVelo)}
          disabled={!selectedVelo}
          title="Ouvrir des recherches (Google, Buycycle, Leboncoin, Upway si électrique)"
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          🔎 Annonces Concurrence
        </button>

      </div>
    </div>

    {pricingLoading && <p style={{ marginTop: 10 }}>Chargement…</p>}

    {pricingError && (
      <p style={{ marginTop: 10, color: "#b91c1c" }}>❌ {pricingError}</p>
    )}

    {!pricingLoading && pricingRow && (() => {
      // =====================================================
      // Helpers (local)
      // =====================================================
      const setField = (key, type) => (e) => {
        const raw = e.target.value;

        setPricingRow((prev) => {
          const next = {
            ...prev,
            [key]:
              type === "number"
                ? raw === ""
                  ? null
                  : parseNumericValue(raw)
                : raw,
          };
          return computePricing(next, selectedVelo);
        });
      };

      const n = (val) => {
        const x = parseNumericValue(val);
        return Number.isFinite(x) ? x : null;
      };

      const fmt = (x) =>
        Number.isFinite(x) ? `${Number(x).toLocaleString("fr-FR")} €` : "—";

      const fmtPct = (x) =>
        Number.isFinite(x) ? `${Number(x).toLocaleString("fr-FR")} %` : "—";

      // =====================================================
      // 1) PRICING MARCHÉ
      // Neuf déstock = new_price / new_bike_url
      // Occaz = best_used_price / best_used_url
      // =====================================================
      const marketNewUrl = pricingRow?.new_bike_url ?? "";
      const marketUsedUrl = pricingRow?.best_used_url ?? "";

      // =====================================================
      // Styles
      // =====================================================
      const sectionStyle = {
        padding: 10,
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 10,
        background: "#fff",
        minWidth: 0,
        overflow: "hidden",
      };

      const titleStyle = { fontWeight: 800, marginBottom: 8 };

      const grid2 = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        minWidth: 0,
      };

      const fieldWrap = { display: "grid", gap: 6, minWidth: 0, overflow: "hidden" };

      const labelStyle = { fontSize: 12, color: "#6b7280" };

      const inputStyle = {
        height: 36,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "6px 10px",
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
      };

      const roStyle = {
        height: 36,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "6px 10px",
        background: "#f9fafb",
        color: "#374151",
        display: "flex",
        alignItems: "center",
        fontWeight: 700,
      };

      const marginRowStyle = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      };

      const roInline = {
        height: 36,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "6px 10px",
        background: "#f9fafb",
        color: "#374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontWeight: 800,
      };

      return (
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {/* =========================
              1) PRICING MARCHÉ
             ========================= */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={titleStyle}>1) Pricing marché</div>
              <button
                type="button"
                className="save-btn"
                onClick={() => savePricingRow(pricingRow, true)}
                disabled={pricingSaving || pricingLoading || !pricingRow?.mint_url}
                style={{ margin: 0, padding: "6px 12px", fontSize: 13 }}
              >
                {pricingSaving ? "Enregistrement..." : "💾 Enregistrer"}
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={grid2}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Meilleur prix neuf déstock</label>
                  <input
                    type="number"
                    value={pricingRow?.new_price ?? ""}
                    onChange={setField("new_price", "number")}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>URL neuf déstock</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="text"
                      value={marketNewUrl}
                      onChange={setField("new_bike_url", "text")}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {marketNewUrl && (
                      <a
                        href={marketNewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          background: "#e0f2fe",
                          borderRadius: 6,
                          color: "#0284c7",
                          textDecoration: "none",
                          flexShrink: 0,
                        }}
                        title="Ouvrir le lien"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div style={grid2}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Meilleur prix occasion</label>
                  <input
                    type="number"
                    value={pricingRow?.best_used_price ?? ""}
                    onChange={setField("best_used_price", "number")}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>URL occasion</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="text"
                      value={marketUsedUrl}
                      onChange={setField("best_used_url", "text")}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {marketUsedUrl && (
                      <a
                        href={marketUsedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          background: "#e0f2fe",
                          borderRadius: 6,
                          color: "#0284c7",
                          textDecoration: "none",
                          flexShrink: 0,
                        }}
                        title="Ouvrir le lien"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================
              2) INFO ACHAT
             ========================= */}
          <div style={sectionStyle}>
            <div style={titleStyle}>2) Info achat</div>

            <div style={grid2}>
  <div style={fieldWrap}>
    <label style={labelStyle}>Date d'achat</label>
    <input
      type="date"
      value={pricingRow?.purchase_date ? pricingRow.purchase_date.split('T')[0] : ""}
      onChange={setField("purchase_date", "text")}
      onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'purchase_date', e.target.value || null)}
      style={inputStyle}
    />
  </div>

  <div style={fieldWrap}>
    <label style={labelStyle}>Type de vendeur</label>
    <input
      type="text"
      list="seller-types-list"
      value={pricingRow?.seller_type ?? ""}
      onChange={setField("seller_type", "text")}
      onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'seller_type', e.target.value)}
      style={inputStyle}
      placeholder="ex: VEL, Particulier, Partenaire..."
    />
    <datalist id="seller-types-list">
      {SELLER_TYPES.filter(t => t).map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
    </datalist>
  </div>
</div>

<div style={grid2}>
  <div style={fieldWrap}>
    <label style={labelStyle}>Nom du vendeur</label>
    <input
      type="text"
      value={pricingRow?.seller ?? ""}
      onChange={setField("seller", "text")}
      onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'seller', e.target.value)}
      style={inputStyle}
      placeholder="ex: Bikeshop22, Decathlon..."
    />
  </div>

  <div style={fieldWrap}>
    <label style={labelStyle}>Acheteur</label>
    <select
      value={pricingRow?.buyer ?? ""}
      onChange={(e) => {
        setField("buyer", "text")(e);
        autoUpsertPricingField(selectedVelo.URL, 'buyer', e.target.value);
      }}
      style={inputStyle}
    >
      {BUYERS.map((name) => (
        <option key={name || "__empty__"} value={name}>
          {name ? name : "— Choisir —"}
        </option>
      ))}
    </select>
  </div>
</div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={grid2}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Prix d'achat (HT)</label>
                  <input
                    type="number"
                    value={pricingRow?.negotiated_buy_price ?? ""}
                    onChange={setField("negotiated_buy_price", "number")}
                    onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'negotiated_buy_price', parseFloat(e.target.value) || null)}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Prix des pièces (HT)</label>
                  <input
                    type="number"
                    value={pricingRow?.parts_cost_actual ?? ""}
                    onChange={setField("parts_cost_actual", "number")}
                    onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'parts_cost_actual', parseFloat(e.target.value) || null)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={fieldWrap}>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={pricingRow?.include_transport === true}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setPricingRow((prev) =>
                        computePricing({ ...prev, include_transport: newVal }, selectedVelo)
                      );
                      autoUpsertPricingField(selectedVelo.URL, 'include_transport', newVal);
                    }}
                    style={{ width: 16, height: 16 }}
                  />
                  Inclure frais de transport ({FRAIS_TRANSPORT} €)
                </label>
              </div>
            </div>
          </div>

          {/* =========================
              CALCULÉ (marges avec détail)
             ========================= */}
          <div
            style={{
              marginTop: 2,
              paddingTop: 10,
              borderTop: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
              Marges (calculé)
            </div>

            {/* Détail du calcul de la marge sur coûts variables */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, color: "#475569" }}>
                Détail marge sur coûts variables
              </div>
              <div style={{ display: "grid", gap: 4, color: "#64748b" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Prix de vente TTC</span>
                  <span style={{ fontWeight: 500, color: "#334155" }}>{fmt(pricingRow?._sale)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>− Prix d'achat HT</span>
                  <span>{fmt(pricingRow?._buy)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: 4, marginTop: 2 }}>
                  <span style={{ fontWeight: 500 }}>= Marge commerciale</span>
                  <span style={{ fontWeight: 500 }}>{fmt(pricingRow?.commercial_margin_eur)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span>− Pièces HT</span>
                  <span>{fmt(pricingRow?._parts)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>− Marquage</span>
                  <span>{fmt(pricingRow?._frais_marquage)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>− Emballage</span>
                  <span>{fmt(pricingRow?._frais_emballage)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>− Transport {pricingRow?._frais_transport > 0 ? "" : "(non inclus)"}</span>
                  <span>{fmt(pricingRow?._frais_transport)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>− TVA sur marge commerciale (20%)</span>
                  <span>{fmt(pricingRow?._tva_sur_marge)}</span>
                </div>
              </div>

              {/* MARGE SUR COÛTS VARIABLES - mise en avant */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "2px solid #cbd5e1",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  = Marge sur coûts variables
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 15,
                    background: pricingRow?.gross_margin_eur >= 0 ? "#dcfce7" : "#fee2e2",
                    color: pricingRow?.gross_margin_eur >= 0 ? "#166534" : "#991b1b",
                  }}
                >
                  <span>{fmt(pricingRow?.gross_margin_eur)}</span>
                  <span style={{ opacity: 0.8, fontSize: 13 }}>{fmtPct(pricingRow?.gross_margin_pct)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COMMENTAIRE */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>Commentaire</label>
            <textarea
              value={pricingRow?.comment ?? ""}
              onChange={(e) =>
                setPricingRow((prev) =>
                  computePricing(
                    {
                      ...prev,
                      comment: e.target.value,
                    },
                    selectedVelo
                  )
                )
              }
              onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'comment', e.target.value)}
              style={{
                minHeight: 80,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: 10,
                resize: "vertical",
              }}
            />
          </div>

          {/* =========================
              PROMO
             ========================= */}
          <div style={sectionStyle}>
            <div style={titleStyle}>🎁 Promo</div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Montant promo (€)</label>
              <input
                type="text"
                value={selectedVelo?.["Montant promo"] ?? "—"}
                disabled
                style={{ ...inputStyle, background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                title="Valeur provenant de Shopify (velosmint)"
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Promo à appliquer (€)</label>
              <input
                type="number"
                value={pricingRow?.mint_promo_amount ?? ""}
                onChange={setField("mint_promo_amount", "number")}
                onBlur={(e) => autoUpsertPricingField(selectedVelo.URL, 'mint_promo_amount', parseFloat(e.target.value) || null)}
                style={inputStyle}
                placeholder="ex: 100"
                title="Valeur pour export CSV vers Shopify"
              />
            </div>
          </div>
        </div>
      );
    })()}
  </div>
)}        
   <div className="details-grid">
  {Object.entries(fieldGroups).map(([groupName, fields]) => {
    const isInfos = groupName === "Infos générales";
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
                <td>
                  {field === "Kilométrage"
                    ? formatKm(selectedVelo?.Kilométrage)
                    : (selectedVelo?.[field] ?? "N/A")}
                </td>
              </tr>
            ))}

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
            {/* Header de la prévisualisation (remplace la div des boutons existante) */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
  <h2 style={{ margin: 0 }}>Prévisualisation du mail</h2>
  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    {/* Copier le rendu (comportement existant) */}
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

    {/* Copier version HubSpot — centré + logo maîtrisé + CTA centrés */}
<button
  onClick={async () => {
    const iframe = document.getElementById("email-preview-iframe");
    if (!iframe || !iframe.contentWindow) {
      alert("Prévisualisation introuvable.");
      return;
    }
    const win = iframe.contentWindow;
    const srcDoc = win.document;

    // ---------------- helpers ----------------
    const ABS = (url) => { try { return new URL(url, srcDoc.baseURI).toString(); } catch { return url; } };
    const BASE_FONT = 'Arial, Helvetica, sans-serif';

    const SPACER = (h=12) =>
      `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr><td height="${h}" style="line-height:${h}px;font-size:${h}px">&nbsp;</td></tr>
      </table>`;

    const isEl = (n) => n && n.nodeType === 1;

    function mergeInline(current, add) {
      const map = {};
      (current || "").split(";").map(s=>s.trim()).filter(Boolean).forEach(decl=>{
        const [p,...r]=decl.split(":"); if(!p||!r.length) return; map[p.trim()]=r.join(":").trim();
      });
      (add || "").split(";").map(s=>s.trim()).filter(Boolean).forEach(decl=>{
        const [p,...r]=decl.split(":"); if(!p||!r.length) return; map[p.trim()]=r.join(":").trim();
      });
      return Object.entries(map).map(([p,v])=>`${p}:${v}`).join(";") + (Object.keys(map).length?";":"");
    }

    const KEEP = new Set([
      "color","background-color",
      "font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-decoration","text-transform",
      "padding","padding-top","padding-right","padding-bottom","padding-left",
      "border","border-top","border-right","border-bottom","border-left","border-color","border-style","border-width","border-radius",
      "width","max-width","min-width","height","max-height","min-height",
      "vertical-align","white-space","word-break","overflow-wrap","box-shadow"
    ]);

    function inlineMinimal(el) {
      if (!isEl(el)) return;
      const cs = win.getComputedStyle(el);
      const decls = [];
      let ff = cs.getPropertyValue("font-family");
      if (ff) ff = `${BASE_FONT}, ${ff}`;
      for (const p of KEEP) {
        let v = cs.getPropertyValue(p);
        if (!v) continue;
        if (p==="font-family") v = ff || BASE_FONT;
        decls.push(`${p}:${v}`);
      }
      el.setAttribute("style", mergeInline(el.getAttribute("style"), decls.join(";")));
    }

    // ******** 1) Clone + nettoyage soft (on garde la structure) ********
    const root = srcDoc.body.cloneNode(true);
    root.querySelectorAll("script, style, link, meta, noscript").forEach(n => n.remove());
    root.querySelectorAll("*").forEach(n=>{
      // onEvents
      [...n.getAttributeNames()].forEach(a => { if (a.startsWith("on")) n.removeAttribute(a); });
      // classes/ids → HubSpot les ignore et ça allège
      n.removeAttribute("class");
      n.removeAttribute("id");
      // remove comments
      [...n.childNodes].forEach(c=>{ if (c.nodeType === 8) c.remove(); });
    });

    // ******** 2) Images & liens ********
    root.querySelectorAll("img").forEach(img => {
      if (img.getAttribute("src")) img.setAttribute("src", ABS(img.getAttribute("src")));
      // centre et limite la taille par défaut
      let extra = "display:block;margin:0 auto;max-width:100%;height:auto;";
      // si "logo" détecté → limite plus strict
      const alt = (img.getAttribute("alt") || "").toLowerCase();
      const src = (img.getAttribute("src") || "").toLowerCase();
      const isLogo = alt.includes("logo") || /logo\.(png|jpe?g|svg)/.test(src) || (img.naturalWidth && img.naturalWidth>300);
      if (isLogo) extra = "display:block;margin:0 auto;max-width:160px;height:auto;";
      img.setAttribute("style", mergeInline(img.getAttribute("style"), `border:0;outline:0;text-decoration:none;${extra}`));
    });

    root.querySelectorAll("a").forEach(a => {
      const href = a.getAttribute("href");
      if (href) a.setAttribute("href", ABS(href));
      a.setAttribute("target","_blank"); a.setAttribute("rel","noopener noreferrer");
      a.setAttribute("style", mergeInline(a.getAttribute("style"), "text-decoration:none;"));
    });

    // ******** 3) Flex / Grid → tables ciblées (pour conserver le centrage) ********
    function flexToTable(container) {
      const cs = win.getComputedStyle(container);
      if (cs.display !== "flex") return false;

      const dir = cs.flexDirection.includes("column") ? "column" : "row";
      const gap = parseInt(cs.gap) || parseInt(cs.columnGap) || parseInt(cs.rowGap) || 0;
      const align = cs.alignItems;     // cross-axis
      const justify = cs.justifyContent; // main-axis
      const toAlign = (val) => val.includes("center") ? "center" : (val.includes("end") ? "right" : "left");
      const valign = align.includes("center") ? "middle" : (align.includes("end")?"bottom":"top");

      const table = srcDoc.createElement("table");
      table.setAttribute("role","presentation");
      table.setAttribute("border","0"); table.setAttribute("cellpadding","0"); table.setAttribute("cellspacing","0");
      table.setAttribute("width","100%");
      inlineMinimal(container);
      // si le conteneur ou un parent est centré → on centre
      const parentTextAlign = cs.textAlign || win.getComputedStyle(container.parentElement || container).textAlign || "left";
      const wantCenter = justify.includes("center") || parentTextAlign === "center";
      table.setAttribute("style", mergeInline(container.getAttribute("style"), wantCenter ? "margin:0 auto;" : ""));

      const kids = [...container.childNodes].filter(isEl);
      if (dir === "row") {
        const tr = srcDoc.createElement("tr");
        kids.forEach((child, idx) => {
          inlineMinimal(child);
          const td = srcDoc.createElement("td");
          td.setAttribute("valign", valign);
          if (wantCenter) td.setAttribute("align","center");
          td.appendChild(child);
          tr.appendChild(td);
          if (gap && idx<kids.length-1) {
            const spacer = srcDoc.createElement("td");
            spacer.setAttribute("style", `width:${gap}px;`);
            spacer.innerHTML = "&nbsp;";
            tr.appendChild(spacer);
          }
        });
        table.appendChild(tr);
      } else {
        kids.forEach((child, idx) => {
          inlineMinimal(child);
          const tr = srcDoc.createElement("tr");
          const td = srcDoc.createElement("td");
          if (wantCenter) td.setAttribute("align","center");
          td.appendChild(child);
          tr.appendChild(td);
          table.appendChild(tr);
          if (gap && idx<kids.length-1) {
            const trGap = srcDoc.createElement("tr");
            const tdGap = srcDoc.createElement("td");
            tdGap.innerHTML = SPACER(gap);
            trGap.appendChild(tdGap);
            table.appendChild(trGap);
          }
        });
      }

      container.replaceWith(table);
      return true;
    }

    function gridToTable(container) {
      const cs = win.getComputedStyle(container);
      if (cs.display !== "grid") return false;

      const cols = (cs.gridTemplateColumns || "").split(" ").filter(Boolean);
      const colCount = cols.length || 1;
      const gapX = parseInt(cs.columnGap)||0, gapY = parseInt(cs.rowGap)||0;

      const table = srcDoc.createElement("table");
      table.setAttribute("role","presentation");
      table.setAttribute("border","0"); table.setAttribute("cellpadding","0"); table.setAttribute("cellspacing","0");
      table.setAttribute("width","100%");
      inlineMinimal(container);

      const parentTextAlign = cs.textAlign || win.getComputedStyle(container.parentElement || container).textAlign || "left";
      const wantCenter = parentTextAlign === "center";
      if (wantCenter) table.setAttribute("style", mergeInline(table.getAttribute("style"), "margin:0 auto;"));

      const kids = [...container.childNodes].filter(isEl);
      for (let i=0; i<kids.length; i+=colCount) {
        const tr = srcDoc.createElement("tr");
        for (let c=0; c<colCount; c++) {
          if (c>0 && gapX) {
            const g = srcDoc.createElement("td"); g.setAttribute("style", `width:${gapX}px;`); g.innerHTML="&nbsp;"; tr.appendChild(g);
          }
          const td = srcDoc.createElement("td");
          if (wantCenter) td.setAttribute("align","center");
          if (kids[i+c]) { inlineMinimal(kids[i+c]); td.appendChild(kids[i+c]); }
          tr.appendChild(td);
        }
        table.appendChild(tr);
        if (gapY && i+colCount<kids.length) {
          const trGap = srcDoc.createElement("tr");
          const tdGap = srcDoc.createElement("td");
          tdGap.setAttribute("colspan", String(colCount*2-1));
          tdGap.innerHTML = SPACER(gapY);
          trGap.appendChild(tdGap);
          table.appendChild(trGap);
        }
      }
      container.replaceWith(table);
      return true;
    }

    // ******** 4) Centrage des CTA : transforme tout lien qui ressemble à un bouton ********
    function isLikelyButton(el) {
      if (!isEl(el) || el.tagName !== "A") return false;
      const cs = win.getComputedStyle(el);
      const padX = parseInt(cs.paddingLeft) + parseInt(cs.paddingRight);
      const bg = cs.backgroundColor || "rgba(0,0,0,0)";
      const br = parseInt(cs.borderRadius) || 0;
      const text = (el.textContent || "").toLowerCase();
      const looksLikeCta = padX >= 20 || br >= 4 || bg !== "rgba(0, 0, 0, 0)" || /voir le vélo|voir le velo|voir les vélos|voir les velos|voir/i.test(text);
      return looksLikeCta;
    }

    function wrapAsCenteredButton(a) {
      inlineMinimal(a);
      a.setAttribute("style", mergeInline(a.getAttribute("style"),
        "display:inline-block;padding:12px 18px;background-color:#2ca76a;color:#ffffff;border-radius:6px;text-align:center;"
      ));
      const href = a.getAttribute("href") || "#";
      a.setAttribute("href", href);

      const wrap = srcDoc.createElement("div");
      wrap.innerHTML =
        `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
          <tr><td align="center">${a.outerHTML}</td></tr>
        </table>`;
      a.replaceWith(wrap.firstElementChild);
    }

    // ******** 5) Marges verticales → spacers + padding ; centrage global ********
    function fixBlockSpacing(parent) {
      const kids = [...parent.childNodes];
      for (let i=0; i<kids.length; i++) {
        const n = kids[i];
        if (!isEl(n)) continue;

        // CTA ?
        if (n.tagName === "A" && isLikelyButton(n)) {
          wrapAsCenteredButton(n);
          continue;
        }

        // convert flex/grid si besoin
        const cs = win.getComputedStyle(n);
        if (cs.display === "flex") { flexToTable(n); continue; }
        if (cs.display === "grid") { gridToTable(n); continue; }

        // inline utile
        inlineMinimal(n);

        // centrage si parent centré
        const parentAlign = win.getComputedStyle(n.parentElement || n).textAlign;
        if (parentAlign === "center" && !/^(TD|TH)$/.test(n.tagName)) {
          n.setAttribute("style", mergeInline(n.getAttribute("style"), "margin-left:auto;margin-right:auto;text-align:center;"));
        }

        // images non prises plus haut → centre
        if (n.tagName === "IMG") {
          n.setAttribute("style", mergeInline(n.getAttribute("style"), "display:block;margin:0 auto;"));
        }

        // margins verticaux -> spacers
        const mt = parseInt(cs.marginTop) || 0;
        const mb = parseInt(cs.marginBottom) || 0;
        if (mt>0 && n.previousElementSibling) {
          const wrap = srcDoc.createElement("div"); wrap.innerHTML = SPACER(mt);
          n.parentNode.insertBefore(wrap.firstElementChild, n);
        }
        if (mb>0 && n.nextElementSibling) {
          const wrap = srcDoc.createElement("div"); wrap.innerHTML = SPACER(mb);
          n.parentNode.insertBefore(wrap.firstElementChild, n.nextSibling);
        }
        if (mt>0 || mb>0) {
          n.setAttribute("style", mergeInline(n.getAttribute("style"), "margin-top:0;margin-bottom:0;"));
        }

        // enfants
        fixBlockSpacing(n);
      }
    }

    fixBlockSpacing(root);

    // ******** 6) Footer forcé centré ********
    // Essaie de détecter un footer par son texte ou sa position dernière
    const footerCandidates = [...root.querySelectorAll("footer, [data-footer], .footer")];
    let footer = footerCandidates[0];
    if (!footer) {
      // heuristique : dernier grand conteneur
      const blocks = [...root.querySelectorAll("div, section, table")];
      footer = blocks.reverse().find(b => (b.textContent||"").toLowerCase().includes("mint-bikes") || (b.textContent||"").toLowerCase().includes("se désabonner"));
    }
    if (footer) {
      inlineMinimal(footer);
      footer.setAttribute("style", mergeInline(footer.getAttribute("style"), "text-align:center;margin-left:auto;margin-right:auto;"));
      // centre les liens dans le footer
      footer.querySelectorAll("a").forEach(a=>{
        a.setAttribute("style", mergeInline(a.getAttribute("style"), "text-align:center;display:inline-block;"));
      });
    }

    // ******** 7) Enveloppe 600px centrée (garantie de centrage global) ********
    const wrapped = `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;margin:0 auto;">
              <tr><td align="center" style="text-align:center;">
                ${root.innerHTML}
              </td></tr>
            </table>
          </td>
        </tr>
      </table>`;

    // ******** 8) Copier en HTML riche (ClipboardItem), fallback contenteditable ********
    const copyHTML = async (html) => {
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([srcDoc.body.textContent || ""], { type: "text/plain" })
            })
          ]);
          alert("✅ Version HubSpot centrée & fidèle copiée !");
          return true;
        } catch (e) { console.warn(e); }
      }
      try {
        const div = document.createElement("div");
        div.contentEditable = "true";
        div.style.position = "fixed";
        div.style.opacity = "0";
        div.innerHTML = html;
        document.body.appendChild(div);
        const range = document.createRange();
        range.selectNodeContents(div);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        const ok = document.execCommand("copy");
        sel.removeAllRanges(); document.body.removeChild(div);
        if (ok) { alert("✅ Copié (fallback) !"); return true; }
      } catch (e) { console.error(e); }
      alert("❌ Impossible de copier automatiquement.");
      return false;
    };

    await copyHTML(wrapped);
  }}
  style={{ padding: "6px 10px", background: "#4a5568", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
>
  🧩 Copier version HubSpot
</button>

    {/* Fermer */}
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
      {/* PREVIEW SMS */}
      {showSmsModal && (
  <>
    <div className="overlay" onClick={() => setShowSmsModal(false)}></div>
    <div className="modal-preview" style={{ maxWidth: 700, width: "90%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Prévisualisation du SMS</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ alignSelf: "center", fontSize: 12, color: smsText.length > 670 ? "#c0392b" : "#666" }}>
            {smsText.length}/670
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(smsText).then(
                () => alert("✅ SMS copié"),
                () => alert("❌ Impossible de copier automatiquement. Sélectionne et copie manuellement.")
              );
            }}
            style={{ padding: "6px 10px", background: "#2ca76a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            📋 Copier
          </button>
          <button
            onClick={() => setShowSmsModal(false)}
            style={{ padding: "6px 10px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            ✖ Fermer
          </button>
        </div>
      </div>

      <p style={{ marginTop: 0, fontStyle: "italic", color: "#9CA3AF" }}>
        Le texte est automatiquement limité à 670 caractères.
      </p>

      <textarea
        readOnly
        value={smsText}
        style={{
          width: "100%",
          minHeight: 240,
          resize: "vertical",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          lineHeight: 1.45,
        }}
      />
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
                                  <td key={v.URL + field}>{v[field] !== undefined ? (field === "Kilométrage" ? formatKm(v[field]) : String(v[field])) : "N/A"}</td>
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

        {/* === FILTRES PRICING === */}
        {pricingMode && (
          <div className="advanced-group group-pricing" style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            border: "2px solid #0ea5e9",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px"
          }}>
            <h3 style={{
              color: "#0369a1",
              fontSize: "16px",
              fontWeight: "800",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <FaPercent /> Filtres Pricing
            </h3>
            <div className="advanced-grid">

              {/* Acheteur */}
              <MultiSelect
                key="pricing-acheteur"
                label="Acheteur"
                options={BUYERS}
                values={filters.pricingBuyers || []}
                onChange={(vals) => setFilters({ ...filters, pricingBuyers: vals })}
              />

              {/* Type de vendeur */}
              <MultiSelect
                key="pricing-seller-type"
                label="Type de vendeur"
                options={SELLER_TYPES}
                values={filters.pricingSellerTypes || []}
                onChange={(vals) => setFilters({ ...filters, pricingSellerTypes: vals })}
              />

              {/* Marge (slider) */}
              <div className="filter-block" style={{ minWidth: "240px" }}>
                <label>Marge commerciale (€)</label>
                <div style={{ padding: "0 10px" }}>
                  <Slider
                    range
                    min={-2000}
                    max={2500}
                    step={50}
                    value={[
                      filters.pricingMarginMin ?? -2000,
                      filters.pricingMarginMax ?? 2500
                    ]}
                    onChange={([min, max]) =>
                      setFilters({ ...filters, pricingMarginMin: min, pricingMarginMax: max })
                    }
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span>{filters.pricingMarginMin ?? -2000} €</span>
                    <span>{filters.pricingMarginMax ?? 2500} €</span>
                  </div>
                </div>
              </div>

              {/* Date d'achat - Min */}
              <div className="filter-adv-item">
                <label>Date d'achat (min)</label>
                <input
                  type="date"
                  value={filters.pricingDateAchatMin || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, pricingDateAchatMin: e.target.value })
                  }
                />
              </div>

              {/* Date d'achat - Max */}
              <div className="filter-adv-item">
                <label>Date d'achat (max)</label>
                <input
                  type="date"
                  value={filters.pricingDateAchatMax || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, pricingDateAchatMax: e.target.value })
                  }
                />
              </div>

              {/* Best-used-url vide */}
              <div className="filter-adv-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="pricing-best-used-empty"
                  checked={filters.pricingBestUsedUrlEmpty || false}
                  onChange={(e) =>
                    setFilters({ ...filters, pricingBestUsedUrlEmpty: e.target.checked })
                  }
                />
                <label htmlFor="pricing-best-used-empty" style={{ margin: 0, cursor: "pointer" }}>
                  Best-used-url vide
                </label>
              </div>

            </div>
          </div>
        )}

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

{/* ===== MODAL PARKING VIRTUEL ===== */}
{parkingOpen && (
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

        <button className="close-btn" onClick={() => setParkingOpen(false)}>
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="parking-tabs">
        <button
          type="button"
          className={`parking-tab ${parkingTab === "vue" ? "active" : ""}`}
          onClick={() => setParkingTab("vue")}
        >
          Vue
        </button>

        <button
          type="button"
          className={`parking-tab ${parkingTab === "params" ? "active" : ""}`}
          onClick={() => setParkingTab("params")}
        >
          Paramètres
        </button>
      </div>

      {/* =======================
          TAB : VUE
          ======================= */}
      {parkingTab === "vue" &&
        (() => {
          // Si le cache est en cours de chargement, afficher un message
          if (priceBandsLoading) {
            return (
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                ⏳ Chargement des paramètres en cours...
              </div>
            );
          }

          // Si pas de cache ou pas de données, afficher message
          if (!allPriceBandsByCategory || Object.keys(allPriceBandsByCategory).length === 0) {
            return (
              <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
                ⏳ Aucune tranche de prix définie. Allez dans Paramètres pour en créer.
              </div>
            );
          }

          // Déterminer quelle catégorie utiliser
          // IMPORTANT: Utiliser UNIQUEMENT les catégories qui ont réellement des tranches dans Supabase
          let categoryToUse = parkingSelection.category || parkingCategory;

          // Si pas de catégorie sélectionnée, utiliser la première qui existe dans le cache
          if (!categoryToUse) {
            categoryToUse = Object.keys(allPriceBandsByCategory)[0];
            console.log(`ℹ️ Aucune catégorie sélectionnée, utilisation de la première disponible: ${categoryToUse}`);
          }

          // Charger les tranches UNIQUEMENT depuis le cache (allPriceBandsByCategory)
          let bandsToUse = [];
          if (categoryToUse && allPriceBandsByCategory && allPriceBandsByCategory[categoryToUse]) {
            bandsToUse = allPriceBandsByCategory[categoryToUse];
            console.log(`📊 VUE: Tranches chargées pour ${categoryToUse}:`, bandsToUse);
          } else {
            console.warn(`⚠️ VUE: Aucune tranche trouvée pour ${categoryToUse} - affichage sans tranches`);
            bandsToUse = [];
          }

          const baseRows = filteredAndSortedVelos || []; // ou velos si tu préfères tout le stock
          const rowsForView = applyParkingSelection(baseRows, parkingSelection, bandsToUse);
          const brandRecap = buildBrandRecapByTier(rowsForView);
          const baseUnits = (baseRows || []).reduce((sum, r) => sum + Number(getRowTotalStock(r) || 0), 0);
          const filteredUnits = (rowsForView || []).reduce((sum, r) => sum + Number(getRowTotalStock(r) || 0), 0);


          // ✅ Objectif total dynamique : si filtre actif => on se cale sur le volume filtré
          const hasActiveFilter =
          parkingSelection.category || parkingSelection.priceBand || parkingSelection.catMar || parkingSelection.size;

          const objectiveTotal = Number(parkingRules.objectiveTotal || 0); // ex: 600


          // Correction : retourne 1 par défaut si la clé n'existe pas, pour ne pas annuler l'objectif
          const getPct = (obj, key) => {
            if (!obj) return 1;
            const v = obj[key];
            if (v === undefined || v === null) return 1;
            return Number.isFinite(v) ? v : 1;
          };

// ✅ cascade dans l'ordre : Catégorie -> Taille -> Prix -> CAT_MAR
const multCategory = parkingSelection.category ? getPct(parkingRules.categoryPct, parkingSelection.category) : 1;
const multSize = parkingSelection.size ? getPct(parkingRules.sizePct, parkingSelection.size) : 1;
const multPrice = parkingSelection.priceBand ? getPct(parkingRules.pricePct, parkingSelection.priceBand) : 1;

// Total "base" pour chaque table (objectif global * produit des filtres avant)
const objTotalForCatMar = objectiveTotal * multCategory * multSize * multPrice;


          // ---- Taille (distribution spéciale)
          function computeSizeDistribution(rows) {
  const out = {};
  let totalUnits = 0;

  for (const r of rows || []) {
    // ✅ 1) Si on a le détail par taille, on prend la vérité
    const sizeStocks = getSizeStocksFromRow(r);
    if (sizeStocks) {
      for (const [size, units] of Object.entries(sizeStocks)) {
        out[size] = (out[size] || 0) + units;
        totalUnits += units;
      }
      continue;
    }

    // ✅ 2) Fallback : ancien comportement (split égal)
    const units = Number(getRowTotalStock(r) || 0);
    if (!Number.isFinite(units) || units <= 0) continue;

    const buckets = getVariantSizeBucketsFromRow(r);
    if (!buckets || buckets.length === 0) continue;

    const share = units / buckets.length;
    totalUnits += units;
    for (const b of buckets) out[b] = (out[b] || 0) + share;
  }

  return { out, totalUnits };
}

          // ---- Distributions avec ORDRE FORCÉ et valeurs figées
          // 1) Catégories - pas de filtre
          const rowsForCategories = baseRows;
          const distCategory = computeDistribution(rowsForCategories, getCategoryFromRow);
          
          // 2) Tailles - filtre par catégorie SI sélectionnée
          const rowsForSizes = parkingSelection.category 
            ? rowsForCategories.filter(r => getCategoryFromRow(r) === parkingSelection.category)
            : rowsForCategories;
          const distSize = computeSizeDistribution(rowsForSizes);
          
          // 3) Prix - filtre par catégorie + taille SI sélectionnées  
          const rowsForPrices = parkingSelection.size
            ? rowsForSizes.filter(r => {
                const sizeStocks = getSizeStocksFromRow(r);
                if (sizeStocks) return Object.keys(sizeStocks).includes(parkingSelection.size);
                const buckets = getVariantSizeBucketsFromRow(r);
                return buckets && buckets.includes(parkingSelection.size);
              })
            : rowsForSizes;
          
          // ✅ Si taille sélectionnée, ne compter que les unités de cette taille
          const computeDistributionForSize = (rows, getKeyFn, selectedSize) => {
            const out = {};
            let totalUnits = 0;
            
            for (const r of rows || []) {
              let units = 0;
              
              if (selectedSize) {
                // Ne compter que les unités de la taille sélectionnée
                const sizeStocks = getSizeStocksFromRow(r);
                if (sizeStocks && sizeStocks[selectedSize]) {
                  units = Number(sizeStocks[selectedSize] || 0);
                } else {
                  // Fallback: split égal entre les tailles disponibles
                  const totalStock = Number(getRowTotalStock(r) || 0);
                  const buckets = getVariantSizeBucketsFromRow(r);
                  if (buckets && buckets.includes(selectedSize)) {
                    units = totalStock / buckets.length;
                  }
                }
              } else {
                // Pas de taille sélectionnée: toutes les unités
                units = Number(getRowTotalStock(r) || 0);
              }
              
              if (!Number.isFinite(units) || units <= 0) continue;
              
              const key = String(getKeyFn(r) || "").trim();
              if (!key) continue;
              
              totalUnits += units;
              out[key] = (out[key] || 0) + units;
            }
            
            return { out, totalUnits };
          };
          
          const distPrice = computeDistributionForSize(rowsForPrices, (r) => getPriceBand(getPriceFromRow(r), bandsToUse), parkingSelection.size);

          // Ajouter les tranches de prix manquantes (avec 0 unités) pour les afficher
          if (bandsToUse && bandsToUse.length > 0) {
            bandsToUse.forEach(band => {
              if (!distPrice.out[band.label]) {
                distPrice.out[band.label] = 0;
              }
            });
          }

          // ---- Gap rows avec objectifs cascadés
          const objTotalForCategory = objectiveTotal;
          const objTotalForSize = objectiveTotal * multCategory;
          const objTotalForPrice = objectiveTotal * multCategory * multSize;

          const catRows = buildGapRows(distCategory.out, distCategory.totalUnits, parkingRules.categoryPct, objTotalForCategory);
          const sizeRows = buildGapRows(distSize.out, distSize.totalUnits, parkingRules.sizePct, objTotalForSize);
          const priceRows = buildGapRows(distPrice.out, distPrice.totalUnits, parkingRules.pricePct, objTotalForPrice);
          

                    // Nouvelle logique Cat_mar inspirée de PriceToolModal.js
                    // ===== LOGIQUE STRICTEMENT COPIÉE DE PriceToolModal.js =====
                    function computeCatMarDistribution_STRICT(rows, sel, bands, getCatMarFromRow, tierPctMap) {
                      // Helpers strictement copiés
                      const norm = (str) => {
                        if (!str) return "";
                        return String(str)
                          .toLowerCase()
                          .trim()
                          .normalize("NFD")
                          .replace(/[ -\u036f]/g, "");
                      };
                      const sumUnits = (rows) => {
                        if (!getRowTotalStock) return rows.length;
                        return rows.reduce((sum, r) => sum + (getRowTotalStock(r) || 0), 0);
                      };
                      const sumUnitsForSize = (rows, targetSize) => {
                        let total = 0;
                        for (const r of rows) {
                          const sizeStocks = getSizeStocksFromRow ? getSizeStocksFromRow(r) : null;
                          if (sizeStocks && sizeStocks[targetSize]) {
                            total += Number(sizeStocks[targetSize] || 0);
                            continue;
                          }
                          const totalStock = getRowTotalStock ? (getRowTotalStock(r) || 0) : 1;
                          const buckets = getVariantSizeBucketsFromRow ? getVariantSizeBucketsFromRow(r) : null;
                          if (buckets && buckets.length > 0 && buckets.includes(targetSize)) {
                            total += totalStock / buckets.length;
                          }
                        }
                        return Math.round(total);
                      };
                      // Cascade Cat Mar
                      const tiers = ["A", "B", "C", "D"];
                      let filtered = rows;
                      if (sel.category) {
                        filtered = filtered.filter(r => normStr(getCategoryFromRow(r)) === normStr(sel.category));
                      }
                      let sizeLetter = sel.size ? String(sel.size).trim().toUpperCase() : null;
                      if (sizeLetter) {
                        filtered = filtered.filter(r => {
                          const buckets = (getVariantSizeBucketsFromRow(r) || []).map(x => String(x).trim().toUpperCase());
                          return buckets.includes(sizeLetter);
                        });
                      }
                      if (sel.priceBand) {
                        filtered = filtered.filter(r => {
                          const b = getPriceBand(getPriceFromRow(r), bands);
                          return normStr(b) === normStr(sel.priceBand);
                        });
                      }
                      // Objectif de base
                      const categoryPct = parkingRules.categoryPct?.[sel.category] || 0;
                      const sizePct = sizeLetter ? (parkingRules.sizePct?.[sizeLetter] || 0) : 0;
                      const bandObj = bands.find(b => normStr(b.label) === normStr(sel.priceBand));
                      const pricePct = bandObj?.share_pct > 1 ? bandObj.share_pct / 100 : (bandObj?.share_pct || 0);
                      const objectiveTotal = Number(parkingRules.objectiveTotal || 0);
                      const categoryTarget = Math.round(objectiveTotal * categoryPct);
                      const sizeTarget = sizeLetter && sizePct > 0 && categoryTarget > 0 ? Math.round(categoryTarget * sizePct) : categoryTarget;
                      const priceTarget = sel.priceBand && pricePct > 0 && sizeTarget > 0 ? Math.round(sizeTarget * pricePct) : sizeTarget;
                      // Pour chaque tier, filtrer et compter les unités, puis appliquer le % objectif
                      const rowsOut = tiers.map(tier => {
                        // Filtrer les vélos du tier
                        let velosFiltered = filtered.filter(r => {
                          const t = String(getCatMarFromRow(r) || "").trim().toUpperCase();
                          return t === tier;
                        });
                        // Compter les unités (si taille sélectionnée, ne compter que cette taille)
                        let actualUnits = 0;
                        if (sizeLetter && sizePct > 0) {
                          actualUnits = sumUnitsForSize(velosFiltered, sizeLetter);
                        } else {
                          actualUnits = sumUnits(velosFiltered);
                        }
                        const tierPct = tierPctMap?.[tier] || 0;
                        let baseTarget = categoryTarget;
                        if (sizeLetter && sizePct > 0) baseTarget = sizeTarget;
                        if (sel.priceBand && pricePct > 0) baseTarget = priceTarget; // <-- cette ligne garantit la cascade correcte
                        const targetUnits = Math.round(baseTarget * tierPct);
                        const gapUnits = actualUnits - targetUnits;
                        return {
                          key: tier,
                          actualUnits,
                          targetUnits,
                          gapUnits,
                          targetPct: tierPct,
                          actualPct: baseTarget > 0 ? actualUnits / baseTarget : 0,
                          gapPct: baseTarget > 0 ? (actualUnits / baseTarget) - tierPct : 0,
                        };
                      });
                      return rowsOut;
                    }

                    // Utilisation dans le rendu (remplace l'ancien calcul Cat_mar)
                    const catMarRows = computeCatMarDistribution_STRICT(
                      priceRows,
                      parkingSelection,
                      allPriceBandsByCategory[parkingSelection.category] || [],
                      getCatMarFromRow,
                      parkingRules.tierPct || {}
                    );



          // ✅ Récupère TOUS les vélos d'un tier pour la catégorie sélectionnée (avec filtres actifs)
          const getVelosByTier = (tier) => {
            let filtered = rowsForPrices || [];
            if (parkingSelection.category) {
              filtered = filtered.filter(r => normStr(getCategoryFromRow(r)) === normStr(parkingSelection.category));
            }
            if (parkingSelection.size) {
              const wanted = String(parkingSelection.size).trim().toUpperCase();
              filtered = filtered.filter(r => {
                const buckets = (getVariantSizeBucketsFromRow(r) || []).map(x => String(x).trim().toUpperCase());
                return buckets.includes(wanted);
              });
            }
            if (parkingSelection.priceBand) {
              filtered = filtered.filter(r => {
                const b = getPriceBand(getPriceFromRow(r), bandsToUse);
                return normStr(b) === normStr(parkingSelection.priceBand);
              });
            }
            return filtered.filter(r => {
              const t = String(getCatMarFromRow(r) || "").trim().toUpperCase();
              return t === tier;
            });
          };

          // ✅ Récupère le nombre d'unités pour un tier donné (avec les filtres actifs)
          const getUnitsByTier = (tier) => {
            return getVelosByTier(tier).reduce((sum, v) => sum + (getRowTotalStock(v) || 0), 0);
          };

          // ✅ Récupère TOUTES les marques d'un tier pour la catégorie sélectionnée (sans filtre prix)
          const getBrandsByTier = (tier) => {
            const brands = new Set();
            (rowsForPrices || [])
              .filter(r => {
                const t = String(getCatMarFromRow(r) || "").trim().toUpperCase();
                return t === tier;
              })
              .forEach(r => {
                const brand = String(r?.["Marque"] || "").trim();
                if (brand) brands.add(brand);
              });
            return Array.from(brands).sort((a, b) => a.localeCompare(b, "fr"));
          };

          function shrinkRowsForUI(rows, filterKey) {
  const selected = parkingSelection?.[filterKey];

  // ✅ Si cette dimension est filtrée -> on n'affiche que la ligne sélectionnée
  if (selected) {
    return (rows || []).filter((r) => normStr(r.key) === normStr(selected));
  }

  // ✅ Sinon -> on laisse TOUT (y compris 0 unités)
  return rows || [];
}

          const renderTable = (title, rows, filterKey) => {
            // Helper pour formater les labels des tranches de prix
            const formatLabel = (key, filterType) => {
              if (filterType !== "priceBand") return key;

              // Si c'est une tranche de prix, chercher dans le cache et afficher min-max
              if (bandsToUse && bandsToUse.length > 0) {
                const band = bandsToUse.find(b => normStr(b.label) === normStr(key));
                if (band) {
                  return band.max ? `${band.min}€-${band.max}€` : `${band.min}€+`;
                }
              }
              return key;
            };

            return (
            <div className="parking-card">
              <div className="parking-card-title">{title}</div>

              <div className="parking-table">
                <div className="parking-row parking-head">
                  <div>Clé</div>
                  <div>Actuel</div>
                  <div>Obj</div>
                  <div>Écart</div>
                </div>

                {rows.map((r) => {
                  const active =
                    parkingSelection?.[filterKey] && normStr(parkingSelection[filterKey]) === normStr(r.key);

                  return (
                    <div
                      key={r.key}
                      className={`parking-row parking-row-clickable ${active ? "active" : ""}`}
                      onClick={() => toggleParkingFilter(filterKey, r.key)}
                      title="Cliquer pour filtrer (re-cliquer pour enlever)"
                    >
                      <div className="parking-key">{formatLabel(r.key, filterKey) || "—"}</div>

                      <div>
                        <div className="parking-strong">{Math.round(r.actualUnits)} u</div>
                        <div className="parking-muted">{Math.round(r.actualPct * 100)}%</div>
                      </div>

                      <div>
                        <div className="parking-strong">{Math.round(r.targetUnits)} u</div>
                        <div className="parking-muted">{Math.round(r.targetPct * 100)}%</div>
                      </div>

                      <div
                        className={
                          r.gapUnits > 0
                            ? "parking-gap plus"
                            : r.gapUnits < 0
                            ? "parking-gap minus"
                            : "parking-gap"
                        }
                      >
                        {r.gapUnits > 0 ? `+${Math.round(r.gapUnits)}` : `${Math.round(r.gapUnits)}`} u
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
            };

          return (
            <div className="parking-body">
              {/* Barre filtres ultra-compacte - affichée SEULEMENT si un filtre est actif */}
              {Object.values(parkingSelection).some(v => v) && (
              <div style={{
                gridColumn: "1 / -1",
                padding: "4px 8px",
                background: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
                fontSize: 11,
                marginBottom: 16
              }}>
                {parkingSelection.category && (
                  <span style={{ fontWeight: 700, padding: "2px 6px", background: "#3b82f6", color: "white", borderRadius: 3, fontSize: 10 }}>
                    CAT: {parkingSelection.category}
                  </span>
                )}
                {parkingSelection.size && (
                  <span style={{ fontWeight: 700, padding: "2px 6px", background: "#8b5cf6", color: "white", borderRadius: 3, fontSize: 10 }}>
                    TAILLE: {parkingSelection.size}
                  </span>
                )}
                {parkingSelection.priceBand && (
                  <span style={{ fontWeight: 700, padding: "2px 6px", background: "#ec4899", color: "white", borderRadius: 3, fontSize: 10 }}>
                    PRIX: {parkingSelection.priceBand}
                  </span>
                )}
                <div style={{ marginLeft: "auto", color: "#1f2937", fontWeight: 600, fontSize: 11 }}>
                  {Math.round(filteredUnits)} / {Math.round(baseUnits)} u
                </div>
                {Object.values(parkingSelection).some(v => v) && (
                  <button type="button" onClick={clearParkingFilters} style={{
                    padding: "2px 4px",
                    fontSize: 10,
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontWeight: 700
                  }}>
                    ✕
                  </button>
                )}
              </div>
              )}

              {/* Arbre de décision interactif */}
              <div style={{ gridColumn: "1 / -1" }}>
                {/* ÉTAPE 1: CATÉGORIES */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#1f2937" }}>
                    1️⃣ Sélectionner une catégorie
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {(() => {
                      // Filtrer et trier les catégories
                      const filtered = catRows.filter(r => Object.keys(allPriceBandsByCategory).some(key => key.startsWith(r.key)));
                      return filtered.sort((a, b) => a.key.localeCompare(b.key));
                    })().map((r) => {
                      const active = parkingSelection.category && normStr(parkingSelection.category) === normStr(r.key);
                      const isOverTarget = r.gapUnits > 0;
                      const isUnderTarget = r.gapUnits < 0;
                      const gapColor = isOverTarget ? "#ef4444" : isUnderTarget ? "#10b981" : "#6b7280";

                      // Formater le label: supprimer le type et ajouter un logo
                      const isElectric = r.key.includes("Électrique");
                      const isMusculaire = r.key.includes("Musculaire");
                      const categoryName = r.key.replace(" - Électrique", "").replace(" - Musculaire", "").trim();
                      const displayLabel = isElectric ? `${categoryName} ⚡` : isMusculaire ? `${categoryName} 🦵` : categoryName;

                      return (
                        <div
                          key={r.key}
                          onClick={() => toggleParkingFilter("category", r.key)}
                          style={{
                            padding: 16,
                            borderRadius: 12,
                            border: active ? `3px solid ${gapColor}` : "2px solid #e5e7eb",
                            background: active ? (isOverTarget ? "rgba(239, 68, 68, 0.1)" : isUnderTarget ? "rgba(16, 185, 129, 0.1)" : "#f3f4f6") : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: active ? `0 0 0 3px ${gapColor}33` : "none"
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 10 }}>
                            {displayLabel}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Actuel</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                                {Math.round(r.actualUnits)}
                              </div>
                              <div style={{ fontSize: 10, color: "#999" }}>u ({Math.round(r.actualPct * 100)}%)</div>
                            </div>
                            <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                              <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Objectif</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                                {Math.round(r.targetUnits)}
                              </div>
                              <div style={{ fontSize: 10, color: "#999" }}>u ({Math.round(r.targetPct * 100)}%)</div>
                            </div>
                          </div>
                          <div style={{
                            padding: isOverTarget ? "10px 12px" : "8px 12px",
                            borderRadius: 6,
                            background: gapColor,
                            color: "white",
                            fontWeight: 700,
                            fontSize: isOverTarget ? 13 : 13,
                            textAlign: "center",
                            transform: isOverTarget ? "scale(1.05)" : "scale(1)"
                          }}>
                            {isOverTarget ? `⚠️ SURSTOCK +${Math.round(r.gapUnits)} u` : isUnderTarget ? `${Math.round(Math.abs(r.gapUnits))} u manquants` : "✓ Équilibré"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ÉTAPE 2: TAILLES */}
                {parkingSelection.category && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#1f2937" }}>
                      2️⃣ Sélectionner une taille
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                      {(() => {
                        const sizeOrder = ["XS", "S", "M", "L", "XL"];
                        return shrinkRowsForUI(sizeRows, "size").sort((a, b) => {
                          const indexA = sizeOrder.indexOf(a.key.toUpperCase());
                          const indexB = sizeOrder.indexOf(b.key.toUpperCase());
                          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                        });
                      })().map((r) => {
                        const active = parkingSelection.size && normStr(parkingSelection.size) === normStr(r.key);
                        const isOverTarget = r.gapUnits > 0;
                        const isUnderTarget = r.gapUnits < 0;
                        const gapColor = isOverTarget ? "#ef4444" : isUnderTarget ? "#10b981" : "#6b7280";

                        return (
                          <div
                            key={r.key}
                            onClick={() => toggleParkingFilter("size", r.key)}
                            style={{
                              padding: 16,
                              borderRadius: 12,
                              border: active ? `3px solid ${gapColor}` : "2px solid #e5e7eb",
                              background: active ? (isOverTarget ? "rgba(239, 68, 68, 0.1)" : isUnderTarget ? "rgba(16, 185, 129, 0.1)" : "#f3f4f6") : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: active ? `0 0 0 3px ${gapColor}33` : "none"
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 10 }}>
                              {r.key}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                              <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                                <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Actuel</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                                  {Math.round(r.actualUnits)}
                                </div>
                                <div style={{ fontSize: 10, color: "#999" }}>u ({Math.round(r.actualPct * 100)}%)</div>
                              </div>
                              <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                                <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Objectif</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                                  {Math.round(r.targetUnits)}
                                </div>
                                <div style={{ fontSize: 10, color: "#999" }}>u ({Math.round(r.targetPct * 100)}%)</div>
                              </div>
                            </div>
                            <div style={{
                              padding: isOverTarget ? "10px 12px" : "8px 12px",
                              borderRadius: 6,
                              background: gapColor,
                              color: "white",
                              fontWeight: 700,
                              fontSize: isOverTarget ? 14 : 13,
                              textAlign: "center",
                              transform: isOverTarget ? "scale(1.05)" : "scale(1)"
                            }}>
                              {isOverTarget ? `⚠️ SURSTOCK +${Math.round(r.gapUnits)} u` : isUnderTarget ? `${Math.round(Math.abs(r.gapUnits))} u` : "✓"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3: PRIX */}
                {parkingSelection.category && parkingSelection.size && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#1f2937" }}>
                      3️⃣ Sélectionner une tranche de prix
                    </div>
                    {/* Diagnostic: bandsToUse */}
                    {(!bandsToUse || bandsToUse.length === 0) && (
                      <div style={{ color: "#b91c1c", fontWeight: 700, marginBottom: 12 }}>
                        ⚠️ Aucune tranche de prix disponible. Vérifiez la source des tranches.
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                      {(() => {
                        // Correction: calculer le taux et l'objectif à partir de la sélection courante
                        return shrinkRowsForUI(priceRows, "priceBand")
                          .filter(r => bandsToUse.some(b => normStr(b.label) === normStr(r.key)))
                          .sort((rowA, rowB) => {
                            const bandA = bandsToUse.find(b => normStr(b.label) === normStr(rowA.key));
                            const bandB = bandsToUse.find(b => normStr(b.label) === normStr(rowB.key));
                            const minA = bandA?.min ?? 0;
                            const minB = bandB?.min ?? 0;
                            return minA - minB;
                          });
                      })().map((r) => {
                        const active = parkingSelection.priceBand && normStr(parkingSelection.priceBand) === normStr(r.key);
                        const bandObj = bandsToUse.find(b => normStr(b.label) === normStr(r.key));
                        const pricePct = bandObj?.share_pct || 0;
                        // Objectif total pour la catégorie et taille sélectionnée
                        const categoryPct = parkingRules.categoryPct?.[parkingSelection.category] || 0;
                        const sizePct = parkingRules.sizePct?.[parkingSelection.size] || 0;
                        const objectiveTotal = parkingRules.objectiveTotal || 0;
                        const targetUnits = Math.round(objectiveTotal * categoryPct * sizePct * pricePct);
                        const actualUnits = r.actualUnits;
                        const actualPct = actualUnits / (objectiveTotal * categoryPct * sizePct || 1);
                        const isOverTarget = actualUnits > targetUnits;
                        const isUnderTarget = actualUnits < targetUnits;
                        const gapUnits = actualUnits - targetUnits;
                        const gapColor = isOverTarget ? "#ef4444" : isUnderTarget ? "#10b981" : "#6b7280";

                        // Formater le label pour les tranches de prix
                        const formatLabel = (key) => {
                          if (bandsToUse && bandsToUse.length > 0) {
                            const band = bandsToUse.find(b => normStr(b.label) === normStr(key));
                            if (band) {
                              return band.max ? `${band.min}€-${band.max}€` : `${band.min}€+`;
                            }
                          }
                          return key;
                        };

                        return (
                          <div
                            key={r.key}
                            onClick={() => toggleParkingFilter("priceBand", r.key)}
                            style={{
                              padding: 16,
                              borderRadius: 12,
                              border: active ? `3px solid ${gapColor}` : "2px solid #e5e7eb",
                              background: active ? (isOverTarget ? "rgba(239, 68, 68, 0.1)" : isUnderTarget ? "rgba(16, 185, 129, 0.1)" : "#f3f4f6") : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: active ? `0 0 0 3px ${gapColor}33` : "none"
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 10 }}>
                              {formatLabel(r.key)}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                              <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                                <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Actuel</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                                  {Math.round(actualUnits)}
                                </div>
                                <div style={{ fontSize: 10, color: "#999" }}>u ({Math.round(actualPct * 100)}%)</div>
                              </div>
                              <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                                <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Objectif</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                                  {Math.round(targetUnits)}
                                </div>
                                <div style={{ fontSize: 10, color: "#999" }}>u ({Math.round(pricePct * 100)}%)</div>
                              </div>
                            </div>
                            <div style={{
                              padding: isOverTarget ? "10px 12px" : "8px 12px",
                              borderRadius: 6,
                              background: gapColor,
                              color: "white",
                              fontWeight: 700,
                              fontSize: isOverTarget ? 14 : 13,
                              textAlign: "center",
                              transform: isOverTarget ? "scale(1.05)" : "scale(1)"
                            }}>
                              {isOverTarget ? `⚠️ SURSTOCK +${Math.round(gapUnits)} u` : isUnderTarget ? `${Math.round(Math.abs(gapUnits))} u` : "✓"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            {/* ✅ ÉTAPE 4: MARQUES (CAT_MAR) */}
            {parkingSelection.priceBand && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#1f2937" }}>
                  4️⃣ Marques par CAT_MAR
                </div>
                  {/* Diagnostic: vélos par tier */}
                  {(["A", "B", "C", "D"].every(tier => (getVelosByTier(tier) || []).length === 0)) && (
                    <div style={{ color: "#b91c1c", fontWeight: 700, marginBottom: 12 }}>
                      ⚠️ Aucun vélo trouvé dans les tiers. Vérifiez l'index des marques classées et la source des vélos.
                    </div>
                  )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {[
                    ["A", getBrandsByTier("A")],
                    ["B", getBrandsByTier("B")],
                    ["C", getBrandsByTier("C")],
                    ["D", getBrandsByTier("D")],
                  ].map(([tierLabel, list]) => {
                    const velosInTier = getVelosByTier(tierLabel);
                    const tierPct = parkingTierPct[tierLabel] || 0;
                    const actualUnits = getUnitsByTier(tierLabel);
                    const objTotalForTier = objTotalForCatMar || 0;
                    const targetUnits = Math.round((tierPct || 0) * objTotalForTier);
                    const gapUnits = actualUnits - targetUnits;
                    const isOverTarget = gapUnits > 0;
                    const isUnderTarget = gapUnits < 0;
                    const gapColor = isOverTarget ? "#ef4444" : isUnderTarget ? "#10b981" : "#6b7280";
                      // Diagnostic: objectif total
                      if (objTotalForCatMar === 0 && velosInTier.length > 0) {
                        console.warn(`⚠️ Objectif total (dn) est à 0 alors que des vélos existent dans le tier ${tierLabel}`);
                      }

                    return (
                      <div
                        key={tierLabel}
                        className="tier-card-hover"
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          border: "2px solid #e5e7eb",
                          background: "#fff",
                          cursor: "default",
                          transition: "all 0.2s",
                          position: "relative"
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 10 }}>
                          Tier {tierLabel}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Actuel</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                              {actualUnits}
                            </div>
                            <div style={{ fontSize: 10, color: "#999" }}>vélos</div>
                          </div>
                          <div style={{ padding: "8px", background: "#f3f4f6", borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Objectif</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>
                              {targetUnits}
                            </div>
                            <div style={{ fontSize: 10, color: "#999" }}>({Math.round(tierPct * 100)}%)</div>
                          </div>
                        </div>
                        <div style={{
                          padding: isOverTarget ? "10px 12px" : "8px 12px",
                          borderRadius: 6,
                          background: gapColor,
                          color: "white",
                          fontWeight: 700,
                          fontSize: isOverTarget ? 14 : 13,
                          textAlign: "center",
                          transform: isOverTarget ? "scale(1.05)" : "scale(1)",
                          marginBottom: 10
                        }}>
                          {isOverTarget ? `⚠️ SURSTOCK +${Math.round(gapUnits)} u` : isUnderTarget ? `${Math.round(Math.abs(gapUnits))} u manquants` : "✓ Équilibré"}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {list.map((b) => (
                            <span
                              key={b}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 6px",
                                borderRadius: 4,
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "#fafafa",
                                fontWeight: 700,
                                fontSize: 11,
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={b}
                            >
                              {b}
                            </span>
                          ))}
                          {list.length === 0 && (
                            <div style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>
                              Aucune marque
                            </div>
                          )}
                        </div>

                        {/* Tooltip au survol avec liste des vélos */}
                        {velosInTier.length > 0 && (
                          <div className="tier-velos-tooltip">
                            <div style={{ fontWeight: 700, marginBottom: 8, borderBottom: "1px solid #e5e7eb", paddingBottom: 6 }}>
                              Vélos Tier {tierLabel} ({velosInTier.length})
                            </div>
                            <div style={{ maxHeight: 400, overflowY: "auto" }}>
                              {velosInTier.map((v, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    padding: 8,
                                    borderBottom: i < velosInTier.length - 1 ? "1px solid #f3f4f6" : "none",
                                    alignItems: "center",
                                  }}
                                >
                                  {v.photo && (
                                    <img
                                      src={v.photo}
                                      alt={v.model}
                                      style={{
                                        width: 50,
                                        height: 50,
                                        objectFit: "cover",
                                        borderRadius: 6,
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {v.brand} {v.model}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                                      {v.year} · {v.price}€
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Marques non classées dans un tier */}
                {(() => {
                  // Récupérer toutes les marques du stock filtré (parkingSelection)
                  // Utilise la même source que pour l'affichage des cartes de tiers
                  const allStockBrands = (priceRows || []).map(v => v.brand).filter(Boolean);
                  // Récupérer toutes les marques classées dans un tier
                  const tierBrands = ["A", "B", "C", "D"].flatMap(tier => getBrandsByTier(tier));
                  // Marques non classées
                  const unclassifiedBrands = [...new Set(allStockBrands.filter(b => !tierBrands.includes(b)))].sort((a, b) => a.localeCompare(b, "fr"));
                  if (unclassifiedBrands.length === 0) return null;
                  return (
                    <div style={{ marginTop: 32, padding: 16, background: "#fef9c3", borderRadius: 10, border: "1px solid #fde68a" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#b45309", marginBottom: 8 }}>
                        Marques à classer (non assignées à un tier)
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {unclassifiedBrands.map(b => (
                          <span key={b} style={{ padding: "4px 8px", background: "#fef3c7", borderRadius: 6, fontWeight: 600, fontSize: 13, border: "1px solid #fde68a" }}>{b}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            </div>
          );
        })()}

      {/* =======================
          TAB : PARAMÈTRES
          ======================= */}
      {parkingTab === "params" && (
        <div className="parking-body-params">
          <div
            style={{
              width: "100%",
              maxWidth: "none",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* SECTION SÉLECTION CATÉGORIE/TYPE */}
            <div className="parking-card" style={{background: "#f0fdf4", borderLeft: "4px solid #22c55e"}}>
              <div className="parking-card-title">Filtre par catégorie et type</div>
              
              <div className="parking-form-row">
                <label>Catégorie de vélo</label>
                <select
                  value={parkingCategory || ""}
                  onChange={(e) => setParkingCategory(e.target.value || null)}
                >
                  {parkingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{marginTop: 10, fontSize: 12, color: "#666", fontStyle: "italic"}}>
                Cette sélection s'applique à tous les objectifs ci-dessous
              </div>
            </div>

            {/* GAUCHE : RÈGLES */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 14,
                alignItems: "start",
              }}
            >
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="parking-card">
                  <div className="parking-card-title">Objectif</div>

                  <div className="parking-form-row">
                    <label>Objectif total (unités)</label>
                    <input
                      type="number"
                      value={parkingRules.objectiveTotal}
                      onChange={(e) => {
                        const newTotal = Number(e.target.value || 0);
                        setParkingRules((p) => ({
                          ...p,
                          objectiveTotal: newTotal,
                        }));
                        saveParkingSettings({ objectiveTotal: newTotal });
                      }}
                    />
                  </div>
                </div>

              {[
                ["Catégories", "categoryPct"],
                ["Tailles", "sizePct"],
              ].map(([label, key]) => {
                const obj = parkingRules[key] || {};
                const keys = Object.keys(obj);

                return (
                  <div key={key} className="parking-card">
                    <div className="parking-card-title">{label}</div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 15,
                      }}
                    >
                      {keys.map((k) => (
                        <div
                          key={k}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 90px 20px",
                            alignItems: "center",
                            gap: 10,
                            padding: 10,
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            minWidth: 0,
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 13, minWidth: 0 }}>{k}</div>

                          <input
                            type="number"
                            step="1"
                            value={Math.round(clamp01(obj[k]) * 100)}
                            onChange={(e) => {
                              const pct = clamp01(Number(e.target.value || 0) / 100);
                              setParkingRules((p) => {
                                const newObj = { ...(p[key] || {}), [k]: pct };
                                const updated = { ...p, [key]: newObj };
                                // Sauvegarder dans Supabase - ne passer que la clé modifiée
                                saveParkingSettings({ [key]: newObj });
                                return updated;
                              });
                            }}
                            style={{ width: "100%" }}
                          />

                          <div style={{ opacity: 0.7 }}>%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              </div>

              {/* DROITE : Paramètres liés à la catégorie/type */}
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Sélecteur catégorie/type déplacé ici */}
                <div className="parking-card" style={{ marginBottom: 0, paddingBottom: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Catégorie & Type de vélo</div>
                  <select
                    value={parkingCategory || ""}
                    onChange={e => setParkingCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 15, marginBottom: 8 }}
                  >
                    <option value="">Sélectionner…</option>
                    {parkingCategories.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Paramètres tranches de prix */}
                <div className="parking-card">
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Paramètres tranches de prix</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Extraire category et type
                        const parts = (parkingCategory || "").split(" - ");
                        const category = parts[0] || "";
                        const type = parts[1] || "";

                        const newBand = {
                          id: `band-${Date.now()}`,
                          min: null,
                          max: null,
                          share_pct: 0,
                          label: `Tranche ${priceBands.length + 1}`,
                          bike_category: category,
                          bike_type: type,
                        };
                        const newBands = [...priceBands, newBand];

                        // Ne pas valider à l'ajout - l'utilisateur remplira les valeurs ensuite
                        setPriceBands(newBands);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#10b981",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      + Ajouter
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {priceBands.map((band, idx) => (
                      <div
                        key={band.id || idx}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid rgba(0,0,0,0.12)",
                          background: "rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 28px", gap: 8, alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Min (€)</label>
                            <input
                              type="number"
                              value={band.min ?? ""}
                              onChange={(e) => {
                                const newBands = [...priceBands];
                                newBands[idx] = { ...newBands[idx], min: Number(e.target.value) || 0 };
                                setPriceBands(newBands);
                              }}
                              onBlur={(e) => {
                                const newBands = [...priceBands];
                                const minVal = Number(e.target.value) || 0;
                                newBands[idx] = { ...newBands[idx], min: minVal };

                                // Mettre à jour le label avec le format min-max
                                const max = newBands[idx].max;
                                newBands[idx].label = max ? `${minVal}€-${max}€` : `${minVal}€+`;

                                // Valider les chevauchements
                                const validation = validatePriceBandOverlap(newBands);
                                if (!validation.valid) {
                                  alert("⚠️ " + validation.error);
                                  return;
                                }

                                setPriceBands(newBands);
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 13,
                                borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.16)",
                                height: 34,
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Max (€)</label>
                            <input
                              type="number"
                              value={band.max ?? ""}
                              onChange={(e) => {
                                const newBands = [...priceBands];
                                newBands[idx] = { ...newBands[idx], max: Number(e.target.value) || null };
                                setPriceBands(newBands);
                              }}
                              onBlur={(e) => {
                                const newBands = [...priceBands];
                                const maxVal = Number(e.target.value) || null;
                                newBands[idx] = { ...newBands[idx], max: maxVal };

                                // Mettre à jour le label avec le format min-max
                                const min = newBands[idx].min;
                                newBands[idx].label = maxVal ? `${min}€-${maxVal}€` : `${min}€+`;

                                // Valider les chevauchements
                                const validation = validatePriceBandOverlap(newBands);
                                if (!validation.valid) {
                                  alert("⚠️ " + validation.error);
                                  return;
                                }

                                setPriceBands(newBands);
                              }}
                              placeholder="∞"
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 13,
                                borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.16)",
                                height: 34,
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Part (%)</label>
                            <input
                              type="number"
                              step="1"
                              value={Math.round((band.share_pct || 0) * 100)}
                              onChange={(e) => {
                                const pct = clamp01(Number(e.target.value || 0) / 100);
                                const newBands = [...priceBands];
                                newBands[idx] = { ...newBands[idx], share_pct: pct };
                                setPriceBands(newBands);

                                setParkingRules((p) => ({
                                  ...p,
                                  pricePct: { ...(p.pricePct || {}), [band.label]: pct },
                                }));
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 13,
                                borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.16)",
                                height: 34,
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              const bandToDelete = priceBands[idx];

                              // Supprimer de Supabase si elle a un vrai ID
                              if (bandToDelete.id && !String(bandToDelete.id).startsWith("band-")) {
                                try {
                                  const { error } = await supabase
                                    .from("pv_price_bands")
                                    .delete()
                                    .eq("id", bandToDelete.id);

                                  if (error) {
                                    console.error("❌ Erreur suppression:", error);
                                    alert("Erreur lors de la suppression");
                                    return;
                                  }
                                  console.log("✅ Tranche supprimée de Supabase");
                                } catch (err) {
                                  console.error("❌ Exception suppression:", err);
                                  alert("Erreur lors de la suppression");
                                  return;
                                }
                              }

                              // Supprimer localement
                              const newBands = priceBands.filter((_, i) => i !== idx);
                              setPriceBands(newBands);
                            }}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: "none",
                              background: "#ef4444",
                              color: "white",
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: "pointer",
                              height: 34,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Supprimer cette tranche"
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                          {band.min ?? 0}€ - {band.max ? `${band.max}€` : "∞"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={saveAllPriceBands}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#3b82f6",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      marginTop: 12,
                    }}
                  >
                    💾 Enregistrer les tranches
                  </button>
                </div>

                {/* Paramètres CAT MAR */}
                <div className="parking-card" style={{ minHeight: 320 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Paramètres CAT MAR</div>
                  <BrandTierBoard 
                    tierPct={parkingTierPct} 
                    onTierPctChange={handleTierPctChange}
                    selectedCategoryType={parkingCategory}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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

{promoModalOpen && (
  <div
    onClick={() => !promoSaving && setPromoModalOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "min(980px, 96vw)",
        maxHeight: "90vh",
        overflow: "auto",
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Créer une promo (bulk)</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="icon-btn"
            onClick={promo_addRule}
            disabled={promoSaving}
            title="Ajouter une règle"
          >
            + Règle
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => !promoSaving && setPromoModalOpen(false)}
            title="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Settings */}
      <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Cible : {promo_getSelectedVelos().length} vélo(x)</div>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Stratégie :
          <select
            value={promoStrategy}
            onChange={(e) => setPromoStrategy(e.target.value)}
            disabled={promoSaving}
          >
            <option value="first">Première règle qui match (priorité par ordre)</option>
            <option value="max">Plus grosse promo parmi les règles matchées</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Promo par défaut (si aucune règle) :
          <input
            type="number"
            value={promoDefaultAmount}
            onChange={(e) => setPromoDefaultAmount(parseNumericValue(e.target.value) || 0)}
            disabled={promoSaving}
            style={{ width: 110 }}
          />
          €
        </label>
      </div>

      {promoError && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: promoError.startsWith("✅") ? "#d1fae5" : "#fee2e2", color: promoError.startsWith("✅") ? "#065f46" : "#991b1b" }}>
          {promoError}
        </div>
      )}

      {/* ✅ Section modification promo */}
      <div style={{ marginTop: 16, padding: 14, border: "2px solid #3b82f6", borderRadius: 12, background: "#eff6ff" }}>
        <h3 style={{ margin: "0 0 12px 0", color: "#1e40af" }}>🔧 Modifier les promos en cours</h3>
        
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Montant à ajouter/soustraire :
            <input
              type="number"
              value={promoModifyAmount}
              onChange={(e) => setPromoModifyAmount(parseNumericValue(e.target.value) || 0)}
              disabled={promoSaving}
              style={{ width: 120, fontWeight: 700 }}
              placeholder="ex: -50 ou +100"
            />
            €
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Appliquer sur :
            <select
              value={promoModifyTarget}
              onChange={(e) => setPromoModifyTarget(e.target.value)}
              disabled={promoSaving}
            >
              <option value="all">Tous les vélos sélectionnés</option>
              <option value="withpromo">Uniquement les vélos déjà promotionnés</option>
            </select>
          </label>

          <button
            type="button"
            className="save-btn"
            onClick={promo_modifyExisting}
            disabled={promoSaving || promo_getSelectedVelos().length === 0}
            style={{ marginLeft: "auto" }}
          >
            {promoSaving ? "Modification..." : "Modifier les promos"}
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          💡 Montant positif = augmenter la promo, négatif = diminuer la promo. Le résultat ne peut pas être négatif.
        </div>
      </div>

      {/* Rules */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
          Règles appliquées sur les vélos sélectionnés. Tu peux combiner “Âge (jours depuis publication)” et “Prix”.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {promoRules.map((r, idx) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 10,
                display: "grid",
                gridTemplateColumns: "34px 1.1fr 1fr 110px 110px 120px 44px",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                checked={!!r.enabled}
                onChange={(e) => promo_updateRule(r.id, { enabled: e.target.checked })}
                disabled={promoSaving}
                title="Activer/désactiver"
              />

              <div style={{ fontWeight: 800 }}>Règle {idx + 1}</div>

              <select
                value={r.type}
                onChange={(e) => {
                  const type = e.target.value;
                  if (type === "age_days") promo_updateRule(r.id, { type, op: "between", v1: 15, v2: 30 });
                  else promo_updateRule(r.id, { type, op: ">=", v1: 2500, v2: null });
                }}
                disabled={promoSaving}
              >
                <option value="age_days">Âge (jours depuis publication)</option>
                <option value="price">Prix</option>
              </select>

              <select
                value={r.op}
                onChange={(e) => promo_updateRule(r.id, { op: e.target.value })}
                disabled={promoSaving}
              >
                <option value="between">entre</option>
                <option value=">=">≥</option>
                <option value="<=">≤</option>
              </select>

              <input
                type="number"
                value={r.v1 ?? ""}
                onChange={(e) => promo_updateRule(r.id, { v1: parseNumericValue(e.target.value) })}
                disabled={promoSaving}
                style={{ width: "100%" }}
              />

              <input
                type="number"
                value={r.op === "between" ? (r.v2 ?? "") : ""}
                onChange={(e) => promo_updateRule(r.id, { v2: parseNumericValue(e.target.value) })}
                disabled={promoSaving || r.op !== "between"}
                style={{ width: "100%", opacity: r.op === "between" ? 1 : 0.5 }}
                placeholder={r.op === "between" ? "max" : "—"}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  value={r.amount ?? 0}
                  onChange={(e) =>
                    promo_updateRule(r.id, { amount: parseNumericValue(e.target.value) || 0 })
                  }
                  disabled={promoSaving}
                  style={{ width: 90 }}
                />
                <span style={{ fontWeight: 900 }}>€</span>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => promo_removeRule(r.id)}
                disabled={promoSaving || promoRules.length <= 1}
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
        <h3 style={{ margin: "0 0 8px 0" }}>Aperçu</h3>

        {(() => {
          const velosSel = promo_getSelectedVelos();
          if (velosSel.length === 0) return <div style={{ color: "#6b7280" }}>Aucun vélo sélectionné.</div>;

          const preview = velosSel.slice(0, 12).map((v) => {
            const promo = promo_computePromoForVelo(v, promoRules, promoStrategy, promoDefaultAmount);
            const days = daysSince(promo_getPublishedAt(v)); // ✅ ta daysSince existante
            const price = parseNumericValue(v?.Price ?? v?.price ?? v?.["Prix"] ?? v?.["Price"]);

            return {
              url: v.URL,
              title: v?.Title || v?.title || v?.Nom || "Vélo",
              days,
              price,
              promo,
            };
          });

          return (
            <>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                Affiche les 12 premiers vélos sélectionnés (sur {velosSel.length}).
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Vélo</th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Âge (j)</th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Prix (€)</th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Promo appliquée (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p) => (
                      <tr key={p.url}>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                          <div style={{ fontWeight: 700 }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.url}</div>
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                          {Number.isFinite(p.days) ? p.days : "—"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                          {Number.isFinite(p.price) ? p.price.toLocaleString("fr-FR") : "—"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", fontWeight: 900 }}>
                          -{(p.promo || 0).toLocaleString("fr-FR")} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>

      {/* Footer actions */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => !promoSaving && setPromoModalOpen(false)}
          disabled={promoSaving}
        >
          Annuler
        </button>

        <button
          type="button"
          className="save-btn"
          onClick={promo_applyToSupabase}
          disabled={promoSaving || promo_getSelectedVelos().length === 0}
        >
          {promoSaving ? "Application..." : "Appliquer la promo (Supabase)"}
        </button>
      </div>
    </div>
  </div>
)}

{exportModalOpen && (
  <div
    onClick={closeExportModal}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "min(720px, 96vw)",
        maxHeight: "90vh",
        overflow: "auto",
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <FaFileExport /> Exporter la BDD
        </h2>

        <button
          type="button"
          className="icon-btn"
          onClick={closeExportModal}
          title="Fermer"
        >
          ✕
        </button>
      </div>

      {/* Étape 1 */}
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>1) Choisir la base d’export</div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="radio"
              name="exportBase"
              checked={exportBase === "url"}
              onChange={() => setExportBase("url")}
            />
            <span><b>URL</b> (colonne `URL`)</span>
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="radio"
              name="exportBase"
              checked={exportBase === "serial"}
              onChange={() => setExportBase("serial")}
            />
            <span><b>Numéro de série</b> (tous les numéros détectés)</span>
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="radio"
              name="exportBase"
              checked={exportBase === "variant_id"}
              onChange={() => setExportBase("variant_id")}
            />
            <span><b>Variant ID</b> (colonne `Variant ID` si présente)</span>
          </label>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
          Pour l’instant, l’export contient : <b>Prix réduit</b> (velosmint) + <b>mint_promo_amount</b> (mode_pricing).
          L’étape “choix des champs” viendra ensuite.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
        <button type="button" onClick={closeExportModal}>
          Annuler
        </button>
        <button type="button" className="save-btn" onClick={exportDbNow}>
          Exporter CSV
        </button>
      </div>
    </div>
  </div>
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
{/* Ancien modal stats remplacé par KPIDashboard - code commenté */}
{false && statsOpen && (() => {
  // =========================
  // 🎨 Styles & couleurs
  // =========================
  const cardStyle = {
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "var(--bg-card, #fff)",
  };

  const sectionTitleStyle = {
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: 0.2,
    margin: "12px 0 8px",
    color: "var(--text, #111827)",
  };

  const hintStyle = { opacity: 0.65, fontSize: 12, marginTop: 6 };

  const COLORS = {
    primary: "#2563eb",
    good: "#16a34a",
    warn: "#f59e0b",
    bad: "#dc2626",
    gray: "#6b7280",
    purple: "#7c3aed",
    teal: "#0d9488",
    pink: "#db2777",
  };

  // Palette pie (catégories)
  const piePalette = [COLORS.primary, COLORS.teal, COLORS.purple, COLORS.warn, COLORS.pink, COLORS.gray];

  // Safe datasets
  const locationPieSafe   = statsData?.locationPie ?? [];
  const listingAgeDistSafe = statsData?.listingAgeDist ?? [];
  const stockAgeDistSafe   = statsData?.stockAgeDist ?? [];
  const priceHistoSafe     = statsData?.priceHisto ?? [];
  const benefitHistoSafe   = statsData?.benefitHisto ?? [];
  const mixTypologySafe    = statsData?.mixTypology ?? [];
  const elecMuscuSafe      = statsData?.elecMuscu ?? [];
  const saleBreakdownSafe  = statsData?.saleBreakdownPie ?? [];

  // =========================
  // 🔢 Helpers % + labels
  // =========================
  const formatUnits = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n)}`;
  };

  const getTotal = (arr, key) => (arr || []).reduce((s, x) => s + (Number(x?.[key]) || 0), 0);

  const pctLabelFrom = (value, total) => {
    const v = Number(value) || 0;
    const t = Number(total) || 0;
    if (t <= 0) return "0%";
    return `${Math.round((v / t) * 100)}%`;
  };

  // Ajoute une clé pctLabel (= "12%") pour les BarCharts
  const withPctLabel = (arr, key = "units") => {
    const total = getTotal(arr, key);
    return (arr || []).map((x) => ({
      ...x,
      __pctLabel: pctLabelFrom(x?.[key], total),
      __total: total,
    }));
  };

  // Couleur par barre (dégradé “clair -> foncé” selon la valeur, base couleur différente par chart)
  const hexToRgb = (hex) => {
    const h = String(hex || "").replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full || "000000", 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const rgbToHex = ({ r, g, b }) => {
    const to2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const blend = (fromHex, toHex, t) => {
    const A = hexToRgb(fromHex);
    const B = hexToRgb(toHex);
    const tt = clamp01(t);
    return rgbToHex({
      r: lerp(A.r, B.r, tt),
      g: lerp(A.g, B.g, tt),
      b: lerp(A.b, B.b, tt),
    });
  };

  const barColorByValue = (v, min, max, baseHex = COLORS.primary) => {
    const lo = Number(min) || 0;
    const hi = Number(max) || 1;
    const x = Number(v) || 0;
    const t = hi > lo ? (x - lo) / (hi - lo) : 0.5;
    // clair => foncé
    return blend("#e5e7eb", baseHex, 0.35 + 0.65 * clamp01(t));
  };

  // Pie label : affiche % du total sur les parts (et évite le bruit si très petit)
  const renderPiePercentLabel = ({ percent }) => {
    const p = Math.round((percent || 0) * 100);
    if (!Number.isFinite(p) || p <= 0) return "";
    if (p < 4) return ""; // évite l'encombrement
    return `${p}%`;
  };

  // =========================
  // 🧠 Tooltips
  // =========================
  const CustomBarTooltip = ({ active, payload, label, valueFormatter }) => {
    if (!active || !payload || !payload.length) return null;
    const v = payload[0]?.value;
    const pct = payload[0]?.payload?.__pctLabel;
    return (
      <div style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "8px 10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{label}</div>
        <div style={{ opacity: 0.9 }}>
          {valueFormatter ? valueFormatter(v) : formatUnits(v)} unités {pct ? `· ${pct}` : ""}
        </div>
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    const value = p?.value;
    const total = getTotal(p?.payload?.__srcArr || [], "__valueKey"); // fallback
    const pct = p?.payload?.__pct || null;
    return (
      <div style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "8px 10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{p?.name}</div>
        <div style={{ opacity: 0.9 }}>
          {formatUnits(value)} unités {pct ? `· ${pct}` : ""}
        </div>
      </div>
    );
  };

  // =========================
  // ✅ Prépare datasets (avec %)
  // =========================
  const listingAgeDist = withPctLabel(listingAgeDistSafe, "units");
  const stockAgeDist   = withPctLabel(stockAgeDistSafe, "units");
  const priceHisto     = withPctLabel(priceHistoSafe, "units");
  const benefitHisto   = withPctLabel(benefitHistoSafe, "units");
  const mixTypology    = withPctLabel(mixTypologySafe, "units");

  const attachPiePct = (arr, key = "units") => {
    const total = getTotal(arr, key);
    return (arr || []).map((x) => ({
      ...x,
      __pct: pctLabelFrom(x?.[key], total),
    }));
  };

  const locationPie  = attachPiePct(locationPieSafe, "units");
  const elecMuscu    = attachPiePct(elecMuscuSafe, "units");
  const saleBreakdown = attachPiePct(saleBreakdownSafe, "value");

  // =========================
  // 🪟 Modal
  // =========================
  return (
    <div
      onClick={() => setStatsOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1100px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "var(--bg-card, #fff)",
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Header sticky */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: "var(--bg-card, #fff)",
            paddingBottom: 10,
            borderBottom: "1px solid #eef2f7",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>KPI's du stock actuel (selon filtres)</h2>
              <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>
                Base analysée : <b>{filteredAndSortedVelos.length}</b> fiches ·{" "}
                <b>{statsData?.kpi?.totalUnits ?? 0}</b> unités en stock 📦
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatsOpen(false)}
              style={{
                border: "1px solid #e5e7eb",
                background: "var(--bg-card, #fff)",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                fontWeight: 800,
              }}
              title="Fermer"
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "var(--bg-card, #fff)",
              fontSize: 12,
              color: "var(--text, #111827)",
            }}>
              🧮 <b>Tout est pondéré unités</b> (📦)
            </div>

            <div style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "var(--bg-card, #fff)",
              fontSize: 12,
              color: "var(--text, #111827)",
            }}>
              💡 % affichés sur les barres / parts
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {/* =========================
              📌 SECTION: KPIs
             ========================= */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={sectionTitleStyle}>KPIs</div>
          </div>

          {/* KPI bloc 1 */}
          <div style={cardStyle}>
  <div style={{ fontWeight: 900, marginBottom: 10 }}>KPIs (pondérés unités 📦)</div>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
    {/* Base */}
    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Base (unités dispo)</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{statsData?.kpi?.totalUnits ?? 0}</div>
      <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
        {statsData?.kpi?.nRows ?? 0} fiches (info)
      </div>
    </div>

    {/* Valeur stock */}
    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Valeur stock (€)</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{fmtEur(statsData?.stockValueEur ?? 0)}</div>
      <div style={hintStyle}>prix réduit × unités</div>
    </div>

    {/* Marge */}
    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Moy marge (€/unité)</div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 18,
          color: (statsData?.avgBenefitPerUnit ?? 0) < 0 ? COLORS.bad : COLORS.good,
        }}
      >
        {statsData?.avgBenefitPerUnit == null ? "—" : fmtEur(statsData.avgBenefitPerUnit)}
      </div>
      <div style={hintStyle}>computeCardBenefit × unités</div>
    </div>

    {/* Risque / repricing */}
    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>% marge négative (unités)</div>
      <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.bad }}>
        {statsData?.kpi?.negPctUnits ?? 0}%
      </div>
      <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
        base = unités avec marge calculable
      </div>
    </div>

    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>% à repricer (&gt;15j) (unités)</div>
      <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.warn }}>
        {statsData?.kpi?.repricingPctUnits ?? 0}%
      </div>
      <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
        base = unités avec date pricing
      </div>
    </div>

    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Médiane marge (par fiche)</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{fmtEur(statsData?.kpi?.medBenefit ?? 0)}</div>
      <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
        (médiane par fiche, pas pondérée)
      </div>
    </div>

    {/* Âge mise en ligne */}
    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Moy durée mise en ligne</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>
        {statsData?.avgListingDays == null ? "—" : `${Math.round(statsData.avgListingDays)} j`}
      </div>
      <div style={hintStyle}>depuis “Published At”</div>
    </div>

    {/* KPI PROMO */}
    <div style={{ gridColumn: "1 / -1", marginTop: 6, paddingTop: 10, borderTop: "1px solid #eef2f7" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>KPIs promo</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
        <div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Part en promo (unités)</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {statsData?.kpi?.promoPctUnits ?? 0}%
          </div>
          <div style={hintStyle}>{statsData?.kpi?.promoUnits ?? 0} unités</div>
        </div>

        <div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Montant total promos (€)</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {fmtEur(statsData?.kpi?.promoTotalEur ?? 0)}
          </div>
          <div style={hintStyle}>mint_promo_amount × unités</div>
        </div>

        <div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Réduc moyenne (€/unité en promo)</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {fmtEur(statsData?.kpi?.promoAvgEur ?? 0)}
          </div>
          <div style={hintStyle}>max: {fmtEur(statsData?.kpi?.promoMaxEur ?? 0)}</div>
        </div>
      </div>
    </div>
  </div>
</div>


          {/* =========================
              📌 SECTION: Stock & structure
             ========================= */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={sectionTitleStyle}>Stock & structure</div>
          </div>

          {/* Pie partenaire vs sur place */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Répartition du stock (unités) — Fleeta vs Mint Bikes
            </div>

            {locationPie.length === 0 ? (
              <div style={{ opacity: 0.7 }}>
                Aucune donnée de série exploitable pour l’instant.
                <div style={hintStyle}>Tip : vérifie que les colonnes “Numéro de série variant X” sont remplies.</div>
              </div>
            ) : (
              <>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={locationPie}
                        dataKey="units"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        labelLine={false}
                        label={(props) => renderPiePercentLabel(props)}
                      >
                        {locationPie.map((entry, idx) => (
                          <Cell key={`loc-${idx}`} fill={piePalette[idx % piePalette.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                  {locationPie.map((x, idx) => (
                    <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: piePalette[idx % piePalette.length], display: "inline-block" }} />
                      <div>
                        <b>{x.units}</b> unités — {x.name} <span style={{ opacity: 0.75 }}>({x.__pct})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Elec / muscu */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Répartition Électrique / Musculaire — en unités
            </div>

            {elecMuscu.length === 0 ? (
              <div style={{ opacity: 0.7 }}>Données indisponibles.</div>
            ) : (
              <>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={elecMuscu}
                        dataKey="units"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        labelLine={false}
                        label={(props) => renderPiePercentLabel(props)}
                      >
                        {elecMuscu.map((_, idx) => (
                          <Cell key={`pow-${idx}`} fill={piePalette[idx % piePalette.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={hintStyle}>
                  Utile pour comparer ensuite la marge et la durée stock entre électriques et musculaires.
                </div>
              </>
            )}
          </div>

          {/* =========================
              📌 SECTION: Âges / rotation
             ========================= */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={sectionTitleStyle}>Âges & rotation</div>
          </div>

          {/* Distribution mise en ligne */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Durée de mise en ligne — en unités
            </div>

            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={listingAgeDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="units">
                    {(() => {
                      const vals = listingAgeDist.map((d) => Number(d.units) || 0);
                      const min = Math.min(...vals, 0);
                      const max = Math.max(...vals, 1);
                      return listingAgeDist.map((d, idx) => (
                        <Cell key={`c1-${idx}`} fill={barColorByValue(d.units, min, max, COLORS.primary)} />
                      ));
                    })()}
                    {/* % du total sur chaque barre */}
                    <LabelList dataKey="__pctLabel" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={hintStyle}>Bins : ≤21j, 22–42j, 43–63j, 64–84j, &gt;84j</div>
          </div>
          {/* Scatter marge vs âge */}
<div style={cardStyle}>
  <div style={{ fontWeight: 900, marginBottom: 10 }}>
    Marge (€/unité) vs Âge annonce (jours) — objectif diagonale
  </div>

  {((statsData?.marginAgeScatter ?? []).length === 0) ? (
    <div style={{ opacity: 0.7 }}>Pas assez de données (Published At + breakdown marge).</div>
  ) : (
    <>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              type="number"
              dataKey="days"
              name="Jours en ligne"
              label={{ value: "Jours depuis mise en ligne", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="margin"
              name="Marge €/unité"
              label={{ value: "Marge €/unité", angle: -90, position: "insideLeft" }}
            />

            {/* Taille du point = unités stock */}
            <ZAxis type="number" dataKey="units" range={[40, 180]} name="Stock" />

            {/* Diagonale cible (à ajuster) */}
            {(() => {
              const x1 = 0,   y1 = 600;   // marge cible à J0
              const x2 = 180, y2 = 0;     // marge cible à 180 jours
              const band = 150;           // tolérance +/-

              return (
                <>
                  <ReferenceLine
                    segment={[{ x: x1, y: y1 }, { x: x2, y: y2 }]}
                    strokeDasharray="6 6"
                  />
                  <ReferenceLine
                    segment={[{ x: x1, y: y1 + band }, { x: x2, y: y2 + band }]}
                    strokeDasharray="2 6"
                  />
                  <ReferenceLine
                    segment={[{ x: x1, y: y1 - band }, { x: x2, y: y2 - band }]}
                    strokeDasharray="2 6"
                  />
                </>
              );
            })()}

            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name, props) => {
                // gère affichage par défaut
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload;
                if (!p) return null;
                return (
                  <div style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 10,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                    maxWidth: 320
                  }}>
                    <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 13 }}>
                      {p.title || "Annonce"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      <div><b>Jours en ligne :</b> {Math.round(p.days)}</div>
                      <div><b>Marge €/unité :</b> {fmtEur(p.margin)}</div>
                      <div><b>Stock :</b> {Math.round(p.units)} u</div>
                      {Number.isFinite(p.price) && <div><b>Prix :</b> {fmtEur(p.price)}</div>}
                      {p.promo > 0 && <div><b>Promo :</b> {fmtEur(p.promo)}</div>}
                      {p.url && (
                        <div style={{ marginTop: 6 }}>
                          <a href={p.url} target="_blank" rel="noreferrer">Ouvrir la fiche</a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            <Scatter
              data={statsData.marginAgeScatter}
              fill={COLORS.purple}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={hintStyle}>
        Objectif : plus une annonce vieillit, plus la marge doit baisser (ligne pointillée).  
        Les 2 lignes fines = bande de tolérance.
      </div>
    </>
  )}
</div>


          {/* =========================
              📌 SECTION: Prix & marge
             ========================= */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={sectionTitleStyle}>Prix & marge</div>
          </div>

          {/* Histogramme prix */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Répartition des prix (Prix réduit) — en unités
            </div>

            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={priceHisto}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip valueFormatter={(v) => `${formatUnits(v)}`} />} />
                  <Bar dataKey="units">
                    {(() => {
                      const vals = priceHisto.map((d) => Number(d.units) || 0);
                      const min = Math.min(...vals, 0);
                      const max = Math.max(...vals, 1);
                      return priceHisto.map((d, idx) => (
                        <Cell key={`c3-${idx}`} fill={barColorByValue(d.units, min, max, COLORS.teal)} />
                      ));
                    })()}
                    <LabelList dataKey="__pctLabel" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={hintStyle}>Bins = ceux que tu as définis dans statsData</div>
          </div>

          {/* Histogramme bénéfice */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Répartition des marges — en unités
            </div>

            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={benefitHisto}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="units">
                    {(() => {
                      const vals = benefitHisto.map((d) => Number(d.units) || 0);
                      const min = Math.min(...vals, 0);
                      const max = Math.max(...vals, 1);
                      return benefitHisto.map((d, idx) => (
                        <Cell key={`c4-${idx}`} fill={barColorByValue(d.units, min, max, COLORS.good)} />
                      ));
                    })()}
                    <LabelList dataKey="__pctLabel" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={hintStyle}>
              Le bénéfice vient de <code>computeCardBenefit</code> (achat / pièces / logistique).
            </div>
          </div>

          {/* =========================
              📌 SECTION: Mix
             ========================= */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={sectionTitleStyle}>Mix vélo</div>
          </div>

          {/* Mix typologie */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Répartition mix vélo (typologie) — en unités
            </div>

            <div style={{ width: "100%", height: 270 }}>
              <ResponsiveContainer>
                <BarChart data={mixTypology}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="units">
                    {(() => {
                      const vals = mixTypology.map((d) => Number(d.units) || 0);
                      const min = Math.min(...vals, 0);
                      const max = Math.max(...vals, 1);
                      return mixTypology.map((d, idx) => (
                        <Cell key={`c5-${idx}`} fill={barColorByValue(d.units, min, max, COLORS.purple)} />
                      ));
                    })()}
                    <LabelList dataKey="__pctLabel" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={hintStyle}>VTT, VTT AE, VR, VR AE, GRVL, GRVL AE, VILLE…</div>
          </div>

          {/* Spacer / note */}
          <div style={{ ...cardStyle, opacity: 0.85 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Notes</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--text, #374151)" }}>
              <li>Tout est recalculé selon tes filtres + tri en cours.</li>
              <li>Base = unités dispo 📦 (pas le nombre de fiches).</li>
              <li>Les % affichés = part du total du graph (barres/pies).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
})()}
  </div>

  {/* Modal Inventaire */}
  <InventoryList 
    isOpen={inventoryOpen} 
    onClose={() => setInventoryOpen(false)}
    onCountChange={setInventoryCount}
  />

  {/* Modal KPI Dashboard */}
  <KPIDashboard
    isOpen={statsOpen}
    onClose={() => setStatsOpen(false)}
    statsData={statsData}
    velos={combinedVelosForStats}
    inventoryVelos={inventoryVelos}
    pricingByUrl={pricingByUrl}
    filteredVelosCount={filteredAndSortedVelos.length}
    stockMode={stockMode}
    setStockMode={setStockMode}
  />

  {/* 💲 Outil Prix Modal */}
  <PriceToolModal
    isOpen={priceToolOpen}
    onClose={() => setPriceToolOpen(false)}
    form={priceToolForm}
    onFormChange={setPriceToolForm}
    competitorLinks={priceToolCompetitorLinks}
    onSearchCompetitors={handlePriceToolSearchCompetitors}
    showCompetitors={priceToolShowCompetitors}
    onShowCompetitors={setPriceToolShowCompetitors}
    allBrands={velos.map(v => v?.["Marque"] || "").filter((v, i, arr) => v && arr.indexOf(v) === i).sort()}
    parkingCategories={parkingCategoryTypeOptions.map(c => c.label)}
    velos={velos}
    brandTiersIndex={brandTiersIndex}
    parkingRules={parkingRules}
    getCatMarFromRow={getCatMarFromRow}
    allPriceBandsByCategory={allPriceBandsByCategory}
    parkingTierPct={parkingTierPct}
    getRowTotalStock={getRowTotalStock}
    getSizeStocksFromRow={getSizeStocksFromRow}
    getVariantSizeBucketsFromRow={getVariantSizeBucketsFromRow}
  />
        </>
      )}
    </>
  );
}
   
export default App;
