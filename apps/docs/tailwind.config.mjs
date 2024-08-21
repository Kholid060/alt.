import starlightPlugin from '@astrojs/starlight-tailwind';
import sharedConfig from '@altdot/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
	],
	theme: {
		extend: {},
	},
	plugins: [starlightPlugin()],
	presets: [sharedConfig],
}
