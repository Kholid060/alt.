import { defineConfig } from 'tsup';

export default defineConfig([
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
    external: ['react', 'react/jsx-runtime', 'react-dom'],
    esbuildOptions(options) {
      options.outbase = './src';
    },
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
