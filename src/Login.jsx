import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log("signInWithPassword result:", result);
      if (result.error) {
        setError(result.error.message || "Erreur lors de la connexion");
      } else if (result.data?.session) {
        console.log("✅ Login réussi, session:", result.data.session);
        // Inform parent to set session so app can render immediately
        if (typeof onLogin === "function") {
          onLogin(result.data.session);
        } else {
          // Fallback to reload if parent didn't provide handler
          window.location.reload();
        }
      } else {
        setError("Connexion impossible — réponse inattendue du serveur");
      }
    } catch (err) {
      console.error("Exception during signIn:", err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 50 }}>
      <h2>Connexion Mint-Bikes</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10, width: 250 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
