import { useState } from "react";
import { supabase } from "../lib/supabase.js";

// Modal de conta do cliente: login e cadastro via Supabase Auth.
export default function CustomerAuth({ onClose, onSignedIn }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim();
    const confirm = String(data.get("confirm") || "");

    setError("");
    setMessage("");

    if (mode === "cadastro" && password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "cadastro") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (signUpError) throw signUpError;
        setMessage("Conta criada! Verifique seu email para confirmar o cadastro.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onSignedIn();
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível continuar.");
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

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "cadastro" ? "active" : ""}`}
            onClick={() => setMode("cadastro")}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-tab-content">
          {mode === "cadastro" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Nome completo</label>
              <input id="auth-name" name="name" type="text" required placeholder="Seu nome" />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" required placeholder="voce@email.com" />
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
          {mode === "cadastro" && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirmar senha</label>
              <input
                id="auth-confirm"
                name="confirm"
                type="password"
                required
                minLength={6}
                placeholder="Repita a senha"
              />
            </div>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="auth-error" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
              {message}
            </p>
          )}

          <button type="submit" className="submit-auth" disabled={busy}>
            {busy ? "Aguarde..." : mode === "cadastro" ? "Criar minha conta" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
