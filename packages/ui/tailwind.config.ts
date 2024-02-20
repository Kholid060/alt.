import { Config } from 'tailwindcss';
import sharedConfig from '@repo/tailwind-config';

const config: Config = {
  content: ['./src/**/*.tsx'],
  corePlugins: {
    preflight: false,
  },
  presets: [sharedConfig],
  safelist: ['.dark'],
  plugins: [require('tailwindcss-animate')],
};

export default config;