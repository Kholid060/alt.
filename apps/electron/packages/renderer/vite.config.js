/* eslint-env node */

import { chrome } from '../../.electron-vendors.cache.json';
import react from '@vitejs/plugin-react';
import { join } from 'node:path';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      '#packages': join(PACKAGE_ROOT, '../'),
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '#common': join(PACKAGE_ROOT, '../common'),
    },
  },
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    rollupOptions: {
      input: {
        main: join(__dirname, 'index.html'),
        dashboard: join(__dirname, 'dashboard.html'),
      },
      output: {
        assetFileNames: '[name].[ext]',
      },
      external: ['**/*.dev.tsx'],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react/jsx-runtime', 'lucide-react'],
  },
  plugins: [
    react(),
    {
      name: 'middleware',
      apply: 'serve',
      configureServer(viteDevServer) {
        return () => {
          viteDevServer.middlewares.use(async (req, _res, next) => {
            if (req.originalUrl.startsWith('/dashboard')) {
              req.url = '/dashboard.html';
            }

            next();
          });
        };
      },
    },
  ],
};

export default config;
