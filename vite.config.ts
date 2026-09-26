/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The site is served from https://<user>.github.io/tool-box/, so every asset
// URL must be prefixed with the repository name.
const BASE_PATH = '/tool-box/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tool Box',
        short_name: 'Tool Box',
        description: 'Offline-first developer tools that run entirely in your browser.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // html2pdf.js (with jsPDF and html2canvas) is large; raise the limit so
        // it is precached and PDF export keeps working offline.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // The OCR runtime (~17 MB, copied by scripts/copy-tesseract-assets.mjs)
        // is too large to precache for every visitor. It is cached the first
        // time the OCR tool uses it instead, so it keeps working offline after that.
        globIgnores: ['tesseract/**'],
        runtimeCaching: [
          {
            urlPattern: new RegExp(`${BASE_PATH}tesseract/`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-assets',
              cacheableResponse: { statuses: [200] },
            },
          },
          // The ffmpeg.wasm core (~31 MB) used by the video tool is not precached
          // either (.wasm is not in globPatterns); it is cached on first use.
          {
            urlPattern: new RegExp(`${BASE_PATH}assets/ffmpeg-core-[^/]*\\.wasm$`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ffmpeg-core',
              expiration: { maxEntries: 2 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  // ffmpeg.wasm starts its own module worker, which Vite must bundle as-is.
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'],
  },
  worker: {
    format: 'es',
  },
  build: {
    // html2pdf.js (~930 kB) is only loaded on demand when exporting a PDF.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
