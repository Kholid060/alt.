import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { builtinModules } from 'module';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  mode: process.env.MODE ?? 'production',
  resolve: {
    alias: {
      '@/': path.join(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      formats: ['es', 'cjs'],
      entry: {
        index: './src/index.ts',
        cli: './src/cli/index.ts',
      },
    },
    rollupOptions: {
      external: [
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
      ],
      output: {
        sourcemapExcludeSources: true,
      },
    },
    emptyOutDir: false,
  },
  plugins: [
    dts({ exclude: ['src/cli/**/*', 'src/extension-api/**/*'] }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/extension-api',
          dest: '',
        },
      ],
    }),
  ],
});
