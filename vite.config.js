import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// Variáveis do Supabase injetadas em tempo de build (import.meta.env).*
// Sem elas o bundle sai apontando para um placeholder e o cardápio quebra
// no ar — então o build falha rápido com uma mensagem clara.
const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];

export default defineConfig(({ command, mode }) => {
  // loadEnv lê o .env do projeto; process.env cobre os secrets da CI.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const missing = requiredEnv.filter((name) => !env[name]);

  if (missing.length && command === 'build') {
    throw new Error(
      `[jb-marmitas] Build sem ${missing.join(' e ')}: o cardápio quebraria no deploy.\n` +
        'Defina os secrets em GitHub > Settings > Secrets and variables > Actions\n' +
        '(Repository secrets) e rode o workflow de deploy novamente.'
    );
  }

  if (missing.length) {
    console.warn(
      `[jb-marmitas] Sem ${missing.join(' e ')} — o cardápio não vai carregar. ` +
        'Copie .env.example para .env e preencha com os dados do Supabase.'
    );
  }

  return {
    base: './',
    plugins: [react(), svgr(), tsconfigPaths()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'painel-jb-2026.html')
        }
      }
    }
  };
});
