import { extname } from 'path';
import { globbySync } from 'globby';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const entries = {
  ...Object.fromEntries(
    globbySync(['src/**/*.{tsx,ts}']).map(
      (file) => [
        file.substring('/src'.length, file.length).replace(extname(file), ''),
        file,
      ],
    ),
  ),
  index: './src/index.ts',
};


export default defineConfig({
  mode: process.env.MODE ?? 'production',
  build: {
    outDir: 'dist',
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom', '@repo/ui'],
      output: {
        entryFileNames: '[name].js',
        sourcemapExcludeSources: true,
      },
    },
    emptyOutDir: true,
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dts({ include: Object.values(entries) }),
  ],
});
