/* eslint-env node */

import { chrome } from '../../.electron-vendors.cache.json';
import react from '@vitejs/plugin-react';
import { join } from 'node:path';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

const NODE_MODULE_PATH = join(PROJECT_ROOT, 'node_modules');
const REACT_MODULE_DIR = join(NODE_MODULE_PATH, 'react', 'cjs');
const REACT_DOM_MODULE_DIR = join(NODE_MODULE_PATH, 'react-dom', 'cjs');

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
          react: '/@preload/react.js',
          'react-dom': '/@preload/react-dom.js',
          'react/jsx-runtime': '/@preload/react-runtime.js',
          'react/react-jsx-dev-runtime.development':
            '/@preload/react-runtime.dev.js',
        },
      },
    },
    lib: {
      entry: {
        index: './src/main.tsx',
        react: join(REACT_MODULE_DIR, 'react.production.min.js'),
        'react.dev': join(REACT_MODULE_DIR, 'react.development.js'),
        'react-runtime.dev': join(
          REACT_MODULE_DIR,
          'react-jsx-dev-runtime.development',
        ),
        'react-runtime': join(
          REACT_MODULE_DIR,
          'react-jsx-runtime.production.min.js',
        ),
        'react-dom': join(REACT_DOM_MODULE_DIR, 'react-dom.production.min.js'),
        'react-dom.dev': join(REACT_DOM_MODULE_DIR, 'react-dom.development.js'),
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
