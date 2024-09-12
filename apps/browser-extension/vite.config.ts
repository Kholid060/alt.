/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';
import { getCacheInvalidationKey, getPlugins } from './utils/vite';

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');
const pagesDir = resolve(srcDir, 'pages');

const isDev = process.env.__DEV__ === 'true';
const isProduction = !isDev;

const input: Record<string, string> = {
  'content-iframe': resolve(pagesDir, 'content', 'iframe', 'index.ts'),
  background: resolve(pagesDir, 'background', 'index.ts'),
  'content-script': resolve(pagesDir, 'content', 'index.ts'),
};
if (isDev) {
  input.experiment = resolve(pagesDir, 'content', 'experiment/index.ts');
}

export default defineConfig({
  resolve: {
    alias: {
      '@root': rootDir,
      '/@/': srcDir,
      '@assets': resolve(srcDir, 'assets'),
      '@pages': pagesDir,
    },
  },
  plugins: [...getPlugins(isDev), react()],
  publicDir: resolve(rootDir, 'public'),
  define: {
    __IS_FIREFOX__: Boolean(process.env.__FIREFOX__),
  },
  build: {
    outDir: resolve(rootDir, 'dist'),
    /** Can slow down build speed. */
    // sourcemap: isDev,
    minify: isProduction,
    modulePreload: false,
    reportCompressedSize: isProduction,
    emptyOutDir: !isDev,
    rollupOptions: {
      input,
      output: {
        entryFileNames: 'src/pages/[name]/index.js',
        chunkFileNames: isDev
          ? 'assets/js/[name].js'
          : 'assets/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const { name } = path.parse(assetInfo.name as string);
          const assetFileName =
            name === 'contentStyle'
              ? `${name}${getCacheInvalidationKey()}`
              : name;
          return `assets/[ext]/${assetFileName}.chunk.[ext]`;
        },
      },
    },
  },
});
