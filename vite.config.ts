import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const HOST_IP = '172.16.1.32'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: HOST_IP,
    port: 5173,
  },
  preview: {
    host: HOST_IP,
    port: 4173,
  },
})
