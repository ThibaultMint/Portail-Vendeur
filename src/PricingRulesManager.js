import React, { useState } from "react";
import { generateRuleId, validateRule } from "./pricingRulesUtils";

// Composant pour afficher/éditer une règle
const RuleItem = ({
  rule,
  type,
  isEditing,
  conditionOptions,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggle,
  allCategories,
}) => {
  const [editedRule, setEditedRule] = useState(rule);

  if (!isEditing) {
    // Mode affichage
    const percentChange = ((rule.rate - 1) * 100).toFixed(1);
    const sign = rule.rate > 1 ? "+" : "";

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto",
          gap: 8,
          padding: 10,
          background: rule.enabled ? "#fff" : "#f3f4f6",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          alignItems: "center",
          opacity: rule.enabled ? 1 : 0.6,
        }}
      >
        <div style={{ fontSize: 13 }}>
          Si{" "}
          {type === "priceBand" ? (
            <>
              <strong>
                Prix {rule.operator} {rule.threshold}€
              </strong>
              {rule.category && (
                <span style={{ color: "#666", fontSize: 11, marginLeft: 8 }}>
                  ({rule.category})
                </span>
              )}
            </>
          ) : type === "stock" ? (
            <>
              <strong>
                {rule.stockStatus} (≥{rule.unitDifference} unités)
              </strong>
            </>
          ) : (
            <strong>{rule.condition}</strong>
          )}{" "}
          alors{" "}
          <span
            style={{
              color: rule.rate > 1 ? "#059669" : "#dc2626",
              fontWeight: 600,
            }}
          >
            {sign}
            {percentChange}%
          </span>
        </div>

        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ width: 16, height: 16, cursor: "pointer" }}
          title="Activer/Désactiver la règle"
        />

        <button
          onClick={onEdit}
          style={{
            padding: "4px 8px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
          }}
          title="Éditer"
        >
          ✏️
        </button>

        <button
          onClick={onDelete}
          style={{
            padding: "4px 8px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
          }}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    );
  }

  // Mode édition
  const handleSave = () => {
    const validation = validateRule(editedRule, type);
    if (!validation.valid) {
      alert(`Erreur: ${validation.error}`);
      return;
    }
    onSave(editedRule);
  };

  return (
    <div
      style={{
        padding: 12,
        background: "#eff6ff",
        borderRadius: 6,
        border: "2px solid #3b82f6",
        display: "grid",
        gridTemplateColumns:
          type === "priceBand" ? "1fr auto 1fr 1fr auto auto auto" : "1fr auto auto auto",
        gap: 8,
        alignItems: "center",
      }}
    >
      {type === "priceBand" ? (
        <>
          {allCategories && (
            <select
              value={editedRule.category || ""}
              onChange={(e) =>
                setEditedRule({ ...editedRule, category: e.target.value })
              }
              style={{
                padding: "6px 8px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            >
              <option value="">Toutes catégories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          <select
            value={editedRule.operator || ">"}
            onChange={(e) =>
              setEditedRule({ ...editedRule, operator: e.target.value })
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              width: "80px",
              boxSizing: "border-box",
            }}
          >
            <option value=">">{">"}</option>
            <option value="<">{"<"}</option>
            <option value=">=">{">="}</option>
            <option value="<=">{"<="}</option>
            <option value="=">{"="}</option>
          </select>

          <input
            type="number"
            value={editedRule.threshold || ""}
            onChange={(e) =>
              setEditedRule({ ...editedRule, threshold: parseFloat(e.target.value) })
            }
            placeholder="Ex: 1500"
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />

          <input
            type="number"
            step="0.01"
            min="0.01"
            value={editedRule.rate || ""}
            onChange={(e) =>
              setEditedRule({ ...editedRule, rate: parseFloat(e.target.value) })
            }
            placeholder="Ex: 0.95"
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </>
      ) : type === "stock" ? (
        <>
          <select
            value={editedRule.stockStatus || ""}
            onChange={(e) =>
              setEditedRule({ ...editedRule, stockStatus: e.target.value })
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              boxSizing: "border-box",
            }}
          >
            <option value="">-- Sélectionner --</option>
            {conditionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            value={editedRule.unitDifference || ""}
            onChange={(e) =>
              setEditedRule({ ...editedRule, unitDifference: parseInt(e.target.value) || 0 })
            }
            placeholder="Ex: 5"
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              width: "80px",
              boxSizing: "border-box",
            }}
          />

          <input
            type="number"
            step="0.01"
            min="0.01"
            value={editedRule.rate || ""}
            onChange={(e) =>
              setEditedRule({ ...editedRule, rate: parseFloat(e.target.value) })
            }
            placeholder="Ex: 0.95"
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              width: "100px",
              boxSizing: "border-box",
            }}
          />
        </>
      ) : (
        <>
          <select
            value={editedRule.condition}
            onChange={(e) =>
              setEditedRule({ ...editedRule, condition: e.target.value })
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              boxSizing: "border-box",
            }}
          >
            <option value="">-- Sélectionner --</option>
            {conditionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0.01"
            value={editedRule.rate}
            onChange={(e) =>
              setEditedRule({ ...editedRule, rate: parseFloat(e.target.value) })
            }
            placeholder="Ex: 0.95"
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              width: "100px",
              boxSizing: "border-box",
            }}
          />
        </>
      )}

      <button
        onClick={handleSave}
        style={{
          padding: "6px 12px",
          background: "#10b981",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
        title="Sauvegarder"
      >
        💾
      </button>

      <button
        onClick={onCancel}
        style={{
          padding: "6px 12px",
          background: "#6b7280",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
        title="Annuler"
      >
        ❌
      </button>
    </div>
  );
};

// Composant section contenant plusieurs règles
const RuleSection = ({
  title,
  rules,
  type,
  conditionOptions,
  requiresCategoryType,
  currentCategoryType,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  allCategories,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleAddRule = () => {
    const baseRule = {
      id: generateRuleId(),
      rate: 1.0,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    let newRule;
    if (type === "priceBand") {
      newRule = {
        ...baseRule,
        operator: ">",
        threshold: 1000,
        category: "",
      };
    } else if (type === "stock") {
      newRule = {
        ...baseRule,
        stockStatus: "",
        unitDifference: 5,
      };
    } else {
      newRule = {
        ...baseRule,
        condition: "",
      };
    }

    onAdd(newRule);
    setIsAdding(false);
  };

  return (
    <div
      style={{
        padding: 16,
        background: "#f9fafb",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h4>
        <button
          onClick={handleAddClick}
          style={{
            padding: "6px 12px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Ajouter une nouvelle règle"
        >
          + Ajouter
        </button>
      </div>

      {/* Message d'avertissement pour catégorie */}
      {requiresCategoryType && !currentCategoryType && (
        <div
          style={{
            fontSize: 12,
            color: "#f59e0b",
            padding: 8,
            background: "#fef3c7",
            borderRadius: 4,
            marginBottom: 8,
          }}
        >
          ⚠️ Sélectionnez d'abord une catégorie + type de vélo dans l'onglet
          Calcul
        </div>
      )}

      {/* Message si pas de règles */}
      {rules.length === 0 && !isAdding && (
        <div style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
          Aucune règle définie
        </div>
      )}

      {/* Liste des règles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rules.map((rule) => (
          <RuleItem
            key={rule.id}
            rule={rule}
            type={type}
            isEditing={editingId === rule.id}
            conditionOptions={conditionOptions}
            allCategories={allCategories}
            onEdit={() => setEditingId(rule.id)}
            onSave={(updated) => {
              onUpdate(rule.id, updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            onDelete={() => onDelete(rule.id)}
            onToggle={(enabled) => onToggle(rule.id, enabled)}
          />
        ))}
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#eff6ff",
            borderRadius: 6,
            border: "2px solid #3b82f6",
          }}
        >
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontWeight: 600 }}>
            Ajouter une nouvelle règle
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              onClick={handleAddRule}
              style={{
                padding: "6px 12px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✅ Créer
            </button>
            <button
              onClick={() => setIsAdding(false)}
              style={{
                padding: "6px 12px",
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ❌ Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant principal de gestion des règles
const PricingRulesManager = ({
  rules,
  onUpdateRules,
  parkingCategories,
  currentForm,
}) => {
  // Handlers pour CRUD
  const addRule = (type, newRule) => {
    const updatedRules = {
      ...rules,
      [type]: [...rules[type], newRule],
    };
    onUpdateRules(updatedRules);
  };

  const updateRule = (type, ruleId, updatedRule) => {
    const updatedRules = {
      ...rules,
      [type]: rules[type].map((r) => (r.id === ruleId ? updatedRule : r)),
    };
    onUpdateRules(updatedRules);
  };

  const deleteRule = (type, ruleId) => {
    const updatedRules = {
      ...rules,
      [type]: rules[type].filter((r) => r.id !== ruleId),
    };
    onUpdateRules(updatedRules);
  };

  const toggleEnabled = (type, ruleId, enabled) => {
    const updatedRules = {
      ...rules,
      [type]: rules[type].map((r) =>
        r.id === ruleId ? { ...r, enabled } : r
      ),
    };
    onUpdateRules(updatedRules);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Section 1: Catégorie + Type */}
      <RuleSection
        title="1️⃣ Règles par Catégorie + Type de vélo"
        rules={rules.categoryTypeRules}
        type="categoryType"
        conditionOptions={parkingCategories}
        onAdd={(rule) => addRule("categoryTypeRules", rule)}
        onUpdate={(id, rule) => updateRule("categoryTypeRules", id, rule)}
        onDelete={(id) => deleteRule("categoryTypeRules", id)}
        onToggle={(id, enabled) => toggleEnabled("categoryTypeRules", id, enabled)}
      />

      {/* Section 2: Tranche de prix */}
      <RuleSection
        title="2️⃣ Conditions de prix"
        rules={rules.priceBandRules}
        type="priceBand"
        allCategories={parkingCategories}
        onAdd={(rule) => addRule("priceBandRules", rule)}
        onUpdate={(id, rule) => updateRule("priceBandRules", id, rule)}
        onDelete={(id) => deleteRule("priceBandRules", id)}
        onToggle={(id, enabled) => toggleEnabled("priceBandRules", id, enabled)}
      />

      {/* Section 3: Taille */}
      <RuleSection
        title="3️⃣ Règles par Taille de cadre"
        rules={rules.sizeRules}
        type="size"
        conditionOptions={["XS", "S", "M", "L", "XL"]}
        onAdd={(rule) => addRule("sizeRules", rule)}
        onUpdate={(id, rule) => updateRule("sizeRules", id, rule)}
        onDelete={(id) => deleteRule("sizeRules", id)}
        onToggle={(id, enabled) => toggleEnabled("sizeRules", id, enabled)}
      />

      {/* Section 4: Tier */}
      <RuleSection
        title="4️⃣ Règles par Catégorie de marque (Tier)"
        rules={rules.tierRules}
        type="tier"
        conditionOptions={["A", "B", "C", "D"]}
        onAdd={(rule) => addRule("tierRules", rule)}
        onUpdate={(id, rule) => updateRule("tierRules", id, rule)}
        onDelete={(id) => deleteRule("tierRules", id)}
        onToggle={(id, enabled) => toggleEnabled("tierRules", id, enabled)}
      />

      {/* Section 5: Stock */}
      <RuleSection
        title="5️⃣ Règles d'Ajustement par État du Stock (lié au Parking Virtuel)"
        rules={rules.stockRules}
        type="stock"
        conditionOptions={["Surstock", "Sousstock"]}
        onAdd={(rule) => addRule("stockRules", rule)}
        onUpdate={(id, rule) => updateRule("stockRules", id, rule)}
        onDelete={(id) => deleteRule("stockRules", id)}
        onToggle={(id, enabled) => toggleEnabled("stockRules", id, enabled)}
      />
    </div>
  );
};

export default PricingRulesManager;
