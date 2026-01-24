import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function SizeTargetsTable() {
  const [sizeTargets, setSizeTargets] = useState([]);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(false);

  // Charger les tailles et objectifs depuis la table pv_size_targets
  useEffect(() => {
    async function fetchSizeTargets() {
      const { data, error } = await supabase
        .from("pv_size_targets")
        .select("size, target_pct")
        .order("size");
      if (!error && data) {
        setSizeTargets(data);
      }
    }
    fetchSizeTargets();
  }, []);

  // Sauvegarder la modification d'un objectif
  const handleSave = async (size, pct) => {
    setSaving(true);
    const { error } = await supabase
      .from("pv_size_targets")
      .upsert({
        size,
        target_pct: Math.round(pct * 100),
        updated_at: new Date().toISOString(),
      }, { onConflict: "size" });
    if (!error) {
      setEditing((prev) => ({ ...prev, [size]: undefined }));
      // Recharger la table
      const { data } = await supabase
        .from("pv_size_targets")
        .select("size, target_pct")
        .order("size");
      setSizeTargets(data);
    }
    setSaving(false);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontWeight: 800, fontSize: 18 }}>Objectifs par taille</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Taille</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>% Objectif</th>
            <th style={{ padding: "8px 12px" }}></th>
          </tr>
        </thead>
        <tbody>
          {sizeTargets.map(({ size, target_pct }) => (
            <tr key={size}>
              <td style={{ padding: "8px 12px" }}>{size}</td>
              <td style={{ padding: "8px 12px" }}>
                {editing[size] !== undefined ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editing[size]}
                    onChange={e => setEditing({ ...editing, [size]: e.target.value })}
                    style={{ width: 60, padding: "4px 8px" }}
                  />
                ) : (
                  `${target_pct} %`
                )}
              </td>
              <td style={{ padding: "8px 12px" }}>
                {editing[size] !== undefined ? (
                  <button
                    onClick={() => handleSave(size, editing[size] / 100)}
                    disabled={saving}
                    style={{ padding: "4px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", fontWeight: 700 }}
                  >
                    Sauvegarder
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing({ ...editing, [size]: target_pct })}
                    style={{ padding: "4px 12px", borderRadius: 6, background: "#e5e7eb", color: "#111", fontWeight: 700 }}
                  >
                    Modifier
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
