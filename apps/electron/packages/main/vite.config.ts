import { node } from '../../.electron-vendors.cache.json';
import { join } from 'node:path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import swc from 'unplugin-swc';

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
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '#common': join(PACKAGE_ROOT, '../common'),
      '#packages': join(PACKAGE_ROOT, '../'),
    },
  },
  build: {
    ssr: true,
    sourcemap: 'inline',
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
      external: ['@alt-dot/native', 'original-fs'],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  esbuild: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        keepClassNames: true,
        target: 'es2022',
        minify: {
          format: {
            comments: false,
          },
        },
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/db/migrations',
          dest: '',
        },
      ],
    }),
  ],
};

export default config;
