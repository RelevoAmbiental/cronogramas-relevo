import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/cronograma/", // 🔥 ESSENCIAL para GitHub Pages
  plugins: [react()],
  build: {
    outDir: "dist"
  }
});
