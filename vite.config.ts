import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icons/*.png', 'THIRD_PARTY_NOTICES.txt'],
    manifest: {
      id: './', name: 'BOKI STUDY 14｜副業のススメ', short_name: 'BOKI STUDY',
      description: '日商簿記3級の仕訳・帳簿・決算をつなぐ、非公式の重点学習教材。',
      lang: 'ja', start_url: './', scope: './', display: 'standalone',
      theme_color: '#172f3e', background_color: '#f4f7f7',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      clientsClaim: true, cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,json,png,webmanifest,txt}'],
      navigateFallback: 'index.html'
    }
  })],
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/node_modules/zod/')) return 'validation'
    if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
  } } } },
  test: {
    environment: 'jsdom', setupFiles: fileURLToPath(new URL('./src/test/setup.ts', import.meta.url)),
    include: ['src/**/*.test.{ts,tsx}'], restoreMocks: true
  }
})
