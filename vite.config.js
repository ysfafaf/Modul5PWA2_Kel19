import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Bore & Barrel',
        short_name: 'Bore & Barrel',
        description: 'A small armory — pistols, rifles, and shotguns.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f2f4f5',
        theme_color: '#f2f4f5',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // ---------------------------------------------------------------------------
        // Runtime caching — API calls ke Supabase
        // Strategi StaleWhileRevalidate:
        //   1. Kalau ada di cache → langsung pakai (terlihat di Network tab)
        //   2. Sekaligus fetch network baru di background untuk update cache
        // Cache ini akan muncul di:
        //   - Network tab  → size kolom "(ServiceWorker)"
        //   - Application → Cache Storage → "query-cache"
        // ---------------------------------------------------------------------------
        runtimeCaching: [
          {
            // Tangkap semua request ke Supabase REST API (tabel-tabel guns, dll)
            urlPattern: ({ url }) =>
              url.hostname.includes('supabase.co') &&
              url.pathname.startsWith('/rest/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'query-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60, // 1 menit — sama dengan TTL in-memory sebelumnya
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Tangkap request storage/gambar dari Supabase
            urlPattern: ({ url }) =>
              url.hostname.includes('supabase.co') &&
              url.pathname.startsWith('/storage/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 jam
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
