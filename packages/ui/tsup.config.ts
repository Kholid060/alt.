import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => [
  {
    treeshake: true,
    splitting: true,
    env: {
      NODE_ENV: 'production',
    },
    publicDir: './public',
    entry: ['./src/**/!(index).ts?(x)'],
    format: ['esm'],
    dts: true,
    minify: true,
    external: ['react', '@radix-ui/react-primitive'],
    esbuildOptions(options) {
      options.outbase = './src';
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
