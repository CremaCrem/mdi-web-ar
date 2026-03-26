import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages repo path; change if your repo name differs.
const githubPagesBase = '/mdi-web-ar/'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? githubPagesBase : '/',
  plugins: [react(), tailwindcss()],
}))
