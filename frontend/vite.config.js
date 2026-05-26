import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // Lắng nghe trên 0.0.0.0 → cho phép điện thoại cùng wifi truy cập
    port: 5173,
  },
})
