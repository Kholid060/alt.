import { defineConfig, Options } from 'tsup';
import buildExtensionAPI from './scripts/ext-api';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: {
    index: './src/index.ts',
    cli: './scripts/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    resolve: ['./types/extension-api.d.ts'],
    entry: {
      index: './src/index.ts',
    },
  },
  external: [
    'tsup',
    'fs-extra',
    'zod-validation-error',
    'commander',
    'vite',
    'vite-plugin-resolve',
  ],
  minify: true,
  clean: true,
  async onSuccess() {
    buildExtensionAPI();
  },
  ...options,
}));
