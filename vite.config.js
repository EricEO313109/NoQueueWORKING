import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: mode === 'development' ? {
    port: 5173,
    // Only for `vercel dev` — not used in production build
    proxy: process.env.VERCEL_DEV_URL ? {
      '/api': { target: process.env.VERCEL_DEV_URL, changeOrigin: true },
    } : undefined,
  } : undefined,
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
