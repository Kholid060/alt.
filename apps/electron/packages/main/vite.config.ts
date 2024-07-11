import { node } from '../../.electron-vendors.cache.json';
import { join } from 'node:path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { swcPlugin } from '../../plugins/swc';
import { UserConfig } from 'vite';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

const config: UserConfig = {
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
    sourcemap: process.env.MODE === 'development',
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
      treeshake: 'smallest',
      external: ['@altdot/native', 'original-fs'],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  esbuild: false,
  plugins: [
    swcPlugin(),
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
