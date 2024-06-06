import { defineConfig, Options } from 'tsup';
import fs from 'fs-extra';
import path from 'path';

export default defineConfig((options: Options) => [
  {
    treeshake: false,
    splitting: false,
    dts: true,
    clean: true,
    entry: {
      index: './src/binding/index.ts',
    },
    format: ['esm'],
    minify: true,
    async onSuccess() {
      await fs.copyFile(
        path.join(__dirname, './index.node'),
        path.join(__dirname, 'dist', './index.node'),
      );
    },
    ...options,
  },
]);
