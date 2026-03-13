/** @type {import('tailwindcss').Config} */
export default {
  // 1. Adicionamos .ts e .tsx para o Tailwind enxergar seus arquivos modernos
  content: [
    './index.html', 
    './src/**/*.{js,jsx,ts,tsx}' 
  ],
  // 2. REMOVEMOS o preflight: false para o sistema ter cara de software atual
  theme: {
    extend: {
      // Aqui o Trae pode adicionar cores personalizadas do AUDITTUS depois
    },
  },
  plugins: [],
}