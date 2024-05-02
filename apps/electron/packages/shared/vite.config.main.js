import { mergeConfig } from 'vite';
import { join } from 'path';
import baseConfig from './vite.config.base';

export default mergeConfig(baseConfig, {
  build: {
    lib: {
      entry: {
        main: join(__dirname, '/src/main.ts'),
      },
    },
  },
});
