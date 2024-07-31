import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/': '/introduction'
	},
	integrations: [
		starlight({
			title: 'Alt. Docs',
			logo: {
				src: './src/assets/logo.svg'
			},
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			sidebar: [
				{
					label: 'Introduction',
					link: 'introduction',
				},
				{
					label: 'Extensions',
					autogenerate: { directory: 'extensions' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			plugins: [starlightImageZoom()],
		}),
	],
});
