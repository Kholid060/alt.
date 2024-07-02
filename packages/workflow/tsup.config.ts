import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => [
  {
    sourcemap: Boolean(options.watch),
    entry: ['./src/index.ts'],
    dts: true,
    clean: true,
    format: ['esm'],
    outDir: 'dist',
    minify: !options.watch,
    esbuildOptions(options) {
      options.outbase = './src';
    },
  },
]);
