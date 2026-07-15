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
        short_name: "Lucid",
        description: "A homebase for the Lucid sound series.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#000000",
        theme_color: "#000000"
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        // /admin and /api live on a completely different server (the API
        // project, reached via the vercel.json rewrite) — without this, the
        // service worker's default navigation fallback intercepts them and
        // serves the cached SPA shell instead of ever hitting the network.
        navigateFallbackDenylist: [/^\/admin/, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      },
      "/admin": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  }
});

