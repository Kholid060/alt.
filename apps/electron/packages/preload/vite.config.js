import { chrome } from '../../.electron-vendors.cache.json';
import { join } from 'node:path';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
const IS_DEV = process.env.MODE === 'development';

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  ssr: {
    noExternal: ['eventemitter3', 'nanoid'],
  },
  resolve: {
    alias: {
      '#common': join(PACKAGE_ROOT, '../common'),
    },
  },
  build: {
    ssr: true,
    sourcemap: IS_DEV ? 'inline' : false,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: IS_DEV,
    lib: {
      entry: ['src/index.ts'],
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        // ESM preload scripts must have the .mjs extension
        // https://www.electronjs.org/docs/latest/tutorial/esm#esm-preload-scripts-must-have-the-mjs-extension
        entryFileNames: '[name].mjs',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
};

export default config;
