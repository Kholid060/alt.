import sharedConfig from '@repo/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './packages/renderer/index.html',
    './packages/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
  presets: [sharedConfig],
};

