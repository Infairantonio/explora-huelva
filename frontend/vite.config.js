// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // escucha en 0.0.0.0 dentro del contenedor
    port: 5173,
    strictPort: true,    // no cambies de puerto
    watch: {
      usePolling: true,  // necesario en Docker/Windows
      interval: 200,
    },
    hmr: {
      clientPort: 5173,  // el puerto expuesto en tu host
    },
  },
})
