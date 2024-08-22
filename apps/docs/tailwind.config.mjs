import starlightPlugin from '@astrojs/starlight-tailwind';
import sharedConfig from '@altdot/tailwind-config';

const accent = { 200: '#b3c7ff', 600: '#364bff', 900: '#182775', 950: '#131e4f' };
const gray = { 100: '#f5f6f8', 200: '#eceef2', 300: '#c0c2c7', 400: '#888b96', 500: '#545861', 700: '#353841', 800: '#24272f', 900: '#17181c' };


/** @type {import('tailwindcss').Config} */
export default {
	content: [
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
	],
	theme: {
		extend: {
			colors: { accent, gray },
		},
	},
	plugins: [starlightPlugin()],
	presets: [sharedConfig],
}

import starlightPlugin from '@astrojs/starlight-tailwind';
