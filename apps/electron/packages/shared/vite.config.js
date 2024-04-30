import { join } from 'node:path';
import { builtinModules } from 'node:module';
import { chrome } from '../../.electron-vendors.cache.json';

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
    lib: {
      entry: {
        main: join(__dirname, '/src/main.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
      external: [...builtinModules, 'electron'].flatMap((item) => [
        item,
        `node:${item}`,
      ]),
    },
    emptyOutDir: true,
  },
};

export default config;
