import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, /api se redirige a la API de Express (server/index.js)
    proxy: {
      '/api': `http://localhost:${process.env.API_PORT ?? 3001}`,
    },
    watch: {
      ignored: ['**/server/data/**', '**/server/storage/**'],
    },
  },
})
