import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => [
  {
    treeshake: true,
    sourcemap: Boolean(options.watch),
    entry: ['./src/**/*@(ts|tsx)'],
    dts: true,
    clean: true,
    format: ['esm'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.outbase = './src';
    },
  },
]);
