import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Lucid Sound Domain",
        short_name: "Lucid Sound",
        start_url: "/",
        display: "standalone",
        background_color: "#0b1220",
        theme_color: "#0f172a"
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  }
});

