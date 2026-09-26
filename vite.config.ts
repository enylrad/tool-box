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
        // The OCR runtime (Tesseract.js ~17 MB and pdf.js ~5 MB, copied by
        // scripts/copy-ocr-assets.mjs) is too large to precache for every
        // visitor. It is cached the first time the OCR tool uses it instead, so
        // it keeps working offline after that.
        globIgnores: ['tesseract/**', 'pdfjs/**'],
        runtimeCaching: [
          {
            urlPattern: new RegExp(`${BASE_PATH}(tesseract|pdfjs)/`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-assets',
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // html2pdf.js (~930 kB) is only loaded on demand when exporting a PDF.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
