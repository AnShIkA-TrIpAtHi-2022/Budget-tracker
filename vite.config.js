import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },
  build: {
    sourcemap: true
  }
})
