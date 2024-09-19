import rootConfig from '../../tailwind.config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './src/**/**.{js,ts,jsx,tsx}',
    '../packages/extension/src/**/**.{js,ts,jsx,tsx}',
    '../../../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../../../packages/workflow/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [rootConfig],
};
