import { join } from 'node:path';
import { builtinModules } from 'node:module';
import { node } from '../../.electron-vendors.cache.json';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

const builtinNodeModules = builtinModules.flatMap((item) => [
  item,
  `node:${item}`,
]);
const IS_DEV = process.env.MODE === 'development';

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
    minify: !IS_DEV,
    lib: {
      entry: {
        main: join(__dirname, '/src/main.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].cjs',
      },
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }

        warn(warning);
      },
      treeshake: IS_DEV ? undefined : 'smallest',
      external: [
        ...builtinNodeModules,
        'electron',
        'pino',
        'quickjs-emscripten',
      ],
    },
    emptyOutDir: true,
  },
  plugins: [],
};

export default config;
