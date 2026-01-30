import React, { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, BarChart, Bar, ScatterChart, Scatter, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ZAxis, CartesianGrid, Line, ComposedChart, LabelList } from "recharts";
import { supabase } from "./supabaseClient";

// Helper pour extraire le montant promo depuis velosmint (format: "-350 €" ou "-350€")
const getPromoAmount = (velo) => {
  const raw = velo?.["Montant promo"];
  if (!raw) return 0;
  // Nettoie le format: retire espaces, €, et prend la valeur absolue
  const cleaned = String(raw).replace(/[^\d.,-]/g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? Math.abs(value) : 0;
};

const KPIDashboard = ({ isOpen, onClose, statsData, velos = [], inventoryVelos = [], pricingByUrl = {}, filteredVelosCount, stockMode, setStockMode }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [upwayBikes, setUpwayBikes] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [waterfallTypeFilter, setWaterfallTypeFilter] = useState("tous");
  const [waterfallCategoryFilter, setWaterfallCategoryFilter] = useState("tous");
  const [hoveredKPI, setHoveredKPI] = useState(null);
  const [showUpwayComparison, setShowUpwayComparison] = useState(false);
  const [showUpwayPriceComparison, setShowUpwayPriceComparison] = useState(false);
  const [showUpwayCategoryComparison, setShowUpwayCategoryComparison] = useState(false);
  const [showUpwayCategoryPriceComparison, setShowUpwayCategoryPriceComparison] = useState(false);
  const [showUpwayBrandComparison, setShowUpwayBrandComparison] = useState(false);

  // Charger les données inventory
  useEffect(() => {
    if (!isOpen) return;
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .order("date_achat", { ascending: true });
        if (error) {
          console.error("Error loading inventory:", error);
          return;
        }
        if (data) {
          setInventoryData(data);
          // Définir le mois actuel par défaut
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          setSelectedMonth(currentMonth);
        }
      } catch (err) {
        console.error("Exception loading inventory:", err);
      }
    };
    const fetchUpwayBikes = async () => {
      try {
        // Récupérer tous les vélos avec pagination (Supabase limite à 1000 par défaut)
        let allBikes = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("upway_bikes")
            .select("*")
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) {
            console.error("Error loading upway_bikes:", error);
            break;
          }

          if (data && data.length > 0) {
            allBikes = [...allBikes, ...data];
            hasMore = data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }
        }

        console.log(`Chargé ${allBikes.length} vélos Upway`);
        setUpwayBikes(allBikes);
      } catch (err) {
        console.error("Exception loading upway_bikes:", err);
      }
    };
    fetchInventory();
    fetchUpwayBikes();
  }, [isOpen]);
  // KPIs pour Upway (concurrent) - Vélos mis en ligne
  const upwayKPIs = useMemo(() => {
    if (!upwayBikes.length) return null;
    // Nombre total de vélos
    const total = upwayBikes.length;
    // Prix total de vente (somme de tous les prix)
    const prices = upwayBikes.map(b => parseFloat((b.price || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0).filter(p => p > 0);
    const totalValue = prices.reduce((a, b) => a + b, 0);
    // Date publication: uploadedDate ou "uploadedDate"
    const now = new Date();
    const daysOnline = upwayBikes.map(b => {
      const d = b.uploadedDate || b["uploadedDate"];
      if (!d) return null;
      const date = new Date(d);
      if (isNaN(date.getTime())) return null;
      return Math.floor((now - date) / (1000 * 60 * 60 * 24));
    }).filter(x => x !== null);
    const avgDaysOnline = daysOnline.length ? daysOnline.reduce((a, b) => a + b, 0) / daysOnline.length : 0;
    return {
      total,
      totalValue,
      avgDaysOnline,
      daysOnline
    };
  }, [upwayBikes]);

  // Distribution d'âge pour Upway (pour comparaison graphique)
  const upwayAgeDist = useMemo(() => {
    if (!upwayKPIs?.daysOnline) return [];

    const ageRanges = [
      { range: "0-7j", min: 0, max: 7, count: 0 },
      { range: "7-30j", min: 7, max: 30, count: 0 },
      { range: "30-60j", min: 30, max: 60, count: 0 },
      { range: "60-90j", min: 60, max: 90, count: 0 },
      { range: "90-120j", min: 90, max: 120, count: 0 },
      { range: "120-150j", min: 120, max: 150, count: 0 },
      { range: "150j+", min: 150, max: Infinity, count: 0 },
    ];

    upwayKPIs.daysOnline.forEach(age => {
      if (age >= 0) {
        const bucket = ageRanges.find(r => age >= r.min && age < r.max);
        if (bucket) bucket.count += 1;
      }
    });

    return ageRanges.map(r => ({ name: r.range, value: r.count }));
  }, [upwayKPIs]);

  // Distribution des prix pour Upway (pour comparaison graphique)
  const upwayPriceDist = useMemo(() => {
    if (!upwayBikes.length) return [];

    const priceRanges = [
      { range: "0-500€", min: 0, max: 500, count: 0 },
      { range: "500-750€", min: 500, max: 750, count: 0 },
      { range: "750-1000€", min: 750, max: 1000, count: 0 },
      { range: "1000-1250€", min: 1000, max: 1250, count: 0 },
      { range: "1250-1500€", min: 1250, max: 1500, count: 0 },
      { range: "1500-1750€", min: 1500, max: 1750, count: 0 },
      { range: "1750-2000€", min: 1750, max: 2000, count: 0 },
      { range: "2000-2250€", min: 2000, max: 2250, count: 0 },
      { range: "2250-2500€", min: 2250, max: 2500, count: 0 },
      { range: "2500-2750€", min: 2500, max: 2750, count: 0 },
      { range: "2750-3000€", min: 2750, max: 3000, count: 0 },
      { range: "3000-3250€", min: 3000, max: 3250, count: 0 },
      { range: "3250-3500€", min: 3250, max: 3500, count: 0 },
      { range: "3500-3750€", min: 3500, max: 3750, count: 0 },
      { range: "3750-4000€", min: 3750, max: 4000, count: 0 },
      { range: "4000-4250€", min: 4000, max: 4250, count: 0 },
      { range: "4250-4500€", min: 4250, max: 4500, count: 0 },
      { range: "4500€+", min: 4500, max: Infinity, count: 0 },
    ];

    upwayBikes.forEach(b => {
      const price = parseFloat((b.price || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      if (price > 0) {
        const bucket = priceRanges.find(r => price >= r.min && price < r.max);
        if (bucket) bucket.count += 1;
      }
    });

    return priceRanges.map(r => ({ name: r.range, value: r.count }));
  }, [upwayBikes]);

  // Distribution des catégories pour Upway (quantités)
  const upwayCategoryDist = useMemo(() => {
    if (!upwayBikes.length) return [];

    const categoryElecMuscu = {};

    upwayBikes.forEach(b => {
      const cat = b["Catégorie"] || b.cargoCategory || "Non classé";
      const typeVelo = b["Type de vélo"] || (b.assistanceType ? "Electrique" : "Musculaire");

      if (!categoryElecMuscu[cat]) {
        categoryElecMuscu[cat] = { electrique: 0, musculaire: 0 };
      }

      if (typeVelo === "Electrique") {
        categoryElecMuscu[cat].electrique += 1;
      } else if (typeVelo === "Musculaire") {
        categoryElecMuscu[cat].musculaire += 1;
      }
    });

    const totalGeneral = Object.values(categoryElecMuscu).reduce((sum, counts) =>
      sum + counts.electrique + counts.musculaire, 0
    );

    return Object.entries(categoryElecMuscu).map(([name, counts]) => ({
      name,
      electrique: counts.electrique,
      musculaire: counts.musculaire,
      electriquePct: totalGeneral > 0 ? (counts.electrique / totalGeneral) * 100 : 0,
      musculairePct: totalGeneral > 0 ? (counts.musculaire / totalGeneral) * 100 : 0
    })).sort((a, b) => (b.electrique + b.musculaire) - (a.electrique + a.musculaire));
  }, [upwayBikes]);

  // Distribution des prix moyens par catégorie pour Upway
  const upwayCategoryPriceDist = useMemo(() => {
    if (!upwayBikes.length) return [];

    const categoryPriceElecMuscu = {};

    upwayBikes.forEach(b => {
      const cat = b["Catégorie"] || b.cargoCategory || "Non classé";
      const typeVelo = b["Type de vélo"] || (b.assistanceType ? "Electrique" : "Musculaire");
      const price = parseFloat((b.price || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      if (price <= 0) return;

      if (!categoryPriceElecMuscu[cat]) {
        categoryPriceElecMuscu[cat] = {
          electrique: { sum: 0, count: 0 },
          musculaire: { sum: 0, count: 0 }
        };
      }

      if (typeVelo === "Electrique") {
        categoryPriceElecMuscu[cat].electrique.sum += price;
        categoryPriceElecMuscu[cat].electrique.count += 1;
      } else if (typeVelo === "Musculaire") {
        categoryPriceElecMuscu[cat].musculaire.sum += price;
        categoryPriceElecMuscu[cat].musculaire.count += 1;
      }
    });

    return Object.entries(categoryPriceElecMuscu).map(([name, data]) => {
      const avgElec = data.electrique.count > 0 ? data.electrique.sum / data.electrique.count : 0;
      const avgMuscu = data.musculaire.count > 0 ? data.musculaire.sum / data.musculaire.count : 0;

      return {
        name,
        électrique: Math.round(avgElec),
        musculaire: Math.round(avgMuscu),
        electriqueCount: data.electrique.count,
        musculaireCount: data.musculaire.count
      };
    }).filter(item => item.électrique > 0 || item.musculaire > 0)
      .sort((a, b) => (b.électrique + b.musculaire) - (a.électrique + a.musculaire));
  }, [upwayBikes]);

  // Top 10 marques pour Upway
  const upwayBrandDist = useMemo(() => {
    if (!upwayBikes.length) return [];

    const brandCount = {};

    upwayBikes.forEach(b => {
      const brand = b.brand || b.vendor || "Inconnue";

      if (!brandCount[brand]) {
        brandCount[brand] = { electrique: 0, musculaire: 0 };
      }

      // Upway ne vend que de l'électrique
      brandCount[brand].electrique += 1;
    });

    return Object.entries(brandCount)
      .map(([name, counts]) => ({
        name,
        électrique: counts.electrique,
        musculaire: counts.musculaire,
        total: counts.electrique + counts.musculaire
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [upwayBikes]);

  // Calcul des durées moyennes par catégorie pour Mint et Upway
  const daysOnlineByCategoryComparison = useMemo(() => {
    // Pour Mint
    const mintByCategory = {};
    velos.forEach(v => {
      const publishedAt = v?.["Published At"];
      if (!publishedAt) return;
      const date = new Date(publishedAt);
      if (isNaN(date.getTime())) return;
      const age = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      const cat = v?.["Catégorie"] || "Non classé";

      if (!mintByCategory[cat]) {
        mintByCategory[cat] = { sum: 0, count: 0 };
      }
      mintByCategory[cat].sum += age;
      mintByCategory[cat].count += 1;
    });

    const mintData = Object.entries(mintByCategory)
      .map(([cat, data]) => ({
        category: cat,
        avgDays: data.count > 0 ? data.sum / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Pour Upway
    const upwayByCategory = {};
    upwayBikes.forEach(b => {
      const d = b.uploadedDate || b["uploadedDate"];
      if (!d) return;
      const date = new Date(d);
      if (isNaN(date.getTime())) return;
      const age = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      const cat = b["Catégorie"] || b.cargoCategory || "Non classé";

      if (!upwayByCategory[cat]) {
        upwayByCategory[cat] = { sum: 0, count: 0 };
      }
      upwayByCategory[cat].sum += age;
      upwayByCategory[cat].count += 1;
    });

    const upwayData = Object.entries(upwayByCategory)
      .map(([cat, data]) => ({
        category: cat,
        avgDays: data.count > 0 ? data.sum / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { mint: mintData, upway: upwayData };
  }, [velos, upwayBikes]);

  // =========================
  // 📊 Calculs simples directs
  // =========================
  const simpleData = useMemo(() => {
    // Helper pour compter les unités en stock d'un vélo
    const getStockUnits = (v) => {
      // Si c'est un vélo inventory, retourner 1
      if (v._isInventory) return 1;
      
      let total = 0;
      for (let i = 1; i <= 6; i++) {
        const stock = parseInt(v?.[`Stock variant ${i}`]) || 0;
        total += stock;
      }
      return total;
    };

    // Note : velos contient déjà les données filtrées selon stockMode via App.js
    // Count par catégorie (en unités)
    const categoryCount = {};
    velos.forEach(v => {
      const cat = v?.["Catégorie"] || "Non classé";
      const units = getStockUnits(v);
      categoryCount[cat] = (categoryCount[cat] || 0) + units;
    });
    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    // Count par catégorie avec séparation électrique/musculaire
    // Lire directement les colonnes Catégorie et Type de vélo depuis velos (combinedVelosForStats)
    const categoryElecMuscu = {};
    
    velos.forEach(v => {
      const cat = v?.["Catégorie"] || "Non classé";
      const typeVelo = v?.["Type de vélo"]; // "Électrique" ou "Musculaire"
      const units = getStockUnits(v);
      
      if (!categoryElecMuscu[cat]) {
        categoryElecMuscu[cat] = { electrique: 0, musculaire: 0 };
      }
      
      if (typeVelo === "Électrique") {
        categoryElecMuscu[cat].electrique += units;
      } else if (typeVelo === "Musculaire") {
        categoryElecMuscu[cat].musculaire += units;
      }
    });
    
    // Calculer le total général pour les pourcentages
    const totalGeneral = Object.values(categoryElecMuscu).reduce((sum, counts) => 
      sum + counts.electrique + counts.musculaire, 0
    );
    
    const categoryElecMuscuData = Object.entries(categoryElecMuscu).map(([name, counts]) => {
      return {
        name,
        electrique: counts.electrique,
        musculaire: counts.musculaire,
        electriquePct: totalGeneral > 0 ? (counts.electrique / totalGeneral) * 100 : 0,
        musculairePct: totalGeneral > 0 ? (counts.musculaire / totalGeneral) * 100 : 0
      };
    }).sort((a, b) => (b.electrique + b.musculaire) - (a.electrique + a.musculaire));

    // Prix moyen par catégorie avec séparation électrique/musculaire
    const categoryPriceElecMuscu = {};
    
    velos.forEach(v => {
      const cat = v?.["Catégorie"] || "Non classé";
      const typeVelo = v?.["Type de vélo"]; // "Électrique" ou "Musculaire"
      const units = getStockUnits(v);
      const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
      const price = parseFloat(priceStr) || 0;
      
      if (price <= 0 || units <= 0) return;
      
      if (!categoryPriceElecMuscu[cat]) {
        categoryPriceElecMuscu[cat] = { 
          electrique: { sum: 0, units: 0 }, 
          musculaire: { sum: 0, units: 0 } 
        };
      }
      
      if (typeVelo === "Électrique") {
        categoryPriceElecMuscu[cat].electrique.sum += price * units;
        categoryPriceElecMuscu[cat].electrique.units += units;
      } else if (typeVelo === "Musculaire") {
        categoryPriceElecMuscu[cat].musculaire.sum += price * units;
        categoryPriceElecMuscu[cat].musculaire.units += units;
      }
    });
    
    const categoryPriceElecMuscuData = Object.entries(categoryPriceElecMuscu).map(([name, data]) => {
      const avgElec = data.electrique.units > 0 ? data.electrique.sum / data.electrique.units : 0;
      const avgMuscu = data.musculaire.units > 0 ? data.musculaire.sum / data.musculaire.units : 0;
      
      return {
        name,
        électrique: Math.round(avgElec),
        musculaire: Math.round(avgMuscu)
      };
    }).filter(item => item.électrique > 0 || item.musculaire > 0)
      .sort((a, b) => (b.électrique + b.musculaire) - (a.électrique + a.musculaire));

    // Count par marque (en unités) avec distinction électrique/musculaire
    const brandCount = {};
    velos.forEach(v => {
      const brand = v?.["Marque"] || "Inconnue";
      const typeVelo = v?.["Type de vélo"];
      const units = getStockUnits(v);
      
      if (!brandCount[brand]) {
        brandCount[brand] = { electrique: 0, musculaire: 0 };
      }
      
      if (typeVelo === "Électrique") {
        brandCount[brand].electrique += units;
      } else if (typeVelo === "Musculaire") {
        brandCount[brand].musculaire += units;
      }
    });
    const brandData = Object.entries(brandCount)
      .map(([name, counts]) => ({
        name,
        électrique: counts.electrique,
        musculaire: counts.musculaire,
        total: counts.electrique + counts.musculaire
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Distribution des prix (en unités)
    const priceRanges = [
      { range: "0-500€", min: 0, max: 500, count: 0 },
      { range: "500-750€", min: 500, max: 750, count: 0 },
      { range: "750-1000€", min: 750, max: 1000, count: 0 },
      { range: "1000-1250€", min: 1000, max: 1250, count: 0 },
      { range: "1250-1500€", min: 1250, max: 1500, count: 0 },
      { range: "1500-1750€", min: 1500, max: 1750, count: 0 },
      { range: "1750-2000€", min: 1750, max: 2000, count: 0 },
      { range: "2000-2250€", min: 2000, max: 2250, count: 0 },
      { range: "2250-2500€", min: 2250, max: 2500, count: 0 },
      { range: "2500-2750€", min: 2500, max: 2750, count: 0 },
      { range: "2750-3000€", min: 2750, max: 3000, count: 0 },
      { range: "3000-3250€", min: 3000, max: 3250, count: 0 },
      { range: "3250-3500€", min: 3250, max: 3500, count: 0 },
      { range: "3500-3750€", min: 3500, max: 3750, count: 0 },
      { range: "3750-4000€", min: 3750, max: 4000, count: 0 },
      { range: "4000-4250€", min: 4000, max: 4250, count: 0 },
      { range: "4250-4500€", min: 4250, max: 4500, count: 0 },
      { range: "4500€+", min: 4500, max: Infinity, count: 0 },
    ];
    velos.forEach(v => {
      const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
      const price = parseFloat(priceStr) || 0;
      const units = getStockUnits(v);
      if (price > 0 && units > 0) {
        const bucket = priceRanges.find(r => price >= r.min && price < r.max);
        if (bucket) bucket.count += units;
      }
    });
    const priceData = priceRanges.filter(r => r.count > 0).map(r => ({ name: r.range, value: r.count }));

    // Type de vélo (en unités)
    const typeCount = {};
    velos.forEach(v => {
      const type = v?.["Type de vélo"] || "Inconnu";
      const units = getStockUnits(v);
      typeCount[type] = (typeCount[type] || 0) + units;
    });
    const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    // Durée de mise en ligne (en unités)
    const daysSince = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      const now = new Date();
      return Math.floor((now - date) / (1000 * 60 * 60 * 24));
    };

    const ageRanges = [
      { range: "0-7j", min: 0, max: 7, count: 0 },
      { range: "7-30j", min: 7, max: 30, count: 0 },
      { range: "30-60j", min: 30, max: 60, count: 0 },
      { range: "60-90j", min: 60, max: 90, count: 0 },
      { range: "90-120j", min: 90, max: 120, count: 0 },
      { range: "120-150j", min: 120, max: 150, count: 0 },
      { range: "150j+", min: 150, max: Infinity, count: 0 },
    ];
    velos.forEach(v => {
      const age = daysSince(v?.["Published At"]);
      const units = getStockUnits(v);
      if (age !== null && age >= 0 && units > 0) {
        const bucket = ageRanges.find(r => age >= r.min && age < r.max);
        if (bucket) bucket.count += units;
      }
    });
    const ageData = ageRanges.filter(r => r.count > 0).map(r => ({ name: r.range, value: r.count }));

    // Marge moyenne par marque (en unités avec tooltip)
    const brandMarginMap = {};
    velos.forEach(v => {
      const brand = v?.["Marque"] || "Inconnue";
      const units = getStockUnits(v);
      
      if (units > 0) {
        let buy = 0, parts = 0, logistics = 0, price = 0;
        
        if (v._isInventory && v._original) {
          // Vélos inventory
          const inv = v._original;
          buy = Number(inv.prix_achat_negocie) || 0;
          parts = Number(inv.frais_pieces_estimes) || 0;
          logistics = Number(inv.cout_logistique) || 0;
          price = Number(inv.prix_occasion_marche) || 0;
        } else {
          // Vélos en vente
          const url = v?.URL;
          const pricing = pricingByUrl?.[url];
          if (pricing) {
            buy = Number(pricing.negotiated_buy_price) || 0;
            parts = Number(pricing.parts_cost_actual) || 0;
            logistics = Number(pricing.logistics_cost) || 0;
            const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
            price = parseFloat(priceStr) || 0;
          }
        }
        
        // Marge = Prix de vente - Achat - Pièces - Logistique
        const margin = price - buy - parts - logistics;
        
        // Ignorer les marges aberrantes (vélos sans prix valide)
        if (price > 0) {
          if (!brandMarginMap[brand]) {
            brandMarginMap[brand] = { totalMargin: 0, totalUnits: 0 };
          }
          brandMarginMap[brand].totalMargin += margin * units;
          brandMarginMap[brand].totalUnits += units;
        }
      }
    });
    
    const brandMarginData = Object.entries(brandMarginMap)
      .map(([name, data]) => ({
        name,
        avgMargin: data.totalUnits > 0 ? data.totalMargin / data.totalUnits : 0,
        units: data.totalUnits
      }))
      .filter(item => item.units > 0)
      .sort((a, b) => b.avgMargin - a.avgMargin);

    // Distribution des marges (par tranches de 300€, incluant le négatif)
    const marginRanges = [
      { range: "-900€ et moins", min: -Infinity, max: -900, count: 0 },
      { range: "-900 à -600€", min: -900, max: -600, count: 0 },
      { range: "-600 à -300€", min: -600, max: -300, count: 0 },
      { range: "-300 à 0€", min: -300, max: 0, count: 0 },
      { range: "0 à 300€", min: 0, max: 300, count: 0 },
      { range: "300 à 600€", min: 300, max: 600, count: 0 },
      { range: "600 à 900€", min: 600, max: 900, count: 0 },
      { range: "900€ et plus", min: 900, max: Infinity, count: 0 },
    ];

    // Moyenne promo par catégorie (basé sur velosmint."Montant promo")
    const promoCategoryStats = {};
    velos.forEach(v => {
      const cat = v?.Catégorie || "Non classé";
      const promoAmt = getPromoAmount(v);
      const units = getStockUnits(v);
      if (promoAmt > 0) {
        if (!promoCategoryStats[cat]) {
          promoCategoryStats[cat] = { sum: 0, count: 0 };
        }
        promoCategoryStats[cat].sum += promoAmt * units;
        promoCategoryStats[cat].count += units;
      }
    });
    const promoCategoryData = Object.entries(promoCategoryStats)
      .map(([name, stats]) => ({ name, value: stats.sum / stats.count, units: stats.count }))
      .sort((a, b) => b.value - a.value);

    // Répartition des promos par montant (basé sur velosmint."Montant promo")
    const promoAmountMap = {};
    velos.forEach(v => {
      const promoAmt = getPromoAmount(v);
      const units = getStockUnits(v);
      if (promoAmt > 0) {
        const amtKey = `${promoAmt}€`;
        promoAmountMap[amtKey] = (promoAmountMap[amtKey] || 0) + units;
      }
    });
    const promoDistributionData = Object.entries(promoAmountMap)
      .map(([name, value]) => ({ name, value, sortKey: parseFloat(name) }))
      .sort((a, b) => a.sortKey - b.sortKey);
    
    velos.forEach(v => {
      const units = getStockUnits(v);
      
      if (units > 0) {
        let buy = 0, parts = 0, logistics = 0, price = 0;
        
        if (v._isInventory && v._original) {
          // Vélos inventory
          const inv = v._original;
          buy = Number(inv.prix_achat_negocie) || 0;
          parts = Number(inv.frais_pieces_estimes) || 0;
          logistics = Number(inv.cout_logistique) || 0;
          price = Number(inv.prix_occasion_marche) || 0;
        } else {
          // Vélos en vente
          const url = v?.URL;
          const pricing = pricingByUrl?.[url];
          if (pricing) {
            buy = Number(pricing.negotiated_buy_price) || 0;
            parts = Number(pricing.parts_cost_actual) || 0;
            logistics = Number(pricing.logistics_cost) || 0;
            const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
            price = parseFloat(priceStr) || 0;
          }
        }
        
        const margin = price - buy - parts - logistics;
        
        if (price > 0) {
          const bucket = marginRanges.find(r => margin >= r.min && margin < r.max);
          if (bucket) bucket.count += units;
        }
      }
    });
    
    const marginData = marginRanges.filter(r => r.count > 0).map(r => ({ name: r.range, value: r.count }));

    // Marge moyenne par tranche de date de publication
    const publicationRanges = [
      { range: "-21j", min: 0, max: 21, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
      { range: "22-42j", min: 22, max: 42, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
      { range: "43-63j", min: 43, max: 63, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
      { range: "64-84j", min: 64, max: 84, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
      { range: "85-105j", min: 85, max: 105, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
      { range: "106-126j", min: 106, max: 126, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
      { range: "126j+", min: 126, max: Infinity, totalMargin: 0, units: 0, sellValue: 0, totalBuyPrice: 0, totalParts: 0 },
    ];
    
    let totalUnitsForPublication = 0;
    velos.forEach(v => {
      const age = daysSince(v?.["Published At"]);
      const url = v?.URL;
      const pricing = pricingByUrl?.[url];
      const units = getStockUnits(v);
      
      if (age !== null && age >= 0 && pricing && units > 0) {
        const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
        const sellPrice = parseFloat(priceStr) || 0;
        const buyPrice = Number(pricing.negotiated_buy_price) || 0;
        const parts = Number(pricing.parts_cost_actual) || 0;
        const logistics = Number(pricing.logistics_cost) || 0;
        const margin = sellPrice - buyPrice - parts - logistics;
        
        if (sellPrice > 0) {
          const bucket = publicationRanges.find(r => age >= r.min && age < r.max);
          if (bucket) {
            bucket.totalMargin += margin * units;
            bucket.units += units;
            bucket.sellValue += sellPrice * units;
            bucket.totalBuyPrice += buyPrice * units;
            bucket.totalParts += parts * units;
            totalUnitsForPublication += units;
          }
        }
      }
    });
    
    const publicationMarginData = publicationRanges
      .filter(r => r.units > 0)
      .map(r => ({
        name: r.range,
        avgMargin: r.totalMargin / r.units,
        units: r.units,
        percentage: totalUnitsForPublication > 0 ? ((r.units / totalUnitsForPublication) * 100).toFixed(1) : 0,
        sellValue: r.sellValue,
        avgBuyPrice: r.units > 0 ? r.totalBuyPrice / r.units : 0,
        avgParts: r.units > 0 ? r.totalParts / r.units : 0
      }));

    return { 
      categoryData, 
      categoryElecMuscuData,
      categoryPriceElecMuscuData,
      brandData, 
      priceData, 
      typeData, 
      ageData, 
      brandMarginData, 
      marginData, 
      promoCategoryData, 
      promoDistributionData,
      publicationMarginData
    };
  }, [velos, pricingByUrl]);

  // Calculs pour KPI Achat basés sur inventory
  const achatData = useMemo(() => {
    if (!inventoryData.length) {
      return { 
        purchasesByMonth: [], 
        marginByMonth: [], 
        availableMonths: [],
        monthlyKPIs: {},
        marginByCategory: []
      };
    }

    // Liste des mois disponibles
    const monthsSet = new Set();
    inventoryData.forEach(item => {
      if (item.date_achat) {
        const date = new Date(item.date_achat);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(monthKey);
      }
    });
    const availableMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

    // Nombre d'achats par mois
    const monthlyPurchases = {};
    inventoryData.forEach(item => {
      if (!item.date_achat) return;
      const date = new Date(item.date_achat);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyPurchases[monthKey] = (monthlyPurchases[monthKey] || 0) + 1;
    });

    const purchasesByMonth = Object.entries(monthlyPurchases)
      .map(([month, count]) => ({ name: month, value: count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Calculer les marges par mois
    const monthlyMargins = {};
    
    inventoryData.forEach(item => {
      if (!item.date_achat || !item.url) return;
      
      const date = new Date(item.date_achat);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const matchingVelo = velos.find(v => v?.URL === item.url);

      if (matchingVelo) {
        const pricing = pricingByUrl?.[item.url];
        
        const stockQty = Number(matchingVelo?.["Total Inventory Qty"]) || 1;
        
        const priceStr = String(matchingVelo?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
        const sellPrice = parseFloat(priceStr) || 0;
        
        const buyPrice = Number(item.prix_achat_negocie) || 0;
        const parts = Number(pricing?.parts_cost_actual) || 0;
        const logistics = Number(pricing?.logistics_cost) || 0;
        
        const unitMargin = sellPrice - buyPrice - parts - logistics;
        const totalMargin = unitMargin * stockQty;
        
        if (!monthlyMargins[monthKey]) {
          monthlyMargins[monthKey] = { totalMargin: 0, count: 0 };
        }
        monthlyMargins[monthKey].totalMargin += totalMargin;
        monthlyMargins[monthKey].count += stockQty;
      }
    });

    // KPIs par mois
    const monthlyKPIs = {};
    availableMonths.forEach(monthKey => {
      const monthItems = inventoryData.filter(item => {
        if (!item.date_achat) return false;
        const date = new Date(item.date_achat);
        const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return itemMonth === monthKey;
      });

      const totalAchats = monthItems.length;
      const valeurAchats = monthItems.reduce((sum, i) => sum + (Number(i.prix_achat_negocie) || 0), 0);
      const prixMoyenAchat = totalAchats > 0 ? valeurAchats / totalAchats : 0;
      
      const marginData = monthlyMargins[monthKey];
      const margeMoyenne = marginData && marginData.count > 0 ? marginData.totalMargin / marginData.count : 0;

      monthlyKPIs[monthKey] = { totalAchats, valeurAchats, prixMoyenAchat, margeMoyenne };
    });

    // Marge par mois (basée sur purchase_date de pricingByUrl ou date_achat inventory)
    const monthlyMarginsFromStock = {};
    velos.forEach(v => {
      let purchaseDate = null;
      let sellPrice = 0, buyPrice = 0, parts = 0, logistics = 0;
      
      if (v._isInventory && v._original) {
        // Vélos inventory
        const inv = v._original;
        if (inv.date_achat) {
          purchaseDate = new Date(inv.date_achat);
          sellPrice = Number(inv.prix_occasion_marche) || 0;
          buyPrice = Number(inv.prix_achat_negocie) || 0;
          parts = Number(inv.frais_pieces_estimes) || 0;
          logistics = Number(inv.cout_logistique) || 0;
        }
      } else {
        // Vélos en vente
        const url = v?.URL;
        const pricing = pricingByUrl?.[url];
        if (pricing && pricing.purchase_date) {
          purchaseDate = new Date(pricing.purchase_date);
          const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
          sellPrice = parseFloat(priceStr) || 0;
          buyPrice = Number(pricing?.negotiated_buy_price) || 0;
          parts = Number(pricing?.parts_cost_actual) || 0;
          logistics = Number(pricing?.logistics_cost) || 0;
        }
      }
      
      if (!purchaseDate) return;
      
      const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
      const margin = sellPrice - buyPrice - parts - logistics;
      
      if (!monthlyMarginsFromStock[monthKey]) {
        monthlyMarginsFromStock[monthKey] = { totalMargin: 0, count: 0 };
      }
      
      monthlyMarginsFromStock[monthKey].totalMargin += margin;
      monthlyMarginsFromStock[monthKey].count += 1;
    });
    
    const marginByMonth = Object.entries(monthlyMarginsFromStock)
      .map(([month, stats]) => ({ 
        name: month, 
        value: stats.count > 0 ? stats.totalMargin / stats.count : 0,
        count: stats.count 
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // NOUVEAU: Marge moyenne par catégorie (en utilisant pricingByUrl ou inventory)
    const categoryStats = {};
    velos.forEach(v => {
      const category = v?.["Catégorie"] || "Autres";
      const bikeType = v?.["Type de vélo"] || "Musculaire"; // "Électrique" ou "Musculaire"
      
      let sellPrice = 0, buyPrice = 0, parts = 0, logistics = 0;
      let hasData = false;
      
      if (v._isInventory && v._original) {
        // Vélos inventory
        const inv = v._original;
        sellPrice = Number(inv.prix_occasion_marche) || 0;
        buyPrice = Number(inv.prix_achat_negocie) || 0;
        parts = Number(inv.frais_pieces_estimes) || 0;
        logistics = Number(inv.cout_logistique) || 0;
        hasData = true;
      } else {
        // Vélos en vente
        const url = v?.URL;
        const pricing = pricingByUrl?.[url];
        if (pricing && pricing.purchase_date) {
          const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
          sellPrice = parseFloat(priceStr) || 0;
          buyPrice = Number(pricing?.negotiated_buy_price) || 0;
          parts = Number(pricing?.parts_cost_actual) || 0;
          logistics = Number(pricing?.logistics_cost) || 0;
          hasData = true;
        }
      }
      
      if (!hasData) return;
      
      const margin = sellPrice - buyPrice - parts - logistics;
      
      if (!categoryStats[category]) {
        categoryStats[category] = { 
          electric: { totalMargin: 0, totalSellPrice: 0, count: 0 },
          muscle: { totalMargin: 0, totalSellPrice: 0, count: 0 }
        };
      }
      
      if (bikeType === "Électrique") {
        categoryStats[category].electric.totalMargin += margin;
        categoryStats[category].electric.totalSellPrice += sellPrice;
        categoryStats[category].electric.count += 1;
      } else {
        categoryStats[category].muscle.totalMargin += margin;
        categoryStats[category].muscle.totalSellPrice += sellPrice;
        categoryStats[category].muscle.count += 1;
      }
    });
    
    const marginByCategory = Object.entries(categoryStats)
      .map(([cat, stats]) => ({
        name: cat,
        electrique: stats.electric.count > 0 ? stats.electric.totalMargin / stats.electric.count : 0,
        musculaire: stats.muscle.count > 0 ? stats.muscle.totalMargin / stats.muscle.count : 0,
        electriquePct: stats.electric.totalSellPrice > 0 ? (stats.electric.totalMargin / stats.electric.totalSellPrice) * 100 : 0,
        musculairePct: stats.muscle.totalSellPrice > 0 ? (stats.muscle.totalMargin / stats.muscle.totalSellPrice) * 100 : 0
      }))
      .sort((a, b) => (b.electrique + b.musculaire) - (a.electrique + a.musculaire));

    // Marge moyenne par acheteur (buyer)
    const sellerStats = {};
    velos.forEach(v => {
      const url = v?.URL;
      const pricing = pricingByUrl?.[url];
      
      if (!pricing || !pricing.buyer) return;
      
      const seller = pricing.buyer;
      const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
      const sellPrice = parseFloat(priceStr) || 0;
      const buyPrice = Number(pricing?.negotiated_buy_price) || 0;
      const parts = Number(pricing?.parts_cost_actual) || 0;
      const logistics = Number(pricing?.logistics_cost) || 0;
      const margin = sellPrice - buyPrice - parts - logistics;
      
      if (!sellerStats[seller]) {
        sellerStats[seller] = { totalMargin: 0, count: 0 };
      }
      
      sellerStats[seller].totalMargin += margin;
      sellerStats[seller].count += 1;
    });
    
    const marginBySeller = Object.entries(sellerStats)
      .map(([seller, stats]) => ({
        name: seller,
        value: stats.count > 0 ? stats.totalMargin / stats.count : 0,
        count: stats.count
      }))
      .sort((a, b) => b.value - a.value);

    return { purchasesByMonth, marginByMonth, availableMonths, monthlyKPIs, marginByCategory, marginBySeller };
  }, [inventoryData, velos, pricingByUrl]);

  // Calcul des données pour le waterfall
  const waterfallData = useMemo(() => {
    let totalBuyPrice = 0;
    let totalParts = 0;
    let totalLogistics = 0;
    let totalSellPrice = 0;
    let count = 0;

    velos.forEach(v => {
      // Appliquer les filtres
      const typeVelo = v?.["Type de vélo"];
      const categorie = v?.["Catégorie"] || "Non classé";
      
      if (waterfallTypeFilter !== "tous" && typeVelo !== waterfallTypeFilter) return;
      if (waterfallCategoryFilter !== "tous" && categorie !== waterfallCategoryFilter) return;
      
      const url = v?.URL;
      let buyPrice = 0;
      let parts = 0;
      let logistics = 0;
      let sellPrice = 0;
      let units = 1;

      if (v._isInventory && v._original) {
        // Vélos inventory
        const inv = v._original;
        buyPrice = Number(inv.prix_achat_negocie) || 0;
        parts = Number(inv.frais_pieces_estimes) || 0;
        logistics = Number(inv.cout_logistique) || 0;
        sellPrice = Number(inv.prix_occasion_marche) || 0;
        units = 1;
      } else {
        // Vélos en vente
        const pricing = pricingByUrl?.[url];
        if (pricing) {
          buyPrice = Number(pricing.negotiated_buy_price) || 0;
          parts = Number(pricing.parts_cost_actual) || 0;
          logistics = Number(pricing.logistics_cost) || 0;
          const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
          sellPrice = parseFloat(priceStr) || 0;
          
          // Compter les unités
          units = 0;
          for (let i = 1; i <= 6; i++) {
            const stock = parseInt(v?.[`Stock variant ${i}`]) || 0;
            units += stock;
          }
        }
      }

      if (sellPrice > 0 && units > 0) {
        totalBuyPrice += buyPrice * units;
        totalParts += parts * units;
        totalLogistics += logistics * units;
        totalSellPrice += sellPrice * units;
        count += units;
      }
    });

    if (count === 0) return { chart: [], totals: {} };

    const avgBuy = totalBuyPrice / count;
    const avgParts = totalParts / count;
    const avgLogistics = totalLogistics / count;
    const avgSell = totalSellPrice / count;
    const avgMargin = avgSell - avgBuy - avgParts - avgLogistics;
    const totalMargin = totalSellPrice - totalBuyPrice - totalParts - totalLogistics;

    // Construction des données waterfall avec moyennes et totaux
    return {
      chart: [
        { name: "Prix d'achat", value: avgBuy, start: 0, end: avgBuy, color: "#f59e0b" },
        { name: "Pièces", value: avgParts, start: avgBuy, end: avgBuy + avgParts, color: "#db2777" },
        { name: "Transport", value: avgLogistics, start: avgBuy + avgParts, end: avgBuy + avgParts + avgLogistics, color: "#7c3aed" },
        { name: "Marge", value: avgMargin, start: avgBuy + avgParts + avgLogistics, end: avgSell, color: "#16a34a" },
        { name: "Prix de vente", value: avgSell, start: 0, end: avgSell, color: "#0d9488", isTotal: true }
      ],
      totals: {
        totalSellPrice,
        totalBuyPrice,
        totalParts,
        totalLogistics,
        totalMargin,
        avgSell,
        avgBuy,
        avgParts,
        avgLogistics,
        avgMargin
      }
    };
  }, [velos, pricingByUrl, waterfallTypeFilter, waterfallCategoryFilter]);

  // Récupérer les catégories et types disponibles pour les filtres waterfall
  const availableCategories = useMemo(() => {
    const cats = new Set();
    velos.forEach(v => {
      const cat = v?.["Catégorie"] || "Non classé";
      cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [velos]);

  const availableTypes = useMemo(() => {
    const types = new Set();
    velos.forEach(v => {
      const type = v?.["Type de vélo"];
      if (type) types.add(type);
    });
    return Array.from(types).sort();
  }, [velos]);

  if (!isOpen) return null;

  // =========================
  // 🎨 Styles & couleurs
  // =========================
  const COLORS = {
    primary: "#2563eb",
    good: "#16a34a",
    warn: "#f59e0b",
    bad: "#dc2626",
    gray: "#6b7280",
    purple: "#7c3aed",
    teal: "#0d9488",
    pink: "#db2777",
    mint: "#10b981",
    blue: "#3b82f6",
  };

  const cardStyle = {
    padding: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const sectionHeaderStyle = {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 16,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const kpiCardStyle = {
    padding: 12,
    borderRadius: 8,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  };

  const chartContainerStyle = {
    padding: 16,
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #e5e7eb",
  };

  const noDataStyle = {
    opacity: 0.6,
    fontSize: 13,
    textAlign: "center",
    padding: 40,
  };

  const fmtEur = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);
  };

  // Safe data
  const kpi = statsData?.kpi || {};
  const totalUnits = kpi.totalUnits || 0;
  const stockValueEur = statsData?.stockValueEur || 0;
  const stockValueBuyEur = statsData?.stockValueBuyEur || 0;
  const avgBenefitPerUnit = statsData?.avgBenefitPerUnit || 0;

  // Pie palette
  const piePalette = [COLORS.primary, COLORS.teal, COLORS.purple, COLORS.warn, COLORS.pink, COLORS.gray];

  // Custom tooltip for pies
  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{data.name}</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          {data.value} unités ({data.payload.__pct || "0%"})
        </div>
      </div>
    );
  };

  // Attach percentage to pie data
  const attachPiePct = (arr, key) => {
    const total = (arr || []).reduce((s, x) => s + (Number(x?.[key]) || 0), 0);
    return (arr || []).map((x) => ({
      ...x,
      __pct: total > 0 ? `${Math.round((x[key] / total) * 100)}%` : "0%",
    }));
  };

  // Utiliser les données simples calculées
  const locationPie = attachPiePct(statsData?.locationPie || [], "units");
  const elecMuscu = attachPiePct(simpleData.typeData || [], "value");

  // Données additionnelles pour graphiques - SIMPLIFIÉES
  const listingAgeDist = simpleData.ageData || [];
  const priceHisto = simpleData.priceData || [];
  const benefitHisto = simpleData.marginData || [];
  const mixTypology = simpleData.categoryData || [];
  const scatterData = statsData?.scatterBenefitAge || [];
  const brandData = simpleData.brandData || [];

  // Helper pour ajouter __pctLabel aux bar charts
  const withPctLabel = (arr, key = "value") => {
    const total = (arr || []).reduce((s, x) => s + (Number(x?.[key]) || 0), 0);
    return (arr || []).map((x) => ({
      ...x,
      __pctLabel: total > 0 ? `${Math.round((x[key] / total) * 100)}%` : "0%",
    }));
  };

  // Custom tooltip for bar charts
  const CustomBarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{data.payload.label}</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          {data.value} unités ({data.payload.__pctLabel || "0%"})
        </div>
      </div>
    );
  };

  // Label pour les barres (affiche %)
  const BarLabelContent = (props) => {
    const { x, y, width, height, payload } = props;
    const pct = payload?.__pctLabel;
    if (!pct) return null;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#111827"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={700}
      >
        {pct}
      </text>
    );
  };

  // Couleur dynamique pour barres
  const makeDynamicFill = (baseColor) => {
    const hexToRgb = (hex) => {
      const h = String(hex || "").replace("#", "").trim();
      const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
      const r = parseInt(full.substr(0, 2), 16) || 0;
      const g = parseInt(full.substr(2, 2), 16) || 0;
      const b = parseInt(full.substr(4, 2), 16) || 0;
      return { r, g, b };
    };
    
    const { r, g, b } = hexToRgb(baseColor);
    return (data, index) => {
      const totalBars = data.length;
      const step = index / Math.max(totalBars - 1, 1);
      const factor = 1 - step * 0.4;
      const rr = Math.round(r * factor);
      const gg = Math.round(g * factor);
      const bb = Math.round(b * factor);
      return `rgb(${rr}, ${gg}, ${bb})`;
    };
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1400px, 98vw)",
          maxHeight: "95vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>📊 Tableau de Bord KPI</h2>
            <div style={{ opacity: 0.7, marginTop: 6, fontSize: 14 }}>
              {filteredVelosCount} fiches · {totalUnits} unités en stock
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {/* ===== MODE SELECTOR ===== */}
          <div style={{ marginBottom: 24, background: "#f9fafb", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, opacity: 0.7 }}>
              Mode d'affichage des KPI
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => setStockMode("vente")}
                style={{
                  flex: "1 1 auto",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: stockMode === "vente" ? "2px solid #2ca76a" : "1px solid #d1d5db",
                  background: stockMode === "vente" ? "#d1fae5" : "#fff",
                  cursor: "pointer",
                  fontWeight: stockMode === "vente" ? 700 : 500,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                🛒 Vélos en vente
              </button>
              <button
                onClick={() => setStockMode("inventory")}
                style={{
                  flex: "1 1 auto",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: stockMode === "inventory" ? "2px solid #2ca76a" : "1px solid #d1d5db",
                  background: stockMode === "inventory" ? "#d1fae5" : "#fff",
                  cursor: "pointer",
                  fontWeight: stockMode === "inventory" ? 700 : 500,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                📦 Vélos achetés non MEL
              </button>
              <button
                onClick={() => setStockMode("tous")}
                style={{
                  flex: "1 1 auto",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: stockMode === "tous" ? "2px solid #2ca76a" : "1px solid #d1d5db",
                  background: stockMode === "tous" ? "#d1fae5" : "#fff",
                  cursor: "pointer",
                  fontWeight: stockMode === "tous" ? 700 : 500,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                🔄 TOUS (vente + achetés)
              </button>
            </div>
          </div>

          {/* ===== KPI STOCK ===== */}
          <div style={{ marginBottom: 32 }}>
            <div style={sectionHeaderStyle}>
              <span>📦</span>
              <span>KPI Stock</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div
                style={{...kpiCardStyle, cursor: 'help', position: 'relative'}}
                onMouseEnter={() => setHoveredKPI('units')}
                onMouseLeave={() => setHoveredKPI(null)}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Unités en stock</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.primary }}>{totalUnits}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{kpi.nRows || 0} fiches</div>
                {hoveredKPI === 'units' && upwayKPIs && (
                  <div style={{
                    position: 'absolute',
                    top: '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}>
                    <div style={{ marginBottom: 4, fontSize: 11, opacity: 0.9 }}>📊 Upway (concurrent)</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{upwayKPIs.total} vélos en ligne</div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #14b8a6',
                    }} />
                  </div>
                )}
              </div>

              <div
                style={{...kpiCardStyle, cursor: 'help', position: 'relative'}}
                onMouseEnter={() => setHoveredKPI('value')}
                onMouseLeave={() => setHoveredKPI(null)}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Valeur stock (prix vente)</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.teal }}>{fmtEur(stockValueEur)}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>prix réduit × unités</div>
                {hoveredKPI === 'value' && upwayKPIs && (
                  <div style={{
                    position: 'absolute',
                    top: '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}>
                    <div style={{ marginBottom: 4, fontSize: 11, opacity: 0.9 }}>📊 Upway (concurrent)</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtEur(upwayKPIs.totalValue)} valeur totale</div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #14b8a6',
                    }} />
                  </div>
                )}
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Valeur stock (prix achat)</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.orange }}>{fmtEur(stockValueBuyEur)}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>prix achat × unités</div>
              </div>

              {stockMode === "vente" && (
                <div
                  style={{...kpiCardStyle, cursor: 'help', position: 'relative'}}
                  onMouseEnter={() => setHoveredKPI('days')}
                  onMouseLeave={() => setHoveredKPI(null)}
                >
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Durée moy. en ligne</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.purple }}>
                    {statsData?.avgListingDays ? `${Math.round(statsData.avgListingDays)}j` : "—"}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>pondéré par unités</div>
                  {hoveredKPI === 'days' && upwayKPIs && (
                    <div style={{
                      position: 'absolute',
                      top: '-260px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      color: '#1f2937',
                      padding: '16px',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      zIndex: 1000,
                      minWidth: '320px',
                      fontSize: '13px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {/* Mint */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                          🟢 Mint: {statsData?.avgListingDays ? Math.round(statsData.avgListingDays) : '—'}j (moyenne)
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginLeft: 16 }}>
                          {daysOnlineByCategoryComparison.mint.length > 0 ? (
                            daysOnlineByCategoryComparison.mint.map(item => (
                              <div key={item.category} style={{ marginBottom: 2 }}>
                                • {item.category}: {Math.round(item.avgDays)}j ({item.count} vélos)
                              </div>
                            ))
                          ) : (
                            <div>Pas de données</div>
                          )}
                        </div>
                      </div>

                      {/* Upway */}
                      <div>
                        <div style={{ color: '#2563eb', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                          🔵 Upway: {Math.round(upwayKPIs.avgDaysOnline)}j (moyenne)
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginLeft: 16 }}>
                          {daysOnlineByCategoryComparison.upway.length > 0 ? (
                            daysOnlineByCategoryComparison.upway.map(item => (
                              <div key={item.category} style={{ marginBottom: 2 }}>
                                • {item.category}: {Math.round(item.avgDays)}j ({item.count} vélos)
                              </div>
                            ))
                          ) : (
                            <div>Pas de données</div>
                          )}
                        </div>
                      </div>

                      <div style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid white',
                      }} />
                    </div>
                  )}
                </div>
              )}

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Taux de marge moyen</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.green }}>
                  {(() => {
                    // Calculer le taux de marge pondéré par unités pour tous les modes
                    let totalMarginWeighted = 0;
                    let totalSellValueWeighted = 0;
                    
                    velos.forEach(v => {
                      if (v._isInventory && v._original) {
                        // Vélos inventory
                        const inv = v._original;
                        const prixVente = Number(inv.prix_occasion_marche) || 0;
                        const prixAchat = Number(inv.prix_achat_negocie) || 0;
                        const pieces = Number(inv.frais_pieces_estimes) || 0;
                        const logistique = Number(inv.cout_logistique) || 0;
                        
                        if (prixVente > 0) {
                          const margin = prixVente - prixAchat - pieces - logistique;
                          totalMarginWeighted += margin; // 1 unité par vélo inventory
                          totalSellValueWeighted += prixVente;
                        }
                      } else {
                        // Vélos en vente
                        const url = v?.URL;
                        const pricing = pricingByUrl?.[url];
                        if (pricing) {
                          const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
                          const sellPrice = parseFloat(priceStr) || 0;
                          const buyPrice = Number(pricing.negotiated_buy_price) || 0;
                          const parts = Number(pricing.parts_cost_actual) || 0;
                          const logistics = Number(pricing.logistics_cost) || 0;
                          const units = (() => {
                            let total = 0;
                            for (let i = 1; i <= 6; i++) {
                              const stock = parseInt(v?.[`Stock variant ${i}`]) || 0;
                              total += stock;
                            }
                            return total;
                          })();
                          
                          if (sellPrice > 0 && units > 0) {
                            const margin = sellPrice - buyPrice - parts - logistics;
                            totalMarginWeighted += margin * units;
                            totalSellValueWeighted += sellPrice * units;
                          }
                        }
                      }
                    });
                    
                    const avgMarginRate = totalSellValueWeighted > 0 ? (totalMarginWeighted / totalSellValueWeighted) * 100 : 0;
                    return avgMarginRate > 0 ? `${Math.round(avgMarginRate)}%` : "—";
                  })()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>pondéré par unités</div>
              </div>
            </div>

            {/* Composition du prix - Tableau et Waterfall combinés */}
            <div style={{ ...cardStyle, marginTop: 20 }}>
              {/* Header avec titre et filtres */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  💰 Décomposition du prix
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={waterfallTypeFilter}
                    onChange={(e) => setWaterfallTypeFilter(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 11,
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <option value="tous">Tous types</option>
                    {availableTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={waterfallCategoryFilter}
                    onChange={(e) => setWaterfallCategoryFilter(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 11,
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <option value="tous">Toutes catégories</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {(waterfallTypeFilter !== "tous" || waterfallCategoryFilter !== "tous") && (
                    <button
                      onClick={() => {
                        setWaterfallTypeFilter("tous");
                        setWaterfallCategoryFilter("tous");
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#6b7280"
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Contenu : Tableau et Graphique côte à côte */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {/* Tableau de décomposition */}
                <div>
                {waterfallData.chart?.length > 0 ? (
                  <div style={{ fontSize: 13, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #d1d5db" }}>
                          <th style={{ padding: "8px 8px", textAlign: "left", fontSize: 11, fontWeight: 600, opacity: 0.7 }}></th>
                          <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 11, fontWeight: 600, opacity: 0.7 }}>Prix moyen</th>
                          <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 11, fontWeight: 600, opacity: 0.7 }}>Total</th>
                          <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 11, fontWeight: 600, opacity: 0.7 }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                          <td style={{ padding: "12px 8px", fontWeight: 700, fontSize: 14 }}>Prix de vente</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                            {fmtEur(waterfallData.totals.avgSell)}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                            {fmtEur(waterfallData.totals.totalSellPrice)}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                            100%
                          </td>
                        </tr>
                        <tr style={{ background: "#fef3c7", borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "8px 8px 8px 20px", color: "#92400e" }}>Prix d'achat</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#92400e" }}>
                            - {fmtEur(waterfallData.totals.avgBuy)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#92400e" }}>
                            - {fmtEur(waterfallData.totals.totalBuyPrice)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#92400e", fontSize: 12 }}>
                            {waterfallData.totals.totalSellPrice > 0 ? `${((waterfallData.totals.totalBuyPrice / waterfallData.totals.totalSellPrice) * 100).toFixed(1)}%` : "0%"}
                          </td>
                        </tr>
                        <tr style={{ background: "#fce7f3", borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "8px 8px 8px 20px", color: "#831843" }}>Frais pièces</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#831843" }}>
                            - {fmtEur(waterfallData.totals.avgParts)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#831843" }}>
                            - {fmtEur(waterfallData.totals.totalParts)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#831843", fontSize: 12 }}>
                            {waterfallData.totals.totalSellPrice > 0 ? `${((waterfallData.totals.totalParts / waterfallData.totals.totalSellPrice) * 100).toFixed(1)}%` : "0%"}
                          </td>
                        </tr>
                        <tr style={{ background: "#f3e8ff", borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "8px 8px 8px 20px", color: "#581c87" }}>Transport</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#581c87" }}>
                            - {fmtEur(waterfallData.totals.avgLogistics)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#581c87" }}>
                            - {fmtEur(waterfallData.totals.totalLogistics)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#581c87", fontSize: 12 }}>
                            {waterfallData.totals.totalSellPrice > 0 ? `${((waterfallData.totals.totalLogistics / waterfallData.totals.totalSellPrice) * 100).toFixed(1)}%` : "0%"}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "2px solid #d1d5db" }}>
                          <td style={{ padding: "8px 8px 8px 20px", opacity: 0.6, fontSize: 12 }}>Total coûts</td>
                          <td style={{ padding: "8px", textAlign: "right", opacity: 0.6, fontSize: 12 }}>
                            - {fmtEur(waterfallData.totals.avgBuy + waterfallData.totals.avgParts + waterfallData.totals.avgLogistics)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", opacity: 0.6, fontSize: 12 }}>
                            - {fmtEur(waterfallData.totals.totalBuyPrice + waterfallData.totals.totalParts + waterfallData.totals.totalLogistics)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", opacity: 0.6, fontSize: 12 }}>
                            {waterfallData.totals.totalSellPrice > 0 ? `${(((waterfallData.totals.totalBuyPrice + waterfallData.totals.totalParts + waterfallData.totals.totalLogistics) / waterfallData.totals.totalSellPrice) * 100).toFixed(1)}%` : "0%"}
                          </td>
                        </tr>
                        <tr style={{ background: "#d1fae5", borderBottom: "2px solid #10b981" }}>
                          <td style={{ padding: "12px 8px", fontWeight: 700, color: "#065f46" }}>Marge</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, color: "#065f46" }}>
                            {fmtEur(waterfallData.totals.avgMargin)}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, color: "#065f46" }}>
                            {fmtEur(waterfallData.totals.totalMargin)}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, color: "#065f46" }}>
                            {waterfallData.totals.totalSellPrice > 0 ? `${((waterfallData.totals.totalMargin / waterfallData.totals.totalSellPrice) * 100).toFixed(1)}%` : "0%"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
                </div>

                {/* Graphique Waterfall */}
                <div>
                {waterfallData.chart?.length > 0 ? (
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={waterfallData.chart} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11 }}
                          angle={-15}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tickFormatter={(v) => `${Math.round(v)}€`}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const item = props.payload;
                            if (item.isTotal) {
                              return [`${Math.round(value)}€`, "Total"];
                            }
                            return [`${Math.round(value)}€`, name];
                          }}
                          labelFormatter={(label) => label}
                        />
                        <Bar dataKey="start" stackId="a" fill="transparent" />
                        <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                          {waterfallData.chart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <LabelList 
                            dataKey="value" 
                            position="top"
                            formatter={(value) => `${Math.round(value)}€`}
                            style={{ fontSize: 10, fontWeight: 700, fill: "#111827" }}
                          />
                        </Bar>
                        <Line 
                          type="stepAfter" 
                          dataKey="end" 
                          stroke="#6b7280" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
                </div>
              </div>
            </div>

            {/* Graphiques Stock */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 16 }}>
              {/* Répartition Fleeta vs Mint */}
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Répartition du stock</div>
                {locationPie.length > 0 ? (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Pie
                            data={locationPie}
                            dataKey="units"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            label={(entry) => entry.__pct}
                          >
                            {locationPie.map((_, idx) => (
                              <Cell key={`loc-${idx}`} fill={piePalette[idx % piePalette.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, marginTop: 8 }}>
                      {locationPie.map((x, idx) => (
                        <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: piePalette[idx % piePalette.length],
                          }} />
                          <span>{x.name}: <b>{x.units}</b></span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée disponible</div>
                )}
              </div>

              {/* Électrique vs Musculaire */}
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Électrique vs Musculaire</div>
                {elecMuscu.length > 0 ? (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Pie
                            data={elecMuscu}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            label={(entry) => entry.__pct}
                          >
                            {elecMuscu.map((entry, idx) => (
                              <Cell key={`elec-${idx}`} fill={entry.name === "Électrique" ? COLORS.teal : COLORS.purple} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, marginTop: 8 }}>
                      {elecMuscu.map((x, idx) => (
                        <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: x.name === "Électrique" ? COLORS.teal : COLORS.purple,
                          }} />
                          <span>{x.name}: <b>{x.value}</b></span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée disponible</div>
                )}
              </div>

              {/* Top 10 Marques */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{showUpwayBrandComparison ? 'Top 10 Marques Upway' : 'Top 10 Marques (Électrique vs Musculaire)'}</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showUpwayBrandComparison}
                      onChange={(e) => setShowUpwayBrandComparison(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>Voir Upway</span>
                  </label>
                </div>
                {brandData.length > 0 ? (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      {!showUpwayBrandComparison ? (
                        <BarChart data={brandData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              padding: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>{data.name}</div>
                              <div style={{ fontSize: 13, color: "#0d9488" }}>⚡ Électrique: {data.électrique}</div>
                              <div style={{ fontSize: 13, color: "#7c3aed" }}>🚴 Musculaire: {data.musculaire}</div>
                              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Total: {data.total}</div>
                            </div>
                          );
                        }} />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="électrique" stackId="a" fill={COLORS.teal} radius={[0, 0, 0, 0]} name="Électrique" />
                        <Bar dataKey="musculaire" stackId="a" fill={COLORS.purple} radius={[0, 6, 6, 0]} name="Musculaire"
                          label={({ x, y, width, height, payload }) => {
                            if (!payload) return null;
                            const total = payload.total || 0;
                            return (
                              <text
                                x={x + width + 5}
                                y={y + height / 2}
                                fill="#374151"
                                fontSize={11}
                                textAnchor="start"
                                dominantBaseline="middle"
                              >
                                {total}
                              </text>
                            );
                          }}
                        />
                      </BarChart>
                      ) : (
                        <BarChart data={upwayBrandDist} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value) => `${value} vélos`}
                          />
                          <Bar dataKey="électrique" fill="#2563eb" radius={[0, 6, 6, 0]} name="Électrique">
                            <LabelList
                              dataKey="électrique"
                              position="right"
                              formatter={(value) => value > 0 ? value : ''}
                              style={{ fontSize: 10, fontWeight: 600, fill: '#2563eb' }}
                            />
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée marque</div>
                )}
              </div>

              {/* Par Catégorie */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Quantité par catégorie (Électrique vs Musculaire)</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showUpwayCategoryComparison}
                      onChange={(e) => setShowUpwayCategoryComparison(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#0d9488', fontWeight: 600 }}>Comparer avec Upway</span>
                  </label>
                </div>
                {simpleData.categoryElecMuscuData?.length > 0 ? (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      {!showUpwayCategoryComparison ? (
                        <BarChart data={simpleData.categoryElecMuscuData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value, name) => `${value} unités`}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="electrique" fill={COLORS.teal} radius={[0, 6, 6, 0]} name="Électrique">
                            <LabelList
                              dataKey="electriquePct"
                              position="right"
                              formatter={(value) => value > 0 ? `${value.toFixed(0)}%` : ''}
                              style={{ fontSize: 10, fontWeight: 600, fill: COLORS.teal }}
                            />
                          </Bar>
                          <Bar dataKey="musculaire" fill={COLORS.purple} radius={[0, 6, 6, 0]} name="Musculaire">
                            <LabelList
                              dataKey="musculairePct"
                              position="right"
                              formatter={(value) => value > 0 ? `${value.toFixed(0)}%` : ''}
                              style={{ fontSize: 10, fontWeight: 600, fill: COLORS.purple }}
                            />
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart data={(() => {
                          // Combiner vous et Upway - graphique en %
                          const allCats = [...new Set([
                            ...simpleData.categoryElecMuscuData.map(d => d.name),
                            ...upwayCategoryDist.map(d => d.name)
                          ])];

                          return allCats.map(cat => {
                            const yourData = simpleData.categoryElecMuscuData.find(d => d.name === cat);
                            const upwayData = upwayCategoryDist.find(d => d.name === cat);

                            return {
                              name: cat,
                              vousElecPct: yourData?.electriquePct || 0,
                              vousMusculairePct: yourData?.musculairePct || 0,
                              upwayElecPct: upwayData?.electriquePct || 0,
                              upwayMusculairePct: upwayData?.musculairePct || 0,
                              vousElec: yourData?.electrique || 0,
                              vousMusculaire: yourData?.musculaire || 0,
                              upwayElec: upwayData?.electrique || 0,
                              upwayMusculaire: upwayData?.musculaire || 0
                            };
                          }).sort((a, b) =>
                            ((b.vousElecPct + b.vousMusculairePct) - (a.vousElecPct + a.vousMusculairePct))
                          );
                        })()} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: '%', position: 'insideRight', offset: 10 }} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip
                            formatter={(value, name, props) => {
                              const payload = props.payload;
                              if (name === "Mint - Électrique") {
                                return [`${Math.round(value)}% (${payload.vousElec} unités)`, name];
                              } else if (name === "Mint - Musculaire") {
                                return [`${Math.round(value)}% (${payload.vousMusculaire} unités)`, name];
                              } else if (name === "Upway - Électrique") {
                                return [`${Math.round(value)}% (${payload.upwayElec} unités)`, name];
                              }
                            }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="vousElecPct" fill="#10b981" radius={[0, 6, 6, 0]} name="Mint - Électrique" stackId="mint">
                            <LabelList
                              dataKey="vousElecPct"
                              position="inside"
                              formatter={(value) => value > 3 ? `${Math.round(value)}%` : ''}
                              style={{ fontSize: 9, fontWeight: 600, fill: '#fff' }}
                            />
                          </Bar>
                          <Bar dataKey="vousMusculairePct" fill="#059669" radius={[0, 6, 6, 0]} name="Mint - Musculaire" stackId="mint">
                            <LabelList
                              dataKey="vousMusculairePct"
                              position="inside"
                              formatter={(value) => value > 3 ? `${Math.round(value)}%` : ''}
                              style={{ fontSize: 9, fontWeight: 600, fill: '#fff' }}
                            />
                          </Bar>
                          <Bar dataKey="upwayElecPct" fill="#2563eb" radius={[0, 6, 6, 0]} name="Upway - Électrique">
                            <LabelList
                              dataKey="upwayElecPct"
                              position="inside"
                              formatter={(value) => value > 3 ? `${Math.round(value)}%` : ''}
                              style={{ fontSize: 9, fontWeight: 600, fill: '#fff' }}
                            />
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée catégorie</div>
                )}
              </div>

              {/* Durée de mise en ligne */}
              {stockMode === "vente" && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Durée de mise en ligne (jours)</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={showUpwayComparison}
                        onChange={(e) => setShowUpwayComparison(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ color: '#0d9488', fontWeight: 600 }}>Comparer avec Upway</span>
                    </label>
                  </div>
                  {listingAgeDist.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer>
                        {!showUpwayComparison ? (
                          <BarChart data={withPctLabel(listingAgeDist, "value")}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis hide />
                            <Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#374151', dataKey: '__pctLabel' }}>
                              {listingAgeDist.map((entry, idx) => {
                                // Dégradé du vert au rouge (sobre)
                                const colors = ['#10b981', '#34d399', '#fbbf24', '#fb923c', '#ef4444'];
                                const colorIndex = Math.min(idx, colors.length - 1);
                                return <Cell key={`listing-${idx}`} fill={colors[colorIndex]} />;
                              })}
                            </Bar>
                          </BarChart>
                        ) : (
                          <BarChart data={(() => {
                            // Combiner les données pour comparaison en %
                            const allRanges = [...new Set([...listingAgeDist.map(d => d.name), ...upwayAgeDist.map(d => d.name)])];
                            const totalYours = listingAgeDist.reduce((sum, d) => sum + d.value, 0);
                            const totalUpway = upwayAgeDist.reduce((sum, d) => sum + d.value, 0);

                            // Calculer les catégories par tranche d'âge pour Mint
                            const ageRanges = [
                              { range: "0-7j", min: 0, max: 7 },
                              { range: "7-30j", min: 7, max: 30 },
                              { range: "30-60j", min: 30, max: 60 },
                              { range: "60-90j", min: 60, max: 90 },
                              { range: "90-120j", min: 90, max: 120 },
                              { range: "120-150j", min: 120, max: 150 },
                              { range: "150j+", min: 150, max: Infinity },
                            ];

                            const mintCategoriesByAge = {};
                            const upwayCategoriesByAge = {};

                            // Pour Mint
                            velos.forEach(v => {
                              const publishedAt = v?.["Published At"];
                              if (!publishedAt) return;
                              const date = new Date(publishedAt);
                              if (isNaN(date.getTime())) return;
                              const age = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                              const cat = v?.["Catégorie"] || "Non classé";

                              const bucket = ageRanges.find(r => age >= r.min && age < r.max);
                              if (bucket) {
                                if (!mintCategoriesByAge[bucket.range]) {
                                  mintCategoriesByAge[bucket.range] = {};
                                }
                                mintCategoriesByAge[bucket.range][cat] = (mintCategoriesByAge[bucket.range][cat] || 0) + 1;
                              }
                            });

                            // Pour Upway
                            upwayBikes.forEach(b => {
                              const d = b.uploadedDate || b["uploadedDate"];
                              if (!d) return;
                              const date = new Date(d);
                              if (isNaN(date.getTime())) return;
                              const age = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                              const cat = b["Catégorie"] || b.cargoCategory || "Non classé";

                              const bucket = ageRanges.find(r => age >= r.min && age < r.max);
                              if (bucket) {
                                if (!upwayCategoriesByAge[bucket.range]) {
                                  upwayCategoriesByAge[bucket.range] = {};
                                }
                                upwayCategoriesByAge[bucket.range][cat] = (upwayCategoriesByAge[bucket.range][cat] || 0) + 1;
                              }
                            });

                            return allRanges.map(range => {
                              const yourData = listingAgeDist.find(d => d.name === range) || { value: 0 };
                              const upwayData = upwayAgeDist.find(d => d.name === range) || { value: 0 };
                              const yourPct = totalYours > 0 ? (yourData.value / totalYours) * 100 : 0;
                              const upwayPct = totalUpway > 0 ? (upwayData.value / totalUpway) * 100 : 0;

                              return {
                                name: range,
                                vousPct: yourPct,
                                upwayPct: upwayPct,
                                vousUnits: yourData.value,
                                upwayUnits: upwayData.value,
                                mintCategories: mintCategoriesByAge[range] || {},
                                upwayCategories: upwayCategoriesByAge[range] || {}
                              };
                            });
                          })()}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis
                              tick={{ fontSize: 10 }}
                              label={{ value: '%', angle: 0, position: 'insideTopLeft', offset: 10 }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;

                                return (
                                  <div style={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    minWidth: '200px'
                                  }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                                      {data.name}
                                    </div>

                                    {/* Mint */}
                                    <div style={{ marginBottom: 8 }}>
                                      <div style={{ color: '#10b981', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                                        🟢 Mint: {Math.round(data.vousPct)}% ({data.vousUnits} unités)
                                      </div>
                                      {Object.keys(data.mintCategories).length > 0 && (
                                        <div style={{ fontSize: 11, paddingLeft: 16, color: '#6b7280' }}>
                                          {Object.entries(data.mintCategories)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 3)
                                            .map(([cat, count]) => (
                                              <div key={cat}>• {cat}: {count}</div>
                                            ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Upway */}
                                    <div>
                                      <div style={{ color: '#2563eb', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                                        🔵 Upway: {Math.round(data.upwayPct)}% ({data.upwayUnits} unités)
                                      </div>
                                      {Object.keys(data.upwayCategories).length > 0 && (
                                        <div style={{ fontSize: 11, paddingLeft: 16, color: '#6b7280' }}>
                                          {Object.entries(data.upwayCategories)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 3)
                                            .map(([cat, count]) => (
                                              <div key={cat}>• {cat}: {count}</div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Legend
                              iconType="circle"
                              wrapperStyle={{ fontSize: 12 }}
                            />
                            <Bar dataKey="vousPct" fill="#10b981" radius={[6, 6, 0, 0]} name="Mint">
                              <LabelList
                                dataKey="vousPct"
                                position="top"
                                formatter={(value) => `${Math.round(value)}%`}
                                style={{ fontSize: 10, fontWeight: 600 }}
                              />
                            </Bar>
                            <Bar dataKey="upwayPct" fill="#2563eb" radius={[6, 6, 0, 0]} name="Upway">
                              <LabelList
                                dataKey="upwayPct"
                                position="top"
                                formatter={(value) => `${Math.round(value)}%`}
                                style={{ fontSize: 10, fontWeight: 600 }}
                              />
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée durée</div>
                  )}
                </div>
              )}

              {/* Prix moyen par catégorie */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Prix moyen par catégorie (Électrique vs Musculaire)</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showUpwayCategoryPriceComparison}
                      onChange={(e) => setShowUpwayCategoryPriceComparison(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#0d9488', fontWeight: 600 }}>Comparer avec Upway</span>
                  </label>
                </div>
                {simpleData.categoryPriceElecMuscuData?.length > 0 ? (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      {!showUpwayCategoryPriceComparison ? (
                        <BarChart data={simpleData.categoryPriceElecMuscuData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value, name) => [`${value}€`, name]}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="électrique" fill={COLORS.teal} radius={[0, 6, 6, 0]} name="Électrique">
                            <LabelList
                              dataKey="électrique"
                              position="right"
                              formatter={(value) => value > 0 ? `${value}€` : ''}
                              style={{ fontSize: 10, fontWeight: 600, fill: COLORS.teal }}
                            />
                          </Bar>
                          <Bar dataKey="musculaire" fill={COLORS.purple} radius={[0, 6, 6, 0]} name="Musculaire">
                            <LabelList
                              dataKey="musculaire"
                              position="right"
                              formatter={(value) => value > 0 ? `${value}€` : ''}
                              style={{ fontSize: 10, fontWeight: 600, fill: COLORS.purple }}
                            />
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart data={(() => {
                          // Combiner vous et Upway
                          const allCats = [...new Set([
                            ...simpleData.categoryPriceElecMuscuData.map(d => d.name),
                            ...upwayCategoryPriceDist.map(d => d.name)
                          ])];

                          return allCats.map(cat => {
                            const yourData = simpleData.categoryPriceElecMuscuData.find(d => d.name === cat);
                            const upwayData = upwayCategoryPriceDist.find(d => d.name === cat);

                            return {
                              name: cat,
                              vousElec: yourData?.électrique || 0,
                              vousMusculaire: yourData?.musculaire || 0,
                              upwayElec: upwayData?.électrique || 0,
                              upwayMusculaire: upwayData?.musculaire || 0,
                              upwayElecCount: upwayData?.electriqueCount || 0,
                              upwayMusculaireCount: upwayData?.musculaireCount || 0
                            };
                          }).sort((a, b) =>
                            ((b.vousElec + b.vousMusculaire) - (a.vousElec + a.vousMusculaire))
                          );
                        })()} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: '€', position: 'insideRight', offset: 10 }} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip
                            formatter={(value, name, props) => {
                              const payload = props.payload;
                              if (name === "Mint - Électrique") {
                                return [`${value}€`, name];
                              } else if (name === "Mint - Musculaire") {
                                return [`${value}€`, name];
                              } else if (name === "Upway - Électrique") {
                                return [`${value}€ (${payload.upwayElecCount} vélos)`, name];
                              }
                            }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="vousElec" fill="#10b981" radius={[0, 6, 6, 0]} name="Mint - Électrique">
                            <LabelList
                              dataKey="vousElec"
                              position="right"
                              formatter={(value) => value > 0 ? `${value}€` : ''}
                              style={{ fontSize: 9, fontWeight: 600, fill: '#10b981' }}
                            />
                          </Bar>
                          <Bar dataKey="vousMusculaire" fill="#059669" radius={[0, 6, 6, 0]} name="Mint - Musculaire">
                            <LabelList
                              dataKey="vousMusculaire"
                              position="right"
                              formatter={(value) => value > 0 ? `${value}€` : ''}
                              style={{ fontSize: 9, fontWeight: 600, fill: '#059669' }}
                            />
                          </Bar>
                          <Bar dataKey="upwayElec" fill="#2563eb" radius={[0, 6, 6, 0]} name="Upway - Électrique">
                            <LabelList
                              dataKey="upwayElec"
                              position="right"
                              formatter={(value) => value > 0 ? `${value}€` : ''}
                              style={{ fontSize: 9, fontWeight: 600, fill: '#2563eb' }}
                            />
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée prix par catégorie</div>
                )}
              </div>
            </div>
          </div>

          {/* ===== KPI PROMO ===== */}
          {stockMode === "vente" && (
            <div style={{ marginBottom: 32 }}>
              <div style={sectionHeaderStyle}>
                <span>🏷️</span>
                <span>KPI Promo</span>
              </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Part en promo</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.warn }}>
                  {kpi.promoPctUnits || 0}%
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  {kpi.promoUnits || 0} unités
                </div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Montant total promos</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.bad }}>
                  {fmtEur(kpi.promoTotalEur || 0)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>total des réductions</div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Réduc moyenne</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.purple }}>
                  {fmtEur(kpi.promoAvgEur || 0)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  max: {fmtEur(kpi.promoMaxEur || 0)}
                </div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Marge moy. sans promo</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: (() => {
                  let totalMarginWeighted = 0;
                  let totalUnitsWeighted = 0;
                  velos.forEach(v => {
                    const url = v?.URL;
                    const pricing = pricingByUrl?.[url];
                    if (pricing) {
                      const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
                      const sellPrice = parseFloat(priceStr) || 0;
                      const mintPromoAmount = getPromoAmount(v);
                      const originalPrice = sellPrice + mintPromoAmount; // Prix original avant promos

                      const buyPrice = Number(pricing.negotiated_buy_price) || 0;
                      const parts = Number(pricing.parts_cost_actual) || 0;
                      const logistics = Number(pricing.logistics_cost) || 0;

                      const units = (() => {
                        let total = 0;
                        for (let i = 1; i <= 6; i++) {
                          const stock = parseInt(v?.[`Stock variant ${i}`]) || 0;
                          total += stock;
                        }
                        return total;
                      })();

                      if (originalPrice > 0 && units > 0) {
                        const margin = originalPrice - buyPrice - parts - logistics;
                        totalMarginWeighted += margin * units;
                        totalUnitsWeighted += units;
                      }
                    }
                  });
                  const avgMarginWithoutPromo = totalUnitsWeighted > 0 ? totalMarginWeighted / totalUnitsWeighted : 0;
                  return avgMarginWithoutPromo < 0 ? COLORS.bad : COLORS.good;
                })()} }>
                  {(() => {
                    let totalMarginWeighted = 0;
                    let totalUnitsWeighted = 0;
                    velos.forEach(v => {
                      const url = v?.URL;
                      const pricing = pricingByUrl?.[url];
                      if (pricing) {
                        const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
                        const sellPrice = parseFloat(priceStr) || 0;
                        const mintPromoAmount = getPromoAmount(v);
                        const originalPrice = sellPrice + mintPromoAmount; // Prix original avant promos

                        const buyPrice = Number(pricing.negotiated_buy_price) || 0;
                        const parts = Number(pricing.parts_cost_actual) || 0;
                        const logistics = Number(pricing.logistics_cost) || 0;

                        const units = (() => {
                          let total = 0;
                          for (let i = 1; i <= 6; i++) {
                            const stock = parseInt(v?.[`Stock variant ${i}`]) || 0;
                            total += stock;
                          }
                          return total;
                        })();

                        if (originalPrice > 0 && units > 0) {
                          const margin = originalPrice - buyPrice - parts - logistics;
                          totalMarginWeighted += margin * units;
                          totalUnitsWeighted += units;
                        }
                      }
                    });
                    const avgMarginWithoutPromo = totalUnitsWeighted > 0 ? totalMarginWeighted / totalUnitsWeighted : 0;
                    return `${Math.round(avgMarginWithoutPromo)}€`;
                  })()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  prix original avant promo | {(() => {
                    let totalMarginWeighted = 0;
                    let totalSellValueWeighted = 0;
                    velos.forEach(v => {
                      const url = v?.URL;
                      const pricing = pricingByUrl?.[url];
                      if (pricing) {
                        const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
                        const sellPrice = parseFloat(priceStr) || 0;
                        const mintPromoAmount = getPromoAmount(v);
                        const originalPrice = sellPrice + mintPromoAmount;
                        
                        const buyPrice = Number(pricing.negotiated_buy_price) || 0;
                        const parts = Number(pricing.parts_cost_actual) || 0;
                        const logistics = Number(pricing.logistics_cost) || 0;
                        
                        const units = (() => {
                          let total = 0;
                          for (let i = 1; i <= 6; i++) {
                            const stock = parseInt(v?.[`Stock variant ${i}`]) || 0;
                            total += stock;
                          }
                          return total;
                        })();
                        
                        if (originalPrice > 0 && units > 0) {
                          const margin = originalPrice - buyPrice - parts - logistics;
                          totalMarginWeighted += margin * units;
                          totalSellValueWeighted += originalPrice * units;
                        }
                      }
                    });
                    const avgMarginRate = totalSellValueWeighted > 0 ? (totalMarginWeighted / totalSellValueWeighted) * 100 : 0;
                    return `${Math.round(avgMarginRate)}%`;
                  })()}
                </div>
              </div>
            </div>

            {/* Graphiques KPI Promo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 16 }}>
              {/* Moyenne promo par catégorie */}
              <div style={{ ...chartContainerStyle, minHeight: 300 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Moyenne promo par catégorie
                </div>
                {simpleData.promoCategoryData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={withPctLabel(simpleData.promoCategoryData, "value")} layout="vertical" margin={{ left: 80, right: 60, top: 5, bottom: 5 }}>
                      <XAxis type="number" tickFormatter={fmtEur} />
                      <YAxis type="category" dataKey="name" width={70} style={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, name, props) => `${fmtEur(v)} (${props.payload.units} unités)`} />
                      <Bar dataKey="value" fill={COLORS.warn} radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "#374151", dataKey: "__pctLabel" }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>

              {/* Répartition des promos par montant */}
              <div style={{ ...chartContainerStyle, minHeight: 300 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Répartition des promos par montant
                </div>
                {simpleData.promoDistributionData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={withPctLabel(simpleData.promoDistributionData, "value")} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="name" style={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={v => `${v} unités`} />
                      <Bar dataKey="value" fill={COLORS.purple} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#374151", dataKey: "__pctLabel" }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* ===== KPI PRICING ===== */}
          <div style={{ marginBottom: 32 }}>
            <div style={sectionHeaderStyle}>
              <span>💰</span>
              <span>KPI Pricing</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Marge moy. par unité</div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: avgBenefitPerUnit < 0 ? COLORS.bad : COLORS.good,
                }}>
                  {fmtEur(avgBenefitPerUnit)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>bénéfice pondéré</div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Marge négative</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.bad }}>
                  {kpi.negPctUnits || 0}%
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  {(() => {
                    let negUnits = 0;
                    velos.forEach(v => {
                      const url = v?.URL;
                      const pricing = pricingByUrl?.[url];
                      let units = 0;
                      for (let i = 1; i <= 6; i++) {
                        units += parseInt(v?.[`Stock variant ${i}`]) || 0;
                      }
                      if (pricing && units > 0) {
                        const priceStr = String(v?.["Prix réduit"] || "0").replace(/[^\d.,]/g, "").replace(",", ".");
                        const price = parseFloat(priceStr) || 0;
                        const buy = Number(pricing.negotiated_buy_price) || 0;
                        const parts = Number(pricing.parts_cost_actual) || 0;
                        const logistics = Number(pricing.logistics_cost) || 0;
                        const margin = price - buy - parts - logistics;
                        if (price > 0 && margin < 0) {
                          negUnits += units;
                        }
                      }
                    });
                    return negUnits;
                  })()} unités
                </div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Vélos Pricés</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.good }}>
                  {(() => {
                    let pricedCount = 0;
                    let totalCount = 0;
                    velos.forEach(v => {
                      const url = v?.URL;
                      const pricing = pricingByUrl?.[url];
                      totalCount += 1; // 1 fiche
                      if (pricing?.best_used_url) {
                        pricedCount += 1; // 1 fiche
                      }
                    });
                    return totalCount > 0 ? Math.round((pricedCount / totalCount) * 100) : 0;
                  })()}%
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  {(() => {
                    let pricedCount = 0;
                    velos.forEach(v => {
                      const url = v?.URL;
                      const pricing = pricingByUrl?.[url];
                      if (pricing?.best_used_url) {
                        pricedCount += 1; // 1 fiche
                      }
                    });
                    return pricedCount;
                  })()} fiches avec prix de référence
                </div>
              </div>
            </div>

            {/* Graphiques Pricing */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 16 }}>
              {/* Distribution des prix */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Distribution des prix (€)</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showUpwayPriceComparison}
                      onChange={(e) => setShowUpwayPriceComparison(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#0d9488', fontWeight: 600 }}>Comparer avec Upway</span>
                  </label>
                </div>
                {priceHisto.length > 0 ? (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      {!showUpwayPriceComparison ? (
                        <BarChart data={withPctLabel(priceHisto, "value")}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis hide />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#374151', dataKey: '__pctLabel' }}>
                            {priceHisto.map((_, idx) => (
                              <Cell key={`price-${idx}`} fill={COLORS.primary} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart data={(() => {
                          // Combiner les données pour comparaison en %
                          const allRanges = [...new Set([...priceHisto.map(d => d.name), ...upwayPriceDist.map(d => d.name)])];
                          const totalYours = priceHisto.reduce((sum, d) => sum + d.value, 0);
                          const totalUpway = upwayPriceDist.reduce((sum, d) => sum + d.value, 0);

                          return allRanges.map(range => {
                            const yourData = priceHisto.find(d => d.name === range) || { value: 0 };
                            const upwayData = upwayPriceDist.find(d => d.name === range) || { value: 0 };
                            const yourPct = totalYours > 0 ? (yourData.value / totalYours) * 100 : 0;
                            const upwayPct = totalUpway > 0 ? (upwayData.value / totalUpway) * 100 : 0;

                            return {
                              name: range,
                              vousPct: yourPct,
                              upwayPct: upwayPct,
                              vousUnits: yourData.value,
                              upwayUnits: upwayData.value
                            };
                          });
                        })()}>
                          <XAxis dataKey="name" tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={60} />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            label={{ value: '%', angle: 0, position: 'insideTopLeft', offset: 10 }}
                          />
                          <Tooltip
                            formatter={(value, name, props) => {
                              if (name === "Mint") {
                                return [`${Math.round(value)}% (${props.payload.vousUnits} unités)`, name];
                              } else {
                                return [`${Math.round(value)}% (${props.payload.upwayUnits} unités)`, name];
                              }
                            }}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="vousPct" fill="#10b981" radius={[6, 6, 0, 0]} name="Mint">
                            <LabelList
                              dataKey="vousPct"
                              position="top"
                              formatter={(value) => `${Math.round(value)}%`}
                              style={{ fontSize: 9, fontWeight: 600 }}
                            />
                          </Bar>
                          <Bar dataKey="upwayPct" fill="#2563eb" radius={[6, 6, 0, 0]} name="Upway">
                            <LabelList
                              dataKey="upwayPct"
                              position="top"
                              formatter={(value) => `${Math.round(value)}%`}
                              style={{ fontSize: 9, fontWeight: 600 }}
                            />
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée prix</div>
                )}
              </div>

              {/* Distribution des marges */}
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Distribution des marges (€)</div>
                {benefitHisto.length > 0 ? (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={withPctLabel(benefitHisto, "value")}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#374151', dataKey: '__pctLabel' }}>
                          {benefitHisto.map((entry, idx) => {
                            const isNeg = entry.name.includes("-");
                            return <Cell key={`ben-${idx}`} fill={isNeg ? COLORS.bad : COLORS.good} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée marge</div>
                )}
              </div>

              {/* Scatter: Marge vs Âge annonce */}
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Marge vs Âge de l'annonce (jours)</div>
                {scatterData.length > 0 ? (
                  <div style={{ height: 400 }}>
                    <ResponsiveContainer>
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          dataKey="age" 
                          name="Âge (j)" 
                          tick={{ fontSize: 10 }}
                          label={{ value: 'Âge (jours)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="benefit" 
                          name="Marge (€)" 
                          tick={{ fontSize: 10 }}
                          label={{ value: 'Marge (€)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <ZAxis type="number" dataKey="units" range={[20, 120]} name="Stock" />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                padding: 10,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                                  {d.brand} {d.model}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                  Année: {d.year}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                  Prix: {fmtEur(d.price)}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                  Âge: {d.age}j · Marge: {fmtEur(d.benefit)}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Scatter data={scatterData}>
                          {scatterData.map((entry, index) => {
                            // Calcul d'un score : haut gauche (jeune + bonne marge) = vert, bas droite (vieux + faible marge) = rouge
                            // Normaliser age (0-150 jours) et benefit (-500 à +1500€)
                            const ageNorm = Math.min(entry.age / 150, 1); // 0 = jeune, 1 = vieux
                            const benefitNorm = Math.max(0, Math.min((entry.benefit + 500) / 2000, 1)); // 0 = mauvais, 1 = bon
                            
                            // Score combiné : 70% marge, 30% âge
                            const score = (1 - ageNorm) * 0.3 + benefitNorm * 0.7;
                            
                            // Interpolation de couleur rouge -> orange -> jaune -> vert
                            let color;
                            if (score < 0.33) {
                              // Rouge à orange
                              const t = score / 0.33;
                              color = `rgb(${239}, ${Math.round(68 + (146 * t))}, 68)`;
                            } else if (score < 0.66) {
                              // Orange à jaune/vert
                              const t = (score - 0.33) / 0.33;
                              color = `rgb(${Math.round(251 - (61 * t))}, ${Math.round(146 + (157 * t))}, ${Math.round(68 + (81 * t))})`;
                            } else {
                              // Vert
                              const t = (score - 0.66) / 0.34;
                              color = `rgb(${Math.round(190 - (174 * t))}, ${Math.round(303 - (92 * t))}, ${Math.round(149 - (65 * t))})`;
                            }
                            
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée scatter</div>
                )}
              </div>

              {/* NOUVEAU: Marge moyenne par marque */}
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Marge moyenne par marque (€) - {simpleData.brandMarginData?.length || 0} marques</div>
                {simpleData.brandMarginData?.length > 0 ? (
                  <div style={{ height: 400, overflowY: 'auto', overflowX: 'hidden' }}>
                    <div style={{ height: Math.max(400, simpleData.brandMarginData.length * 30) }}>
                      <ResponsiveContainer>
                        <BarChart data={simpleData.brandMarginData} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const data = payload[0].payload;
                              return (
                                <div style={{
                                  background: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 8,
                                  padding: 10,
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}>
                                  <div style={{ fontWeight: 700 }}>{data.name}</div>
                                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                                    Marge moy: {fmtEur(data.avgMargin)}
                                  </div>
                                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                                    Unités: {data.units}
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="avgMargin" radius={[0, 6, 6, 0]}>
                            {simpleData.brandMarginData.map((entry, idx) => (
                              <Cell key={`brand-margin-${idx}`} fill={entry.avgMargin < 0 ? COLORS.bad : COLORS.good} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>Aucune donnée de marge disponible</div>
                )}
              </div>
            </div>
          </div>

          {/* ===== KPI ACHAT ===== */}
          <div style={{ marginBottom: 0 }}>
            <div style={{ ...sectionHeaderStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🛒</span>
                <span>KPI Achat</span>
              </div>
              {achatData.availableMonths?.length > 0 && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#fff",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  {achatData.availableMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    return (
                      <option key={month} value={month}>
                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Total achats</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.primary }}>
                  {achatData.monthlyKPIs[selectedMonth]?.totalAchats || 0}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>vélos achetés ce mois</div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Valeur achats</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.teal }}>
                  {fmtEur(achatData.monthlyKPIs[selectedMonth]?.valeurAchats || 0)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>prix d'achat total</div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Prix moyen d'achat</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.purple }}>
                  {achatData.monthlyKPIs[selectedMonth]?.prixMoyenAchat 
                    ? fmtEur(achatData.monthlyKPIs[selectedMonth].prixMoyenAchat)
                    : "—"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>par vélo</div>
              </div>
            </div>

            {/* Graphiques KPI Achat */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {/* Nombre d'achats par mois */}
              <div style={{ ...chartContainerStyle, minHeight: 300 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Nombre d'achats par mois
                </div>
                {achatData.purchasesByMonth?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={achatData.purchasesByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip formatter={v => `${v} achats`} />
                      <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>

              {/* Marge moyenne par mois d'achat */}
              <div style={{ ...chartContainerStyle, minHeight: 300 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Marge moyenne par mois d'achat
                </div>
                {achatData.marginByMonth?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={achatData.marginByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} />
                      <YAxis tickFormatter={fmtEur} />
                      <Tooltip 
                        formatter={(v, name, props) => `${fmtEur(v)} (${props.payload.count} vélos)`}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {achatData.marginByMonth.map((entry, idx) => (
                          <Cell key={`margin-month-${idx}`} fill={entry.value < 0 ? COLORS.bad : COLORS.good} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>

              {/* NOUVEAU: Marge moyenne par catégorie */}
              <div style={{ ...chartContainerStyle, minHeight: 300, gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Marge moyenne par catégorie
                </div>
                {achatData.marginByCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={achatData.marginByCategory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} />
                      <YAxis tickFormatter={fmtEur} />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const pct = name === "Électrique" ? props.payload.electriquePct : props.payload.musculairePct;
                          return `${fmtEur(value)} (${pct.toFixed(1)}%)`;
                        }}
                      />
                      <Legend 
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="electrique" fill={COLORS.teal} radius={[4, 4, 0, 0]} name="Électrique">
                        <LabelList 
                          dataKey="electriquePct" 
                          position="top" 
                          formatter={(value) => `${value.toFixed(1)}%`}
                          style={{ fontSize: 10, fontWeight: 600, fill: COLORS.teal }}
                        />
                      </Bar>
                      <Bar dataKey="musculaire" fill={COLORS.purple} radius={[4, 4, 0, 0]} name="Musculaire">
                        <LabelList 
                          dataKey="musculairePct" 
                          position="top" 
                          formatter={(value) => `${value.toFixed(1)}%`}
                          style={{ fontSize: 10, fontWeight: 600, fill: COLORS.purple }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>

              {/* Marge moyenne par acheteur */}
              <div style={{ ...chartContainerStyle, minHeight: 300, gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Marge moyenne par acheteur
                </div>
                {achatData.marginBySeller?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={achatData.marginBySeller} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} />
                      <YAxis tickFormatter={fmtEur} />
                      <Tooltip 
                        formatter={(v, name, props) => `${fmtEur(v)} (${props.payload.count} vélos)`}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {achatData.marginBySeller.map((entry, idx) => {
                          // Couleurs variées pour chaque acheteur
                          const colors = [COLORS.primary, COLORS.good, COLORS.teal, COLORS.purple, COLORS.pink, COLORS.mint, COLORS.blue, COLORS.warn];
                          return (
                            <Cell key={`margin-seller-${idx}`} fill={colors[idx % colors.length]} />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>

              {/* Marge moyenne par tranche de date de publication */}
              <div style={{ ...chartContainerStyle, minHeight: 300, gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  Marge moyenne par tranche de date de publication
                </div>
                {simpleData.publicationMarginData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={simpleData.publicationMarginData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} />
                      <YAxis tickFormatter={fmtEur} />
                      <Tooltip 
                        content={(props) => {
                          if (props.active && props.payload && props.payload.length > 0) {
                            const data = props.payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: 'white',
                                padding: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                  Tranche: {props.label}
                                </div>
                                <div>Marge moyenne: {fmtEur(data.avgMargin)}</div>
                                <div>Quantité: {data.units} unités</div>
                                <div>Part: {data.percentage}%</div>
                                <div>Valeur totale: {fmtEur(data.sellValue)}</div>
                                <div>Prix achat moyen: {fmtEur(data.avgBuyPrice)}</div>
                                <div>Frais pièce moyen: {fmtEur(data.avgParts)}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="avgMargin" radius={[4, 4, 0, 0]}>
                        <LabelList 
                          dataKey="units" 
                          position="top" 
                          formatter={(value) => `${value} u.`}
                          style={{ fontSize: 10, fontWeight: 600, fill: "#000" }}
                        />
                        {simpleData.publicationMarginData.map((entry, idx) => {
                          // Dégradé du vert au rouge selon l'âge (plus vieux = plus rouge)
                          const greenToRed = (index, total) => {
                            const ratio = index / (total - 1);
                            const red = Math.round(ratio * 255);
                            const green = Math.round((1 - ratio) * 255);
                            return `rgb(${red}, ${green}, 0)`;
                          };
                          return (
                            <Cell 
                              key={`pub-margin-${idx}`} 
                              fill={greenToRed(idx, simpleData.publicationMarginData.length)} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={noDataStyle}>Aucune donnée disponible</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
