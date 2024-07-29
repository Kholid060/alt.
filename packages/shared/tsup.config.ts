import { defineConfig } from 'tsup';

export default defineConfig({
  splitting: true,
  env: {
    NODE_ENV: 'production',
  },
  outDir: 'dist',
  clean: true,
  esbuildOptions(options) {
    options.outbase = './src';
  },
  dts: true,
  sourcemap: false,
  treeshake: true,
  entry: ['src/**/*@(ts|tsx)'],
  minify: true,
  format: ['cjs', 'esm'],
});
