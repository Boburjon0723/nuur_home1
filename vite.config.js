import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 3000 band bo‘lsa keyingi bo‘sh port (masalan 3001) — xato bermaydi
  server: { port: 3000, strictPort: false },
});
