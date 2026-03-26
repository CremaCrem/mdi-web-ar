import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel deployment at the site root.
// This ensures Vite generates URLs like /assets/... and Mind-AR uses the correct BASE_URL.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
