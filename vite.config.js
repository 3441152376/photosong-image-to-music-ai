import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Photo Song',
        short_name: 'PhotoSong',
        description: 'Transform your photos into unique musical pieces',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: {
      overlay: false
    },
    port: 5173,
    host: true,
    fs: {
      allow: ['..']
    }
  },
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 2000,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'vue',
            'vue-router',
            'leancloud-storage'
          ],
          'element': [
            'element-plus',
            'element-plus/es'
          ],
          'icons': [
            '@heroicons/vue',
            '@heroicons/vue/24/outline'
          ],
          'utils': [
            'lodash-es',
            'axios',
            'dayjs'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['fs', 'path']
  },
  define: {
    'process.env': process.env
  }
})
