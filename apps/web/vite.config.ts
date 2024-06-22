import { defineConfig } from 'vite';
import { join } from 'node:path';
import viteReact from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@/': join(__dirname, 'src') + '/',
    },
  },
  plugins: [TanStackRouterVite(), viteReact()],
});
