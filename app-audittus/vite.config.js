import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // <-- A linha que faz o Electron encontrar a tela
  build: {
    chunkSizeWarningLimit: 3000, // Silencia o aviso amarelo
  }
})