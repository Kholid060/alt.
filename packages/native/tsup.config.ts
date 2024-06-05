import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  dts: true,
  clean: true,
  entry: {
    index: './src/lib/index.ts',
  },
  format: ['esm'],
  external: [],
  minify: true,
  ...options,
}));
