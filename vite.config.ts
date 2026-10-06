import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // Web (GitHub Pages) usa o subcaminho; o app Android usa caminhos relativos (VITE_BASE=./)
  base: process.env.VITE_BASE ?? "/sintel-visitas-sindicais/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
