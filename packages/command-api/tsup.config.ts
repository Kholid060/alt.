import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: {
    index: './src/index.ts',
    cli: './scripts/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    entry: {
      index: './src/index.ts',
    },
  },
  external: ['tsup', 'fs-extra', 'zod-validation-error', 'commander'],
  minify: true,
  clean: true,
  async onSuccess() {
    await new Promise((r) => setTimeout(r, 1500));
    await import('./scripts/ext-api');
  },
  ...options,
}));
