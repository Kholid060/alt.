import { defineConfig, Options } from 'tsup';
import path from 'path';
import fs from 'fs-extra';

const baseConfig: Options = {
  splitting: true,
  env: {
    NODE_ENV: 'production',
  },
  publicDir: './public',
  entry: {
    cli: './src/cli/index.ts',
  },
  outDir: 'dist',
  noExternal: ['@altdot/shared'],
  external: ['vite', 'commander', 'react'],
  clean: false,
  esbuildOptions(options) {
    options.outbase = './src';
  },
};

export default defineConfig([
  {
    ...baseConfig,
    minify: true,
    outDir: 'dist',
    platform: 'node',
    entry: {
      cli: './src/cli/index.ts',
    },
    format: ['cjs'],
  },
  {
    ...baseConfig,
    entry: {
      'extension-manifest/index': './src/extension-manifest/index.ts',
    },
    format: ['esm', 'cjs'],
  },
  {
    ...baseConfig,
    splitting: true,
    sourcemap: false,
    treeshake: true,
    publicDir: './public',
    env: {
      NODE_ENV: 'production',
    },
    entry: [
      'src/index.ts',
      'src/constant/**/*@(ts|tsx)',
      'src/validation/**/*@(ts|tsx)',
      'src/interfaces/**/*@(ts|tsx)',
      'src/components/**/*@(ts|tsx)',
      'src/extension-api/**/*@(ts|tsx)',
    ],
    minify: false,
    format: ['esm'],
    async onSuccess() {
      await fs.copy(
        path.join(__dirname, 'src/extension-api'),
        path.join(__dirname, 'dist/extension-api'),
      );
    },
  },
]);
