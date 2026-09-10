// Tela exibida no lugar do site/painel quando as variáveis de ambiente do
// Supabase não estão definidas no deploy — evita a "tela preta" silenciosa.
import { supabaseConfigError } from './supabase.js';
import { PHONE } from './cart.js';

export function ConfigErrorScreen({ message = supabaseConfigError }) {
  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <section className="admin-login-card">
        <h2>⚠️ Cardápio indisponível</h2>
        <p className="form-error" role="alert">{message}</p>
        <p>
          Se você é cliente, faça seu pedido pelo WhatsApp:{' '}
          <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">
            falar com a JB Marmitas
          </a>
          .
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Responsável pelo site: defina <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> nas variáveis de ambiente do
          deploy (Vercel → Settings → Environment Variables) e faça um novo deploy.
        </p>
      </section>
    </main>
  );
}
