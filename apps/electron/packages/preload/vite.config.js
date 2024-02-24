import { chrome } from '../../.electron-vendors.cache.json';
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
  ssr: {
    noExternal: ['dot-prop']
  },
  build: {
    ssr: true,
    sourcemap: 'inline',
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    resolve: {
      alias: {
        '#common': join(PACKAGE_ROOT, '../common'),
      },
    },
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
      external: []
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
};

export default config;
