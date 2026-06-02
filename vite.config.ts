import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Dev: evita bloqueo SSL del certificado self-hosted (nombre incorrecto en el cert)
    proxy:
      mode === "development"
        ? {
            "/rest": {
              target: "https://supabase-bepelican.duckdns.org",
              changeOrigin: true,
              secure: false,
            },
            "/auth": {
              target: "https://supabase-bepelican.duckdns.org",
              changeOrigin: true,
              secure: false,
            },
            "/storage": {
              target: "https://supabase-bepelican.duckdns.org",
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("pdfjs-dist")) return "pdfjs";
          if (id.includes("recharts")) return "recharts";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("react-router")) return "router";
          if (id.includes("react-dom") || id.includes("/react/")) return "react";
        },
      },
    },
  },
}));
