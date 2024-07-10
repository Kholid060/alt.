import { builtinModules } from 'module';
import { defineConfig } from 'tsup';
import path from 'path';
import fs from 'fs-extra';

const externalDeps = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@altdot/ui',
  'tsup',
  'fs-extra',
  'zod-validation-error',
  'commander',
  'vite',
  'vite-plugin-resolve',
  'glob',
  'semver',
  ...builtinModules,
];

export default defineConfig([
  {
    treeshake: true,
    splitting: true,
    env: {
      NODE_ENV: 'production',
    },
    publicDir: './public',
    entry: {
      cli: './src/cli/index.ts',
    },
    format: ['cjs'],
    noExternal: ['@altdot/shared'],
    minify: true,
    external: externalDeps,
    clean: false,
    esbuildOptions(options) {
      options.outbase = './src';
    },
  },
  {
    splitting: true,
    sourcemap: true,
    env: {
      NODE_ENV: 'production',
    },
    entry: {
      index: './src/index.ts',
    },
    bundle: true,
    clean: false,
    minify: true,
    format: ['esm'],
    outDir: 'dist',
    external: externalDeps,
    esbuildOptions(options) {
      options.outbase = './src';
    },
    async onSuccess() {
      await fs.copy(
        path.join(__dirname, 'src/extension-api'),
        path.join(__dirname, 'dist/extension-api'),
      );
    },
  },
]);
