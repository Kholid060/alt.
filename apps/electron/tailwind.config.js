import sharedConfig from '@repo/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './packages/renderer/index.html',
    './packages/extension/src/**/*.tsx',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    './packages/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [sharedConfig],
};
