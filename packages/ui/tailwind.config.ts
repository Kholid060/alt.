import { Config } from 'tailwindcss';
import sharedConfig from '@repo/tailwind-config';

const config: Config = {
  content: ['./src/**/*.tsx'],
  prefix: 'ui-',
  corePlugins: {
    preflight: false,
  },
  presets: [sharedConfig],
  plugins: [require('tailwindcss-animate')],
};

export default config;