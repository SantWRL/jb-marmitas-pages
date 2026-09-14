import { useState } from "react";
import { supabase } from "../lib/supabase.js";

// Modal de conta do cliente: apenas login (o cadastro foi desativado —
// por enquanto só o administrador acessa com conta Supabase).
export default function CustomerAuth({ onClose, onSignedIn }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    setError("");
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      onSignedIn();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-modal">
      <div className="auth-modal-backdrop" onClick={onClose} />
      <div className="auth-dialog" role="dialog" aria-label="Sua conta JB">
        <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
        <h2>Sua conta JB</h2>

        <form onSubmit={handleSubmit} className="auth-tab-content">
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" required placeholder="voce@email.com" autoComplete="email" />
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              placeholder="Sua senha"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="submit-auth" disabled={busy}>
            {busy ? "Aguarde..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
