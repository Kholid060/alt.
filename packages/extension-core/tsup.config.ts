import { defineConfig, Options } from 'tsup';
import fs from 'fs-extra';
import path from 'path';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: {
    cli: './src/cli/index.ts',
    index: './src/client/index.ts',
    extensionApi: './types/extension-api.d.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
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
  async onSuccess() {
    await fs.copyFile(
      path.join(__dirname, 'src/client/extension-api.ts'),
      path.join(__dirname, 'dist/extension-api.d.ts'),
    );
  },
  ...options,
}));
