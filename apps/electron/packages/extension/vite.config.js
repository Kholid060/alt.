/* eslint-env node */

import { chrome } from '../../.electron-vendors.cache.json';
import react from '@vitejs/plugin-react';
import { join } from 'node:path';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
const MONOREPO_ROOT = join(PROJECT_ROOT, '../..');

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
  define: {
    'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
  },
  build: {
    sourcemap: false,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom'],
      output: {
        entryFileNames: '[name].js',
        paths: {
          react: './react.js',
          'react-dom': './react-dom.js',
          'react/jsx-runtime': './react-runtime.js',
        },
      },
    },
    lib: {
      entry: {
        index: './src/main.tsx',
        react: join(
          MONOREPO_ROOT,
          'node_modules',
          'react',
          'cjs',
          'react.production.min.js',
        ),
        'react-runtime': join(
          MONOREPO_ROOT,
          'node_modules',
          'react',
          'cjs',
          'react-jsx-runtime.production.min.js',
        ),
        'react-dom': join(
          MONOREPO_ROOT,
          'node_modules',
          'react-dom',
          'cjs',
          'react-dom.production.min.js',
        ),
      },
      formats: ['es'],
    },
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
  plugins: [react()],
};

export default config;
