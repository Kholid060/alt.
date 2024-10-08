import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import react from '@astrojs/react';
import starlightLinksValidator from 'starlight-links-validator';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.altdot.app',
  redirects: {
    '/': '/basics/introduction',
  },
  integrations: [
    starlight({
      title: 'Alt. Docs',
      logo: {
        src: './src/assets/logo.svg',
      },
      customCss: ['./src/assets/css/style.css', '@altdot/ui/dist/theme.css'],
      social: {
        github: 'https://github.com/Kholid060/altdot',
      },
      sidebar: [
        {
          label: 'Basics',
          autogenerate: {
            directory: 'basics',
          },
        },
        {
          label: 'Extensions',
          autogenerate: {
            directory: 'extensions',
          },
        },
        {
          label: 'Workflows',
          autogenerate: {
            directory: 'workflows',
          },
        },
        {
          label: 'Reference',
          autogenerate: {
            collapsed: true,
            directory: 'reference',
          },
        },
      ],
      plugins: [starlightImageZoom(), starlightLinksValidator({ errorOnRelativeLinks: false })],
    }),
    react({
      experimentalReactChildren: true
    }),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
