import { join } from 'node:path';
import { builtinModules } from 'node:module';
import { node } from '../../.electron-vendors.cache.json';

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
  base: './',
  ssr: {
    target: 'node',
  },
  resolve: {
    alias: {
      '#packages': join(PACKAGE_ROOT, '../'),
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '#common': join(PACKAGE_ROOT, '../common'),
      'unicorn-magic': join(PACKAGE_ROOT, 'utils/unicorn-magic.js'),
    },
  },
  define: {
    'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
  },
  build: {
    sourcemap: false,
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].cjs',
      },
      external: [...builtinModules, 'electron'].flatMap((item) => [
        item,
        `node:${item}`,
      ]),
    },
    emptyOutDir: true,
  },
  plugins: [],
};

export default config;
