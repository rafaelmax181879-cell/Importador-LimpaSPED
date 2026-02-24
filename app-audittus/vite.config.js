import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000, // Aumenta o limite de tolerância para 3MB e cala o aviso
  }
})