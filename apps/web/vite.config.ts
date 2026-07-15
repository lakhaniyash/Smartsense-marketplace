import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    // Route-based code splitting already emits a per-page chunk (React Router
    // lazy() in app/router). This splits the remaining vendor bundle by
    // library so a dependency bump only busts that vendor's cache, not the
    // whole ~790 kB blob, and no single chunk dominates first paint (SM-156).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) {
            return 'react-vendor'
          }
          if (/node_modules\/(@apollo|graphql|@wry|optimism|zen-observable)/.test(id)) {
            return 'apollo-vendor'
          }
          if (id.includes('keycloak-js')) return 'keycloak-vendor'
          if (/node_modules\/(recharts|d3-|victory|internmap)/.test(id)) return 'chart-vendor'
          return 'vendor'
        },
      },
    },
  },
})
