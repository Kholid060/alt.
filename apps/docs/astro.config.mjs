import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/': '/basics/introduction'
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
					label: 'Basics',
					autogenerate: { directory: 'basics' },
				},
				{
					label: 'Extensions',
					autogenerate: { directory: 'extensions' },
				},
				{
					label: 'Workflow',
					autogenerate: { directory: 'workflow' },
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
