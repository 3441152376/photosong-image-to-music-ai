import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/suno': {
        target: 'https://gpt-best.apifox.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/suno/, '/suno'),
        headers: {
          'Referer': 'https://gpt-best.apifox.cn'
        }
      }
    }
  }
})
