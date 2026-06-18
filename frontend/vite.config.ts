import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9415,
    proxy: {
      '/api': {
        target: 'http://localhost:9416',
        changeOrigin: true
      }
    }
  }
})
