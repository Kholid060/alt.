import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  publicDir: './src/style',
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: true,
  minify: true,
  clean: true,
  external: ['react', '@radix-ui/react-primitive'],
  ...options,
}));
