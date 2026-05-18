import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico'],
      manifest: {
        name: 'Tidyup',
        short_name: 'Tidyup',
        description: 'Snap a photo. We sell it for you.',
        theme_color: '#0f766e',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ],
        shortcuts: [
          { name: 'New Listing', short_name: 'Sell', url: '/?action=new', icons: [{ src: '/icon.svg', sizes: 'any' }] },
          { name: 'My Listings', short_name: 'Listings', url: '/?view=listings', icons: [{ src: '/icon.svg', sizes: 'any' }] },
          { name: 'Inbox', short_name: 'Inbox', url: '/?view=inbox', icons: [{ src: '/icon.svg', sizes: 'any' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],
  server: {
    port: 5173
  }
});
