import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev the browser talks to the proxy container; API_TARGET is only used when running `npm run dev` outside Docker.
const target = process.env.API_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  // Bootstrap 5 still uses Sass @import and the old colour functions.
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'] },
    },
  },
  // The repo keeps one .env for every app (see .env.example); Vite only exposes
  // VITE_* values, so pointing at the repo root is safe and keeps the mock switch
  // in the same file as the API settings.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': { target, xfwd: true },
      '/api-docs': { target, xfwd: true },
      '/socket.io': { target, ws: true, xfwd: true },
    },
  },
})
