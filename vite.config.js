import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes the build work both on GitHub Pages project sites
// (username.github.io/repo/) and locally, without hardcoding the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'painel-jb-2026.html')
      }
    }
  }
});
