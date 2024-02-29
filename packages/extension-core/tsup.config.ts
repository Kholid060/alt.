import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: {
    cli: './src/cli/index.ts',
    index: './src/client/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    resolve: ['./types/extension-api.d.ts'],
    entry: {
      index: './src/client/index.ts',
    },
  },
  external: [
    'tsup',
    'fs-extra',
    'zod-validation-error',
    'commander',
    'vite',
    'vite-plugin-resolve',
    'glob',
  ],
  minify: true,
  clean: false,
  ...options,
}));
