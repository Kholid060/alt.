import type { ExtensionManifest } from '@altdot/extension';
import { name, version } from './package.json';

const config: ExtensionManifest = {
  name,
  version,
  author: 'kholid060',
  icon: 'kill-process',
  title: 'Kill Process',
  description: 'Kill running process',
  categories: ['Applications', 'Productivity'],
  commands: [
    {
      type: 'view',
      name: 'kill-process',
      title: 'Kill Process',
    },
  ],
  permissions: ['shell', 'clipboard', 'childProcess'],
};

export default config;
