import { defineConfig } from 'vite';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@/': join(__dirname, 'src') + '/',
    },
  },
  plugins: [react()],
});
