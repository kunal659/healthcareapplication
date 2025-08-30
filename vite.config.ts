import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses, including LAN and public addresses.
    allowedHosts: [
      '0416ac77a02c.ngrok-free.app',
    ],
  },
})