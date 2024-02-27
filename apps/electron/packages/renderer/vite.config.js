/* eslint-env node */

import { chrome } from '../../.electron-vendors.cache.json';
import react from '@vitejs/plugin-react';
import { join, extname } from 'node:path';

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
  base: '',
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
        main: join(PACKAGE_ROOT, 'index.html'),
      },
      output: {
        assetFileNames: `[name].[ext]`
      }
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
  plugins: [
    react(),
  ],
};

export default config;
