import sharedConfig from '@alt-dot/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '2rem',
        screens: {
          xl: '1152px',
          '2xl': '1152px',
        },
      },
    },
  },
  presets: [sharedConfig],
};
