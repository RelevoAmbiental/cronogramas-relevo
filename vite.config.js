// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 🚀 Caminho base correto para rodar dentro do portal em /cronograma/
  base: "/cronograma/",

  build: {
    outDir: "dist",
    emptyOutDir: true,

    // Isso evita problemas de chunks quebrados no GitHub Pages
    assetsDir: "assets",
  },

  // Importante quando usado atrás de caminhos relativos
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
