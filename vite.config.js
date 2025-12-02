// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/cronograma/",            // 🔥 app servindo em /cronograma/ no portal
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
