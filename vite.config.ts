import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-32.png', 'og-image.png'],
      manifest: {
        name: 'Tidyup — snap, list, sell',
        short_name: 'Tidyup',
        description: 'Snap a photo. We sell it for you. AI writes your listing and posts it across eBay, Facebook Marketplace, OfferUp, Nextdoor, and Craigslist.',
        theme_color: '#0f766e',
        background_color: '#fafaf9',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        start_url: '/?utm_source=pwa',
        scope: '/',
        lang: 'en',
        categories: ['shopping', 'productivity', 'lifestyle'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ],
        shortcuts: [
          {
            name: 'Sell something new',
            short_name: 'Sell',
            description: 'Snap a photo and let Tidyup draft the listing',
            url: '/?action=new&utm_source=pwa_shortcut',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'My listings',
            short_name: 'Listings',
            description: 'See everything you have posted',
            url: '/?view=listings&utm_source=pwa_shortcut',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Connections',
            short_name: 'Connect',
            description: 'Manage your marketplace connections',
            url: '/?view=connections&utm_source=pwa_shortcut',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        screenshots: [
          {
            src: '/og-image.png',
            sizes: '1200x630',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Tidyup — snap a photo, we sell it for you'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html'
      }
    })
  ],
  server: {
    port: 5173
  }
});
