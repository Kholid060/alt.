import { node } from '../../.electron-vendors.cache.json';
import { join, resolve } from 'node:path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { swcPlugin } from '../../plugins/swc';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import pkg from '../../package.json';

import { envConfig } from './src/common/config/env.config';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

const IS_DEV = process.env.MODE === 'development';

if (!IS_DEV) dotenv.config({ path: resolve(PROJECT_ROOT, '.env') });

const config = defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  define: IS_DEV ? {} : { 'process.env': envConfig() },
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '#common': join(PACKAGE_ROOT, '../common'),
      '#packages': join(PACKAGE_ROOT, '../'),
    },
  },
  ssr: {
    noExternal: IS_DEV
      ? []
      : Object.keys(pkg.devDependencies).concat(['lodash']),
  },
  build: {
    ssr: true,
    sourcemap: IS_DEV,
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: !IS_DEV,
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
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }

        warn(warning);
      },
      external: ['@altdot/native', 'original-fs', 'electron'],
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
});

export default config;
