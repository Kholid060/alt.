import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  format: ['esm', 'cjs'],
  entry: ['./src/index.ts'],
  minify: !options.watch,
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  noExternal: ['@repo/ui', 'lucide-react'],
  ...options,
}));
