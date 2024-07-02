import sharedConfig from '@alt-dot/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../packages/extension/src/**/*.tsx',
    '../../../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../../../packages/workflow/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [sharedConfig],
};
