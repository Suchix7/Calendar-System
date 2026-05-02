import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "vite.svg"],
      manifest: {
        name: "Church Calendar",
        short_name: "Calendar",
        description: "Church Calendar & Event System",
        theme_color: "#dc2626",
        background_color: "#FDFCFB",
        display: "standalone",
        icons: [
          {
            src: "logo.png",
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/events'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-events-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
  ],
});
