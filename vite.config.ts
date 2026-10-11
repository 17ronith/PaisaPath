import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173 },
  build: { target: 'es2022', sourcemap: false },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Learning Money by Living It',
        short_name: 'Money Life',
        description: 'A pixel-art life simulation that teaches financial literacy.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1b1b2f',
        theme_color: '#1b1b2f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json,woff2,wav,mp3}'],
        // Voice-over clips (~400 small MP3s) are cached as they play, not downloaded at install.
        globIgnores: ['**/assets/voice/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ngo\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
