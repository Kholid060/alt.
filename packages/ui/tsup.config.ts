import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => [
  {
    splitting: true,
    treeshake: !options.watch,
    env: {
      NODE_ENV: 'production',
    },
    publicDir: './public',
    entry: ['./src/**/!(index).ts?(x)'],
    format: ['esm'],
    dts: true,
    minify: !options.watch,
    external: ['react', '@radix-ui/react-primitive'],
    esbuildOptions(esbuildOpts) {
      esbuildOpts.outbase = './src';
    },
    ...options,
  },
  {
    sourcemap: true,
    entry: ['./src/index.ts'],
    bundle: false,
    dts: true,
    format: ['esm'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.outbase = './src';
    },
  },
]);
