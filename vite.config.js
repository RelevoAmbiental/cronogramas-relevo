import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ------------------------------------------------------
//  VITE CONFIG — CRONOGRAMAS RELEVO
//  Corrige paths quebrados ao rodar em:
//  https://portal.relevo.eco.br/cronograma/
// ------------------------------------------------------

export default defineConfig({
  plugins: [react()],

  // 🔥 ESSENCIAL — Corrige todos os assets quebrados
  base: '/cronograma/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Garante que o Vite não gere paths absolutos
    assetsInlineLimit: 0,

    rollupOptions: {
      output: {
        // Usa paths relativos — necessário dentro do portal
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
  },
});
