import { defineConfig, Options } from 'tsup';

export default defineConfig((options) => {
  let buildOptions: Options = {};

  if (!options.watch) {
    buildOptions = {
      treeshake: true,
      env: {
        NODE_ENV: 'production',
      },
      entry: ['./src/**/*.ts?(x)'],
      format: ['esm'],
      dts: true,
      publicDir: './public',
      clean: true,
      esbuildOptions(esbuildOpts) {
        esbuildOpts.outbase = './src';
      },
      ...options,
    };
  } else {
    buildOptions = {
      sourcemap: true,
      entry: ['./src/index.ts'],
      bundle: !!options.watch,
      dts: true,
      publicDir: './public',
      format: ['esm'],
      outDir: 'dist',
      esbuildOptions(options) {
        options.outbase = './src';
      },
    };
  }

  return buildOptions;
});
